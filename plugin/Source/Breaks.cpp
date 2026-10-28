#include "Breaks.h"

namespace
{
// Same as normalize() in src/lib/audio.ts: scales by the largest positive sample, not the largest absolute one.
void normalise (juce::AudioBuffer<float>& audio)
{
    float peak = 0.0f;
    for (int channel = 0; channel < audio.getNumChannels(); ++channel)
        for (auto sample : juce::Span (audio.getReadPointer (channel), (size_t) audio.getNumSamples()))
            peak = std::max (peak, sample);

    if (peak > 0.0f)
        audio.applyGain (32767.0f / 32768.0f / peak);
}
}

std::vector<scheduling::Slice> parseSlices (const juce::var& slices)
{
    std::vector<scheduling::Slice> result;
    if (auto* array = slices.getArray())
        for (const auto& slice : *array)
            result.push_back ({ (int) slice["start"], (int) slice["stepNum"] });
    return result;
}

std::unique_ptr<Break> loadBreakJson (const juce::String& json, bool shouldNormalise)
{
    const auto parsed = juce::JSON::parse (json);

    juce::MemoryOutputStream wav;
    if (! juce::Base64::convertFromBase64 (wav, parsed["base64"].toString()))
        return nullptr;

    std::unique_ptr<juce::AudioFormatReader> reader (
        juce::WavAudioFormat().createReaderFor (new juce::MemoryInputStream (wav.getMemoryBlock(), true), true));
    if (reader == nullptr)
        return nullptr;

    auto result = std::make_unique<Break>();
    result->name = parsed["name"].toString();
    result->slicesJson = parsed["slices"];
    result->slices = parseSlices (result->slicesJson);
    result->audio.setSize (2, (int) reader->lengthInSamples);
    reader->read (&result->audio, 0, (int) reader->lengthInSamples, 0, true, true);
    if (shouldNormalise)
        normalise (result->audio);
    return result;
}

BreakLibrary::BreakLibrary()
{
    for (const auto& file : getFactoryFolder().findChildFiles (juce::File::findFiles, false, "*.json"))
        if (auto loaded = loadBreakJson (file.loadFileAsString()))
            breaks.push_back (std::move (loaded));
}

const Break* BreakLibrary::find (const juce::String& name) const
{
    for (const auto& b : breaks)
        if (b->name == name)
            return b.get();
    return nullptr;
}

juce::File BreakLibrary::getFactoryFolder()
{
    auto folder = juce::File::getSpecialLocation (juce::File::commonApplicationDataDirectory)
#if JUCE_MAC
                      .getChildFile ("Application Support")
#endif
                      .getChildFile ("Jungle Tool/Library");
#ifdef JUNGLE_TOOL_DEV_LIBRARY
    if (! folder.isDirectory())
        return juce::File (JUNGLE_TOOL_DEV_LIBRARY);
#endif
    return folder;
}
