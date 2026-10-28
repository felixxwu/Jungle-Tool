#pragma once

#include "Breaks.h"
#include "Engine.h"
#include <juce_audio_processors/juce_audio_processors.h>

// Owns everything the plugin saves in the DAW project; the editor only views it.
// The DAW parameters are the truth for layer volume and pitch and the global settings.
class JungleToolProcessor : public juce::AudioProcessor,
                            private juce::AudioProcessorParameter::Listener,
                            private juce::Timer
{
public:
    static constexpr int numSlots = Engine::numSlots;

    JungleToolProcessor();

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    bool isBusesLayoutSupported (const BusesLayout&) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override;
    void setStateInformation (const void*, int) override;

    // The state as the project saves it: no previews, and parameter values written into the arrangement.
    juce::String getSavedState() const;
    void setUiState (const juce::String&);
    void setParametersFromUi (const juce::var& changes);
    void setSlices (const juce::String& breakName, const juce::var& slices);
    // An imported loop, saved with the project when kept. Before that (while it's trimmed) it's only
    // held so it can be previewed.
    juce::String addProjectBreak (const juce::String& name, const juce::String& json, bool keep);
    juce::String getProjectBreakJson (const juce::String& id) const;
    void playPreview (const juce::String& breakName, int start, int end, bool loop);
    void stopPreview();
    void dropPreviews();
    void setAuditioning (bool);

    juce::var getParameterValues() const;
    bool takeParametersChanged() { return parametersChanged.exchange (false); }

    double getPlayheadStep() const { return engine.playheadStep; }
    double getPlayheadBpm() const { return engine.playheadBpm; }
    bool isHostPlaying() const { return hostPlaying; }
    bool isAuditioning() const { return auditioning; }
    std::optional<double> getHostBpm() const;

private:
    void parameterValueChanged (int, float) override { parametersChanged = true; }
    void parameterGestureChanged (int, bool) override {}
    void timerCallback() override;

    void loadState (const juce::String&);
    const Break* findBreak (const juce::String& name) const;
    void publishEngineState();
    juce::AudioParameterInt& parameter (const juce::String& id) const;

    juce::SharedResourcePointer<BreakLibrary> library;
    Engine engine;
    std::atomic<bool> hostPlaying { false }, auditioning { false }, parametersChanged { false };
    std::atomic<double> hostBpm { 0.0 };

    std::map<juce::String, juce::AudioParameterInt*> parameters;
    std::map<juce::String, double> openGestures;

    mutable juce::CriticalSection stateLock;
    juce::var state;
    std::map<juce::String, juce::var> sliceEdits;

    struct ProjectBreak
    {
        juce::String id, name;
        std::unique_ptr<Break> audio;
        // The break as a JSON file like the factory ones, saved inside the project.
        juce::String json;
    };
    std::vector<ProjectBreak> projectBreaks;
    // Replaced audio stays alive, because a voice on the audio thread may still be reading it.
    std::vector<std::unique_ptr<Break>> retiredBreaks;
    EngineState::Preview preview;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (JungleToolProcessor)
};
