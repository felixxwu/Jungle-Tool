#pragma once

#include <juce_core/juce_core.h>

// Finds a newer release of the plugin on GitHub, so the editor can offer to install it.
namespace updater
{
struct Release
{
    juce::String version;
    juce::URL installer;
};

// Blocking network call, so it runs off the message thread. Empty when this build is current,
// is a local build (version 0.0.0), or GitHub can't be reached.
std::optional<Release> findNewerRelease();

bool isNewer (const juce::String& candidate, const juce::String& current);

// Where the downloaded installer goes.
juce::File installerFile (const Release&);

// GitHub's API turns away requests without a user agent.
inline const juce::String headers = "User-Agent: Jungle Tool\r\nAccept: application/vnd.github+json";
}
