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
    // With persist off, the plugin only holds the audio in memory, so an import can be previewed while it's trimmed.
    juce::String saveUserBreak (juce::String id, const juce::String& name, const juce::var& trimStart, const juce::var& trimEnd, const juce::String& json, bool persist);
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

    struct UserBreak
    {
        juce::String id, name;
        juce::var trimStart, trimEnd;
        std::unique_ptr<Break> audio; // null when this machine doesn't have the file
    };
    std::vector<UserBreak> userBreaks;
    // Replaced audio stays alive, because a voice on the audio thread may still be reading it.
    std::vector<std::unique_ptr<Break>> retiredBreaks;
    EngineState::Preview preview;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (JungleToolProcessor)
};
