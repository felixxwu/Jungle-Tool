#include "Engine.h"

namespace
{
constexpr float masterTrim = 0.3f;
constexpr double breakSampleRate = 44100.0;
constexpr double volumeTimeConstant = 0.015;

float hermite (float xm1, float x0, float x1, float x2, float t)
{
    const auto c1 = 0.5f * (x1 - xm1);
    const auto c2 = xm1 - 2.5f * x0 + 2.0f * x1 - 0.5f * x2;
    const auto c3 = 0.5f * (x2 - xm1) + 1.5f * (x0 - x1);
    return ((c3 * t + c2) * t + c1) * t + x0;
}
}

Engine::~Engine()
{
    delete incoming.exchange (nullptr);
    delete outgoing.exchange (nullptr);
}

void Engine::prepare (double newSampleRate)
{
    sampleRate = newSampleRate;
    smoothing = (float) (1.0 - std::exp (-1.0 / (volumeTimeConstant * sampleRate)));
    oversampling.initProcessing (maxChunk);
    oversampling.reset();
    layerGain.fill (-1.0f);
    for (auto& voice : voices)
        voice.active = false;
}

void Engine::publish (std::unique_ptr<EngineState> state)
{
    delete outgoing.exchange (nullptr);
    delete incoming.exchange (state.release());
}

void Engine::takeNewState()
{
    // Wait until the message thread has freed the last state we handed back, so we never free memory here.
    if (outgoing.load() != nullptr)
        return;

    auto* next = incoming.exchange (nullptr);
    if (next == nullptr)
        return;

    // Swapping or removing a layer's break cuts its sounding notes, as the web app disconnects its gain node.
    for (auto& voice : voices)
        if (voice.active && voice.layer >= 0
            && ((size_t) voice.layer >= next->layers.size() || next->layers[(size_t) voice.layer].source != voice.source))
            voice.active = false;

    for (auto layer = next->layers.size(); layer < (size_t) maxLayers; ++layer)
        layerGain[layer] = -1.0f;

    outgoing.store (active.release());
    active.reset (next);

    const auto& preview = active->preview;
    if (preview.serial == previewSerial)
        return;

    previewSerial = preview.serial;
    for (auto& voice : voices)
        if (voice.layer < 0)
            voice.active = false;

    if (preview.source == nullptr || preview.end <= preview.start)
        return;

    auto& voice = allocateVoice();
    voice = {};
    voice.active = true;
    voice.source = preview.source;
    voice.regionStart = preview.start;
    voice.regionLength = std::min (preview.end, preview.source->audio.getNumSamples()) - preview.start;
    voice.loop = preview.loop;
    voice.rate = breakSampleRate / sampleRate;
    voice.age = voiceCounter++;
    voice.active = voice.regionLength > 0;
}

void Engine::process (juce::AudioBuffer<float>& buffer, const juce::MidiBuffer& midi, const Transport& transport)
{
    takeNewState();
    output = &buffer;
    buffer.clear();
    numTriggers = 0;
    parameters = transport.parameters;

    const auto numSamples = buffer.getNumSamples();
    const auto auditioning = transport.auditioning && ! transport.hostPlaying;
    // Auditioning runs at the BPM slider's tempo; everything else follows the host when it reports one.
    const auto bpm = auditioning ? active->bpm : transport.hostBpm.value_or (active->bpm);
    const auto samplesPerStep = 60.0 / bpm / 4.0 * sampleRate;
    const auto length = active->numBars * 16.0;
    const auto blockSteps = numSamples / samplesPerStep;

    if (auditioning && ! wasAuditioning)
        auditionStep = 0.0;
    if (! auditioning && wasAuditioning)
        addStop (0);
    const auto auditionStart = auditionStep;
    if (auditioning)
    {
        collectArrangementTriggers (auditionStep, numSamples, samplesPerStep, 0);
        auditionStep += blockSteps;
    }
    wasAuditioning = auditioning;

    const auto patternStart = patternStep;
    if (active->sequencerMode)
    {
        // Holding any note plays the arrangement from step 0; releasing every note stops it.
        int segmentStart = 0;
        const auto advanceTo = [&] (int until)
        {
            if (patternPlaying && until > segmentStart)
            {
                const auto steps = (until - segmentStart) / samplesPerStep;
                collectArrangementTriggers (patternStep, until - segmentStart, samplesPerStep, segmentStart);
                patternStep += steps;
            }
            segmentStart = until;
        };

        for (const auto metadata : midi)
        {
            const auto message = metadata.getMessage();
            const auto at = std::clamp (metadata.samplePosition, 0, numSamples - 1);
            if (message.isNoteOn())
            {
                advanceTo (at);
                patternStep = 0.0;
                patternPlaying = true;
                ++heldNotes;
            }
            else if (message.isNoteOff() || message.isAllNotesOff() || message.isAllSoundOff())
            {
                advanceTo (at);
                heldNotes = message.isNoteOff() ? std::max (0, heldNotes - 1) : 0;
                if (heldNotes == 0 && patternPlaying)
                {
                    patternPlaying = false;
                    addStop (at);
                }
            }
        }
        advanceTo (numSamples);
    }
    else
    {
        if (patternPlaying)
            addStop (0);
        patternPlaying = false;
        heldNotes = 0;

        for (const auto metadata : midi)
        {
            const auto message = metadata.getMessage();
            const auto step = message.getNoteNumber() - 36;
            if (! message.isNoteOn() || step < 0 || step > 15 || numTriggers == (int) triggers.size())
                continue;
            // Velocity 100 is unity, so a clip dragged out of the plugin sounds like the sequencer.
            triggers[(size_t) numTriggers++] = { std::clamp (metadata.samplePosition, 0, numSamples - 1), step, 0, (float) message.getVelocity() / 100.0f, false };
        }
    }

    playheadBpm = bpm;
    if (patternPlaying)
        playheadStep = std::fmod (patternStart, length);
    else if (auditioning)
        playheadStep = std::fmod (auditionStart, length);
    else
        playheadStep = -1.0;

    // Insertion sort, because std::stable_sort may allocate on the audio thread.
    for (int i = 1; i < numTriggers; ++i)
        for (int j = i; j > 0 && triggers[(size_t) j].offset < triggers[(size_t) j - 1].offset; --j)
            std::swap (triggers[(size_t) j], triggers[(size_t) j - 1]);

    int position = 0;
    for (int i = 0; i < numTriggers; ++i)
    {
        const auto& trigger = triggers[(size_t) i];
        render (position, trigger.offset - position);
        position = trigger.offset;
        triggerStep (trigger, bpm);
    }
    render (position, numSamples - position);
}

void Engine::addStop (int offset)
{
    if (numTriggers < (int) triggers.size())
        triggers[(size_t) numTriggers++] = { offset, 0, 0, 0.0f, false, true };
}

void Engine::collectArrangementTriggers (double fromStep, int numSegmentSamples, double samplesPerStep, int baseOffset)
{
    const auto length = active->numBars * 16.0;
    const auto toStep = fromStep + numSegmentSamples / samplesPerStep;

    for (const auto& note : active->arrangement)
    {
        const auto onset = scheduling::swungStep (note.startStep, parameters.swing);
        for (auto pass = std::floor (fromStep / length) * length - length; pass < toStep + length; pass += length)
        {
            // Decided by the rounded sample, so a note on a block boundary lands in exactly one block,
            // whatever tiny error adding up step positions block by block has left.
            const auto offset = std::lround ((pass + onset - fromStep) * samplesPerStep);
            if (pass + onset < 0.0 || offset < 0 || offset >= numSegmentSamples || numTriggers == (int) triggers.size())
                continue;
            triggers[(size_t) numTriggers++] = { baseOffset + (int) offset, note.stepNumToPlay, note.startStep, 1.0f, true };
        }
    }
}

void Engine::fadeOutLayerVoices()
{
    // Stopping the arrangement ramps everything down over 20 ms, like stopScheduler.
    const auto fade = (int64_t) std::llround (0.02 * sampleRate);
    for (auto& voice : voices)
        if (voice.active && voice.layer >= 0 && (voice.stop < 0 || voice.stop > voice.played + fade))
        {
            voice.fadeStart = voice.played;
            voice.stop = voice.played + fade;
        }
}

float Engine::layerVolume (size_t layer) const
{
    const auto& state = active->layers[layer];
    return state.slot >= 0 ? parameters.volume[(size_t) state.slot] : state.volume;
}

int Engine::layerPitch (size_t layer) const
{
    const auto& state = active->layers[layer];
    return state.slot >= 0 ? parameters.pitch[(size_t) state.slot] : state.pitch;
}

void Engine::triggerStep (const Trigger& trigger, double bpm)
{
    if (trigger.stop)
        return fadeOutLayerVoices();

    scheduling::Settings settings;
    settings.fillGaps = active->fillGaps;
    settings.shortenNotes = active->shortenNotes;
    settings.noteLengthMs = parameters.noteLengthMs;
    settings.noteFadeOutMs = parameters.noteFadeOutMs;
    settings.bpm = bpm;
    settings.sampleRate = sampleRate;
    settings.swing = trigger.swung ? parameters.swing : 0.0;

    const auto numLayers = std::min (active->layers.size(), (size_t) maxLayers);
    for (size_t layer = 0; layer < numLayers; ++layer)
    {
        const auto& state = active->layers[layer];
        if (state.source == nullptr)
            continue;

        const auto note = scheduling::planNote (state.slices, state.source->audio.getNumSamples(), trigger.stepNum, settings, trigger.startStep);
        if (! note)
            continue;

        auto& voice = allocateVoice();
        voice = {};
        voice.active = true;
        voice.layer = (int) layer;
        voice.source = state.source;
        voice.regionStart = note->regionStart;
        voice.regionLength = note->regionEnd - note->regionStart;
        voice.reversedTail = active->fillGaps;
        // Pitch is read at note-on, so pitch automation only affects new notes, as in the web app.
        voice.rate = std::pow (2.0, layerPitch (layer) / 12.0) * breakSampleRate / sampleRate;
        voice.gain = trigger.velocity;
        voice.age = voiceCounter++;
        voice.fadeStart = note->fadeStart;
        voice.stop = note->stop;
    }
}

Engine::Voice& Engine::allocateVoice()
{
    int numActive = 0;
    Voice* oldest = nullptr;
    Voice* spare = nullptr;
    for (auto& voice : voices)
    {
        if (! voice.active)
        {
            spare = spare != nullptr ? spare : &voice;
            continue;
        }
        ++numActive;
        if (oldest == nullptr || voice.age < oldest->age)
            oldest = &voice;
    }

    if (spare == nullptr)
        return *oldest;

    // Over the limit, the oldest voice fades out over the declick time and a spare slot is used meanwhile.
    if (numActive >= numVoices && oldest != nullptr)
    {
        const auto declick = (int64_t) std::llround (scheduling::declickSeconds * sampleRate);
        if (oldest->stop < 0 || oldest->stop > oldest->played + declick)
        {
            oldest->fadeStart = oldest->played;
            oldest->stop = oldest->played + declick;
        }
        oldest->age = std::numeric_limits<int64_t>::max();
    }
    return *spare;
}

float Engine::renderVoice (Voice& voice, int channel, double position) const
{
    const auto length = voice.regionLength * (voice.reversedTail ? 2 : 1);
    const auto* samples = voice.source->audio.getReadPointer (std::min (channel, voice.source->audio.getNumChannels() - 1));
    const auto sampleAt = [&] (int index)
    {
        index = std::clamp (index, 0, length - 1);
        // Fill Gaps plays the slice and then the same slice reversed.
        const auto offset = index < voice.regionLength ? index : 2 * voice.regionLength - 1 - index;
        return samples[voice.regionStart + offset];
    };

    const auto index = (int) position;
    const auto t = (float) (position - index);
    return hermite (sampleAt (index - 1), sampleAt (index), sampleAt (index + 1), sampleAt (index + 2), t);
}

void Engine::render (int start, int numSamples)
{
    const auto numLayers = std::min (active->layers.size(), (size_t) maxLayers);

    while (numSamples > 0)
    {
        const auto length = std::min (numSamples, maxChunk);
        layerBus.clear (0, length);
        previewBus.clear (0, length);

        for (size_t layer = 0; layer < numLayers; ++layer)
        {
            const auto target = layerVolume (layer);
            auto& gain = layerGain[layer];
            if (gain < 0.0f)
                gain = target;
            for (int i = 0; i < length; ++i)
                layerGainRamp[layer][(size_t) i] = gain += (target - gain) * smoothing;
        }

        for (auto& voice : voices)
        {
            if (! voice.active)
                continue;

            auto& bus = voice.layer < 0 ? previewBus : layerBus;
            const auto voiceLength = voice.regionLength * (voice.reversedTail ? 2 : 1);

            for (int i = 0; i < length; ++i)
            {
                float envelope = 1.0f;
                if (voice.stop >= 0)
                {
                    if (voice.played >= voice.stop)
                    {
                        voice.active = false;
                        break;
                    }
                    if (voice.played >= voice.fadeStart)
                        envelope = (float) (voice.stop - voice.played) / (float) std::max<int64_t> (1, voice.stop - voice.fadeStart);
                }

                const auto gain = voice.gain * envelope * (voice.layer < 0 ? 1.0f : layerGainRamp[(size_t) voice.layer][(size_t) i]);
                for (int channel = 0; channel < 2; ++channel)
                    bus.addSample (channel, i, renderVoice (voice, channel, voice.position) * gain);

                voice.position += voice.rate;
                ++voice.played;
                if (voice.position >= voiceLength)
                {
                    if (! voice.loop)
                    {
                        voice.active = false;
                        break;
                    }
                    voice.position -= voiceLength;
                }
            }
        }

        juce::dsp::AudioBlock<float> layerBlock (layerBus);
        saturate (layerBlock.getSubBlock (0, (size_t) length));

        for (int channel = 0; channel < output->getNumChannels(); ++channel)
        {
            output->addFrom (channel, start, layerBus, std::min (channel, 1), 0, length, masterTrim);
            output->addFrom (channel, start, previewBus, std::min (channel, 1), 0, length, masterTrim);
        }

        start += length;
        numSamples -= length;
    }
}

// Same curve as src/lib/saturationCurve.ts, oversampled 4x like the WaveShaperNode in graph.ts.
void Engine::saturate (juce::dsp::AudioBlock<float> block)
{
    const auto saturation = (float) parameters.saturation;
    const auto mix = std::min (saturation * 2.0f, 100.0f) / 100.0f;
    const auto drive = juce::Decibels::decibelsToGain (saturation < 50.0f ? 0.0f : (saturation - 50.0f) / 50.0f * 12.0f);

    auto upsampled = oversampling.processSamplesUp (block);
    for (size_t channel = 0; channel < upsampled.getNumChannels(); ++channel)
    {
        auto* samples = upsampled.getChannelPointer (channel);
        for (size_t i = 0; i < upsampled.getNumSamples(); ++i)
        {
            // WaveShaperNode clamps its input, so a layer sum beyond +/-1 clips, dry part included.
            const auto x = std::clamp (samples[i], -1.0f, 1.0f);
            const auto wet = std::sin (std::clamp (x * drive, -1.0f, 1.0f) * juce::MathConstants<float>::halfPi);
            samples[i] = wet * mix + x * (1.0f - mix);
        }
    }
    oversampling.processSamplesDown (block);
}
