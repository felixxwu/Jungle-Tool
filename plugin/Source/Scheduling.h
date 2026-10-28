#pragma once

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <optional>
#include <vector>

// Where a triggered slice starts and stops, following getScheduledNotes.ts and fireNote.ts.
namespace scheduling
{
struct Slice
{
    int start = 0;
    int stepNum = 0;
};

struct Settings
{
    bool fillGaps = true;
    bool shortenNotes = false;
    double noteLengthMs = 0.0;
    double noteFadeOutMs = 0.0;
    double bpm = 160.0;
    double sampleRate = 44100.0;
    // Percent of a step that odd steps are delayed by. MIDI input is never swung, so it passes 0.
    double swing = 0.0;
};

// Odd steps start late by swing% of a step, as in getScheduledNotes.
inline double swungStep (int step, double swing)
{
    return step + (step % 2 != 0 ? swing / 100.0 : 0.0);
}

struct PlannedNote
{
    int regionStart = 0;
    int regionEnd = 0;
    // In output samples from note-on; -1 when the note just plays to its end.
    int64_t fadeStart = -1;
    int64_t stop = -1;
};

constexpr double declickSeconds = 0.005;

// startStep is where the note sits in the arrangement; it only matters with swing.
inline std::optional<PlannedNote> planNote (const std::vector<Slice>& slices, int fileLength, int stepNum, const Settings& settings, int startStep = 0)
{
    const auto it = std::find_if (slices.begin(), slices.end(), [&] (const Slice& s) { return s.stepNum == stepNum; });
    if (it == slices.end())
        return std::nullopt;

    PlannedNote note;
    note.regionStart = std::max (0, it->start);
    // Audio ends at the next slice in array order, the Fill Gaps cutoff at the next slice by stepNum.
    note.regionEnd = std::min (fileLength, std::next (it) != slices.end() ? std::next (it)->start : fileLength);
    if (note.regionEnd <= note.regionStart)
        return std::nullopt;

    int nextStepNum = 16;
    for (const auto& s : slices)
        if (s.stepNum > stepNum)
            nextStepNum = std::min (nextStepNum, s.stepNum);

    std::optional<double> fadeStart, stop;
    if (settings.shortenNotes)
    {
        fadeStart = settings.noteLengthMs / 1000.0;
        stop = *fadeStart + settings.noteFadeOutMs / 1000.0;
    }
    if (settings.fillGaps)
    {
        const auto nextStep = startStep + nextStepNum - stepNum;
        const auto steps = swungStep (nextStep, settings.swing) - swungStep (startStep, settings.swing);
        const auto cutoff = steps * 60.0 / settings.bpm / 4.0;
        stop = stop ? std::min (*stop, cutoff) : cutoff;
    }
    if (! stop)
        return note;

    const auto fade = fadeStart ? std::min (*fadeStart, *stop - declickSeconds) : *stop - declickSeconds;
    note.fadeStart = std::max<int64_t> (0, std::llround (fade * settings.sampleRate));
    note.stop = std::llround (*stop * settings.sampleRate);
    return note;
}
}
