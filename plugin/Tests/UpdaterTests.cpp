// Checks version comparison, then looks up the newest release on GitHub as if this were 0.1.0.
#include "../Source/Updater.h"
#include <cassert>

int main()
{
    using updater::isNewer;
    assert (isNewer ("0.1.1", "0.1.0"));
    assert (isNewer ("0.10.0", "0.9.9"));
    assert (isNewer ("1.0", "0.9.9"));
    assert (! isNewer ("0.1.0", "0.1.0"));
    assert (! isNewer ("0.1.0", "0.1.1"));

    if (const auto release = updater::findNewerRelease())
        std::printf ("newer release %s at %s\n", release->version.toRawUTF8(), release->installer.toString (false).toRawUTF8());
    else
        std::puts ("no newer release (or GitHub unreachable)");
    std::puts ("ok");
}
