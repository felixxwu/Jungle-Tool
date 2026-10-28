#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace
{
struct GlobalParameter
{
    const char* id;
    const char* name;
    int min, max, defaultValue;
};

// The ids match the arrangement's field names, so state and parameters convert directly.
constexpr GlobalParameter globalParameters[] {
    { "saturation", "Saturation", 0, 100, 50 },
    { "swing", "Swing", 0, 33, 17 },
    { "noteLength", "Note Length", 10, 200, 200 },
    { "noteFadeOut", "Note Fade Out", 10, 200, 10 },
};

juce::String volumeId (int slot) { return "volume" + juce::String (slot + 1); }
juce::String pitchId (int slot) { return "pitch" + juce::String (slot + 1); }

constexpr double gestureIdleMs = 700.0;

// Layers that own a parameter slot: everything except a preview layer, in order.
template <typename Callback>
void forEachSlot (const juce::var& layers, Callback&& callback)
{
    int slot = 0;
    if (auto* array = layers.getArray())
        for (const auto& layer : *array)
            if (! (bool) layer["temp"] && slot < Engine::numSlots)
                callback (slot++, layer);
}
}

JungleToolProcessor::JungleToolProcessor()
    : AudioProcessor (BusesProperties().withOutput ("Output", juce::AudioChannelSet::stereo(), true))
{
    const auto add = [this] (const juce::String& id, const juce::String& name, int min, int max, int defaultValue)
    {
        auto* p = new juce::AudioParameterInt ({ id, 1 }, name, min, max, defaultValue);
        p->addListener (this);
        parameters[id] = p;
        addParameter (p);
    };

    for (int slot = 0; slot < numSlots; ++slot)
    {
        const auto number = juce::String (slot + 1);
        add (volumeId (slot), "Layer " + number + " Volume", 0, 100, 100);
        add (pitchId (slot), "Layer " + number + " Pitch", -12, 12, 0);
    }
    for (const auto& global : globalParameters)
        add (global.id, global.name, global.min, global.max, global.defaultValue);

    publishEngineState();
}

juce::AudioParameterInt& JungleToolProcessor::parameter (const juce::String& id) const
{
    return *parameters.at (id);
}

void JungleToolProcessor::prepareToPlay (double sampleRate, int)
{
    engine.prepare (sampleRate);
}

bool JungleToolProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    return layouts.getMainOutputChannelSet() == juce::AudioChannelSet::stereo();
}

void JungleToolProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi)
{
    juce::ScopedNoDenormals noDenormals;

    Engine::Transport transport;
    if (auto* playHead = getPlayHead())
    {
        if (auto position = playHead->getPosition())
        {
            transport.hostPlaying = position->getIsPlaying();
            if (const auto bpm = position->getBpm())
                transport.hostBpm = *bpm;
        }
    }

    hostPlaying = transport.hostPlaying;
    hostBpm = transport.hostBpm.value_or (0.0);
    // The audition stops for good when the host starts; pressing play again restarts it.
    if (transport.hostPlaying)
        auditioning = false;
    transport.auditioning = auditioning;

    auto& values = transport.parameters;
    for (int slot = 0; slot < numSlots; ++slot)
    {
        values.volume[(size_t) slot] = (float) parameter (volumeId (slot)).get() / 100.0f;
        values.pitch[(size_t) slot] = parameter (pitchId (slot)).get();
    }
    values.saturation = parameter ("saturation").get();
    values.swing = parameter ("swing").get();
    values.noteLengthMs = parameter ("noteLength").get();
    values.noteFadeOutMs = parameter ("noteFadeOut").get();

    engine.process (buffer, midi, transport);
}

juce::AudioProcessorEditor* JungleToolProcessor::createEditor()
{
    return new JungleToolEditor (*this);
}

void JungleToolProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    juce::MemoryOutputStream (destData, false).writeString (getSavedState());
}

void JungleToolProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    loadState (juce::MemoryInputStream (data, (size_t) sizeInBytes, false).readString());
}

void JungleToolProcessor::loadState (const juce::String& json)
{
    const auto loaded = juce::JSON::parse (json);
    if (! loaded.isObject())
        return;

    {
        const juce::ScopedLock lock (stateLock);
        state = loaded;
        sliceEdits.clear();
        if (auto* edits = loaded["sliceEdits"].getDynamicObject())
            for (const auto& edit : edits->getProperties())
                sliceEdits[edit.name.toString()] = edit.value;

        // Imported loops live only in the project, audio included.
        std::vector<ProjectBreak> loadedBreaks;
        if (auto* entries = loaded["projectBreaks"].getArray())
        {
            for (const auto& entry : *entries)
            {
                ProjectBreak projectBreak { entry["id"].toString(), entry["name"].toString(), nullptr, entry["json"].toString() };
                const auto existing = std::find_if (projectBreaks.begin(), projectBreaks.end(), [&] (const ProjectBreak& b) { return b.id == projectBreak.id; });
                if (existing != projectBreaks.end() && existing->audio != nullptr)
                    projectBreak.audio = std::move (existing->audio);
                else
                    projectBreak.audio = loadBreakJson (projectBreak.json, false);
                loadedBreaks.push_back (std::move (projectBreak));
            }
        }
        for (auto& old : projectBreaks)
            if (old.audio != nullptr)
                retiredBreaks.push_back (std::move (old.audio));
        projectBreaks = std::move (loadedBreaks);
    }

    // A loaded project sets the parameters; after that only the DAW and the UI's edits change them.
    const auto& arrangement = loaded["arrangement"];
    forEachSlot (arrangement["layers"], [this] (int slot, const juce::var& layer)
                 {
                     parameter (volumeId (slot)) = std::min (100, (int) layer["volume"]);
                     parameter (pitchId (slot)) = (int) layer["pitch"];
                 });
    for (const auto& global : globalParameters)
        if (! arrangement[global.id].isVoid())
            parameter (global.id) = (int) arrangement[global.id];

    publishEngineState();
}

juce::String JungleToolProcessor::getSavedState() const
{
    const juce::ScopedLock lock (stateLock);
    auto saved = juce::JSON::parse (juce::JSON::toString (state, true));
    if (! saved.isObject())
        saved = new juce::DynamicObject();

    auto arrangement = saved["arrangement"];
    if (auto* object = arrangement.getDynamicObject())
    {
        // Previews never outlive the editor: a preview layer is dropped and an unkept replace reverts.
        juce::Array<juce::var> layers;
        if (auto* array = arrangement["layers"].getArray())
            for (const auto& layer : *array)
                if (! (bool) layer["temp"])
                    layers.add (layer["replacing"].isObject() ? layer["replacing"] : layer);

        forEachSlot (juce::var (layers), [this] (int slot, const juce::var& layer)
                     {
                         if (auto* layerObject = layer.getDynamicObject())
                         {
                             layerObject->setProperty ("volume", parameter (volumeId (slot)).get());
                             layerObject->setProperty ("pitch", parameter (pitchId (slot)).get());
                         }
                     });
        object->setProperty ("layers", layers);
        for (const auto& global : globalParameters)
            object->setProperty (global.id, parameter (global.id).get());
    }

    juce::Array<juce::var> savedBreaks;
    for (const auto& projectBreak : projectBreaks)
    {
        if (projectBreak.id.isEmpty())
            continue;
        auto* entry = new juce::DynamicObject();
        entry->setProperty ("id", projectBreak.id);
        entry->setProperty ("name", projectBreak.name);
        entry->setProperty ("json", projectBreak.json);
        savedBreaks.add (juce::var (entry));
    }
    saved.getDynamicObject()->setProperty ("projectBreaks", savedBreaks);

    auto* edits = new juce::DynamicObject();
    for (const auto& [name, slices] : sliceEdits)
        edits->setProperty (name, slices);
    saved.getDynamicObject()->setProperty ("sliceEdits", juce::var (edits));

    return juce::JSON::toString (saved, true);
}

void JungleToolProcessor::setUiState (const juce::String& json)
{
    {
        const juce::ScopedLock lock (stateLock);
        const auto parsed = juce::JSON::parse (json);
        if (! parsed.isObject())
            return;
        // Slice edits arrive separately through setSlices.
        state = parsed;
    }
    publishEngineState();
}

void JungleToolProcessor::dropPreviews()
{
    loadState (getSavedState());
}

void JungleToolProcessor::setParametersFromUi (const juce::var& changes)
{
    const auto now = juce::Time::getMillisecondCounterHiRes();
    if (auto* array = changes.getArray())
    {
        for (const auto& change : *array)
        {
            const auto id = change[0].toString();
            if (parameters.count (id) == 0)
                continue;

            // One undo step per slider drag or randomise: the gesture stays open until the UI goes quiet.
            auto& p = parameter (id);
            if (openGestures.count (id) == 0)
                p.beginChangeGesture();
            openGestures[id] = now;
            p = (int) change[1];
        }
    }
    startTimer (100);
}

void JungleToolProcessor::timerCallback()
{
    const auto now = juce::Time::getMillisecondCounterHiRes();
    for (auto it = openGestures.begin(); it != openGestures.end();)
    {
        if (now - it->second < gestureIdleMs)
        {
            ++it;
            continue;
        }
        parameter (it->first).endChangeGesture();
        it = openGestures.erase (it);
    }
    if (openGestures.empty())
        stopTimer();
}

juce::var JungleToolProcessor::getParameterValues() const
{
    auto* values = new juce::DynamicObject();
    for (const auto& [id, p] : parameters)
        values->setProperty (id, p->get());
    return values;
}

void JungleToolProcessor::setSlices (const juce::String& breakName, const juce::var& slices)
{
    {
        const juce::ScopedLock lock (stateLock);
        // Only breaks this project changed are saved.
        // An imported break never matches here, so its slices are always saved with the project.
        const auto* source = library->find (breakName);
        if (source != nullptr && juce::JSON::toString (source->slicesJson, true) == juce::JSON::toString (slices, true))
            sliceEdits.erase (breakName);
        else
            sliceEdits[breakName] = slices;
    }
    publishEngineState();
}

void JungleToolProcessor::playPreview (const juce::String& breakName, int start, int end, bool loop)
{
    {
        const juce::ScopedLock lock (stateLock);
        preview = { findBreak (breakName), start, end, loop, preview.serial + 1 };
    }
    publishEngineState();
}

void JungleToolProcessor::stopPreview()
{
    {
        const juce::ScopedLock lock (stateLock);
        preview = { nullptr, 0, 0, false, preview.serial + 1 };
    }
    publishEngineState();
}

const Break* JungleToolProcessor::findBreak (const juce::String& name) const
{
    if (const auto* factory = library->find (name))
        return factory;
    for (const auto& projectBreak : projectBreaks)
        if (projectBreak.name == name)
            return projectBreak.audio.get();
    return nullptr;
}

juce::String JungleToolProcessor::addProjectBreak (const juce::String& name, const juce::String& json, bool keep)
{
    const auto id = keep ? juce::Uuid().toString() : juce::String();
    {
        const juce::ScopedLock lock (stateLock);
        // Keeping it after the trim replaces the copy held while it was being trimmed.
        auto existing = std::find_if (projectBreaks.begin(), projectBreaks.end(), [&] (const ProjectBreak& b) { return b.id.isEmpty() && b.name == name; });
        if (existing == projectBreaks.end())
            existing = projectBreaks.insert (projectBreaks.end(), ProjectBreak {});
        existing->id = id;
        existing->name = name;
        if (existing->audio != nullptr)
            retiredBreaks.push_back (std::move (existing->audio));
        existing->audio = loadBreakJson (json, false);
        existing->json = keep ? json : juce::String();
    }
    publishEngineState();
    return id;
}

juce::String JungleToolProcessor::getProjectBreakJson (const juce::String& id) const
{
    const juce::ScopedLock lock (stateLock);
    for (const auto& projectBreak : projectBreaks)
        if (projectBreak.id.isNotEmpty() && projectBreak.id == id)
            return projectBreak.json;
    return {};
}

void JungleToolProcessor::setAuditioning (bool shouldAudition)
{
    auditioning = shouldAudition && ! hostPlaying;
}

std::optional<double> JungleToolProcessor::getHostBpm() const
{
    if (const auto bpm = hostBpm.load(); bpm > 0.0)
        return bpm;
    return std::nullopt;
}

void JungleToolProcessor::publishEngineState()
{
    const juce::ScopedLock lock (stateLock);
    auto engineState = std::make_unique<EngineState>();
    const auto& arrangement = state["arrangement"];

    int slot = 0;
    if (auto* layers = arrangement["layers"].getArray())
    {
        for (const auto& layer : *layers)
        {
            const auto name = layer["filename"].toString();
            auto& engineLayer = engineState->layers.emplace_back();
            engineLayer.source = findBreak (name);
            engineLayer.volume = (float) (double) layer["volume"] / 100.0f;
            engineLayer.pitch = (int) layer["pitch"];

            // A replace candidate sits in its slot but plays its own values until it's kept.
            const auto isPreview = (bool) layer["temp"];
            if (! isPreview && slot < numSlots)
                engineLayer.slot = layer["replacing"].isObject() ? -1 : slot;
            if (! isPreview)
                ++slot;

            if (const auto edited = sliceEdits.find (name); edited != sliceEdits.end())
                engineLayer.slices = parseSlices (edited->second);
            else if (engineLayer.source != nullptr)
                engineLayer.slices = engineLayer.source->slices;
        }
    }

    const auto valueOr = [&] (const char* key, auto fallback)
    {
        const auto& value = arrangement[key];
        return value.isVoid() ? fallback : static_cast<decltype (fallback)> (value);
    };
    engineState->fillGaps = valueOr ("fillGaps", engineState->fillGaps);
    engineState->shortenNotes = valueOr ("shortenNotes", engineState->shortenNotes);
    engineState->bpm = valueOr ("bpm", engineState->bpm);
    engineState->numBars = std::max (1, valueOr ("numBars", engineState->numBars));
    engineState->sequencerMode = state["mode"].toString() == "sequencer";
    engineState->preview = preview;
    if (auto* notes = arrangement["arrangement"].getArray())
        for (const auto& note : *notes)
            engineState->arrangement.push_back ({ (int) note["stepNumToPlay"], (int) note["startStep"] });

    engine.publish (std::move (engineState));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new JungleToolProcessor();
}
