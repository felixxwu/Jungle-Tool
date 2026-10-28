#include "../Source/Scheduling.h"
#include <cassert>
#include <cstdlib>
#include <cstdio>

using namespace scheduling;

int main()
{
    // Amen Brother (1) style: slices on steps 0, 2, 4.
    const std::vector<Slice> slices { { 100, 0 }, { 1000, 2 }, { 2000, 4 } };
    Settings settings;
    settings.bpm = 150.0; // 0.1 s per step

    auto note = planNote (slices, 5000, 0, settings);
    assert (note && note->regionStart == 100 && note->regionEnd == 1000);
    assert (note->stop == 8820);                  // two steps to the step-2 slice
    assert (std::abs (note->fadeStart - 8600) <= 1); // 5 ms declick

    assert (! planNote (slices, 5000, 1, settings)); // no slice for step 1 stays silent

    auto last = planNote (slices, 5000, 4, settings);
    assert (last->regionEnd == 5000 && last->stop == 12 * 4410); // last slice fills to step 16

    settings.shortenNotes = true;
    settings.noteLengthMs = 50.0;
    settings.noteFadeOutMs = 100.0;
    note = planNote (slices, 5000, 0, settings);
    assert (note->fadeStart == 2205 && note->stop == 6615); // Shorten Notes is tighter than Fill Gaps

    settings.fillGaps = false;
    settings.shortenNotes = false;
    note = planNote (slices, 5000, 0, settings);
    assert (note->stop == -1 && note->fadeStart == -1);

    // Duplicate stepNums: the first match plays, and the cutoff skips past the duplicate.
    const std::vector<Slice> duplicates { { 0, 0 }, { 500, 0 }, { 900, 3 } };
    settings.fillGaps = true;
    note = planNote (duplicates, 2000, 0, settings);
    assert (note->regionEnd == 500 && note->stop == 3 * 4410);

    // With swing, an even-step note is cut at the late odd step, and an odd-step note at the on-time even step.
    settings.swing = 50.0;
    const std::vector<Slice> everyStep { { 0, 0 }, { 100, 1 }, { 200, 2 } };
    assert (planNote (everyStep, 1000, 0, settings, 0)->stop == 4410 * 3 / 2);
    assert (planNote (everyStep, 1000, 1, settings, 1)->stop == 4410 / 2);

    std::puts ("ok");
}
