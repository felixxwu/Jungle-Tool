#include "Updater.h"

namespace updater
{
namespace
{
constexpr auto releasesUrl = "https://api.github.com/repos/felixxwu/Jungle-Tool/releases?per_page=30";
// Only installers from this repository's own releases are ever downloaded.
constexpr auto downloadPrefix = "https://github.com/felixxwu/Jungle-Tool/releases/download/";

#if JUCE_MAC
constexpr auto installerName = "jungle-tool-macos.pkg";
#else
constexpr auto installerName = "jungle-tool-windows.exe";
#endif
}

bool isNewer (const juce::String& candidate, const juce::String& current)
{
    const auto a = juce::StringArray::fromTokens (candidate, ".", "");
    const auto b = juce::StringArray::fromTokens (current, ".", "");
    for (int i = 0; i < std::max (a.size(), b.size()); ++i)
    {
        const auto x = a[i].getIntValue();
        const auto y = b[i].getIntValue();
        if (x != y)
            return x > y;
    }
    return false;
}

std::optional<Release> findNewerRelease()
{
    const juce::String current = JucePlugin_VersionString;
    if (current == "0.0.0")
        return std::nullopt;

    auto stream = juce::URL (releasesUrl).createInputStream (juce::URL::InputStreamOptions (juce::URL::ParameterHandling::inAddress)
                                                                  .withExtraHeaders (headers)
                                                                  .withConnectionTimeoutMs (5000));
    if (stream == nullptr)
        return std::nullopt;

    std::optional<Release> newest;
    const auto releases = juce::JSON::parse (stream->readEntireStreamAsString());
    if (auto* array = releases.getArray())
    {
        for (const auto& release : *array)
        {
            const auto tag = release["tag_name"].toString();
            if (! tag.startsWith ("plugin-v") || (bool) release["draft"] || (bool) release["prerelease"])
                continue;

            const auto version = tag.fromFirstOccurrenceOf ("plugin-v", false, false);
            if (! isNewer (version, newest ? newest->version : current))
                continue;

            if (auto* assets = release["assets"].getArray())
                for (const auto& asset : *assets)
                    if (const auto url = asset["browser_download_url"].toString(); asset["name"].toString() == installerName && url.startsWith (downloadPrefix))
                        newest = Release { version, juce::URL (url) };
        }
    }
    return newest;
}

juce::File installerFile (const Release& release)
{
    return juce::File::getSpecialLocation (juce::File::tempDirectory)
        .getChildFile ("Jungle Tool")
        .getChildFile (release.version + "-" + installerName);
}
}
