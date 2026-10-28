// Renders MIDI steps through the engine to a WAV file, without a DAW.
#include "../Source/Engine.h"

int main (int argc, char** argv)
{
    if (argc < 2)
    {
        std::puts ("usage: Render <out.wav> [break name] [--sequencer | --audition | --midi] [start offset in samples]");
        return 1;
    }

    const auto loadStart = juce::Time::getMillisecondCounterHiRes();
    BreakLibrary library;
    std::printf ("loaded breaks in %.0f ms\n", juce::Time::getMillisecondCounterHiRes() - loadStart);

    const auto sequencer = argc > 3 && juce::String (argv[3]) == "--sequencer";
    const auto audition = argc > 3 && juce::String (argv[3]) == "--audition";
    const auto offset = argc > 4 ? juce::String (argv[4]).getIntValue() : 0;
    // A .json path loads an imported break the way the plugin saves them: already normalised.
    std::unique_ptr<Break> imported;
    if (argc > 2 && juce::String (argv[2]).endsWith (".json"))
        imported = loadBreakJson (juce::File (argv[2]).loadFileAsString(), false);
    const auto* source = imported != nullptr ? imported.get() : library.find (argc > 2 ? argv[2] : "Amen, Brother (1)");
    if (source == nullptr)
    {
        std::puts ("break not found");
        return 1;
    }

    constexpr double sampleRate = 48000.0;
    // Divides one bar at 160 BPM exactly, so the sequencer stops on the bar line like the MIDI notes do.
    constexpr int blockSize = 500;
    Engine engine;
    engine.prepare (sampleRate);

    auto state = std::make_unique<EngineState>();
    auto& layer = state->layers.emplace_back();
    layer.source = source;
    layer.slices = source->slices;
    state->sequencerMode = sequencer;
    for (int step = 0; step < 16; ++step)
        state->arrangement.push_back ({ step, step });
    engine.publish (std::move (state));

    // One bar of steps 0-15 at 160 BPM, velocity 100, from MIDI notes or the host-synced sequencer.
    const auto stepSamples = (int) (60.0 / 160.0 / 4.0 * sampleRate);
    juce::AudioBuffer<float> rendered (2, stepSamples * 16 + (int) sampleRate);
    rendered.clear();

    for (int start = 0; start < rendered.getNumSamples(); start += blockSize)
    {
        const auto length = std::min (blockSize, rendered.getNumSamples() - start);
        juce::MidiBuffer midi;
        Engine::Transport transport;
        transport.hostBpm = 160.0;
        transport.parameters.volume.fill (1.0f);
        transport.hostPlaying = sequencer;
        // In sequencer mode one held note plays the bar, as a pattern clip in the DAW would.
        if (sequencer && start <= offset && offset < start + length)
            midi.addEvent (juce::MidiMessage::noteOn (1, 60, (juce::uint8) 100), offset - start);
        if (const auto end = offset + stepSamples * 16; sequencer && start <= end && end < start + length)
            midi.addEvent (juce::MidiMessage::noteOff (1, 60), end - start);
        transport.auditioning = audition && start < stepSamples * 16;
        for (int step = 0; step < 16 && ! sequencer && ! audition; ++step)
            if (const auto at = offset + step * stepSamples - start; at >= 0 && at < length)
                midi.addEvent (juce::MidiMessage::noteOn (1, 36 + step, (juce::uint8) 100), at);

        juce::AudioBuffer<float> block (rendered.getArrayOfWritePointers(), 2, start, length);
        engine.process (block, midi, transport);
    }

    std::printf ("rms %.4f peak %.4f\n", rendered.getRMSLevel (0, 0, rendered.getNumSamples()), rendered.getMagnitude (0, rendered.getNumSamples()));

    juce::File out (juce::File::getCurrentWorkingDirectory().getChildFile (argv[1]));
    out.deleteFile();
    std::unique_ptr<juce::OutputStream> stream = std::make_unique<juce::FileOutputStream> (out);
    auto writer = juce::WavAudioFormat().createWriterFor (
        stream, juce::AudioFormatWriterOptions {}.withSampleRate (sampleRate).withNumChannels (2).withBitsPerSample (24));
    writer->writeFromAudioSampleBuffer (rendered, 0, rendered.getNumSamples());
    return 0;
}
