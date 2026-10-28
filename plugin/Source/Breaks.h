#pragma once

#include "Scheduling.h"
#include <juce_audio_formats/juce_audio_formats.h>

// One factory break: its normalised stereo audio at 44.1 kHz, as loadJson.ts decodes it, and its shipped slices.
struct Break
{
    juce::String name;
    juce::AudioBuffer<float> audio;
    std::vector<scheduling::Slice> slices;
    juce::var slicesJson;
};

std::vector<scheduling::Slice> parseSlices (const juce::var&);

// The factory breaks, loaded once and shared by every plugin instance in the process.
class BreakLibrary
{
public:
    BreakLibrary();

    const Break* find (const juce::String& name) const;

    static juce::File getFactoryFolder();
    // Where imported breaks are kept, per user.
    static juce::File getUserFolder();

private:
    std::vector<std::unique_ptr<Break>> breaks;
};

// Imported breaks are stored already normalised, so they skip the normalise step.
std::unique_ptr<Break> loadBreakJson (const juce::String& json, bool shouldNormalise = true);
