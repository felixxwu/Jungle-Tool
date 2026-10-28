#pragma once

#include "PluginProcessor.h"
#include "Updater.h"
#include <juce_gui_extra/juce_gui_extra.h>

// Native strip the user drags the arrangement from into the DAW as a .mid clip. It sits beside the
// web view because the web view can't start a reliable file drag, and on Windows nothing can be drawn over it.
class DragMidiStrip : public juce::Component
{
public:
    DragMidiStrip();

    void setClip (const juce::String& fileName, juce::MemoryBlock bytes);
    void resized() override;
    void paint (juce::Graphics&) override;
    void mouseDrag (const juce::MouseEvent&) override;

private:
    juce::File writeClip() const;
    void saveClip();

    juce::String clipName;
    juce::MemoryBlock clip;
    bool dragging = false;
    juce::TextButton saveButton { "Save .mid..." };
    std::unique_ptr<juce::FileChooser> chooser;
};

// Hosts the React UI in a web view and wires its native functions to the processor.
class JungleToolEditor : public juce::AudioProcessorEditor,
                         private juce::Timer,
                         private juce::URL::DownloadTaskListener
{
public:
    explicit JungleToolEditor (JungleToolProcessor&);
    ~JungleToolEditor() override;
    void resized() override;

private:
    std::optional<juce::WebBrowserComponent::Resource> getResource (const juce::String& url);
    void timerCallback() override;
    void checkForUpdate (juce::WebBrowserComponent::NativeFunctionCompletion);
    void startUpdate (juce::WebBrowserComponent::NativeFunctionCompletion);
    void progress (juce::URL::DownloadTask*, juce::int64 downloaded, juce::int64 total) override;
    void finished (juce::URL::DownloadTask*, bool success) override;

    JungleToolProcessor& owner;
    juce::WebBrowserComponent webView;
    DragMidiStrip dragStrip;
    std::unique_ptr<juce::FileChooser> fileChooser;
    std::unique_ptr<juce::URL::DownloadTask> download;
    juce::WebBrowserComponent::NativeFunctionCompletion updateFinished;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (JungleToolEditor)
};
