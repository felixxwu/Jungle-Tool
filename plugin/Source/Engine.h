#pragma once

#include "Breaks.h"
#include "Scheduling.h"
#include <juce_dsp/juce_dsp.h>

// Everything the audio thread needs to play, built on the message thread and handed over whole.
struct EngineState
{
    struct Layer
    {
        const Break* source = nullptr;
        std::vector<scheduling::Slice> slices;
        // The DAW parameter slot whose volume and pitch this layer plays with, or -1 for a
        // preview layer, which uses its own volume and pitch.
        int slot = -1;
        float volume = 1.0f;
        int pitch = 0;
    };

    struct Preview
    {
        const Break* source = nullptr;
        int start = 0;
        int end = 0;
        bool loop = false;
        int serial = 0;
    };

    struct Note
    {
        int stepNumToPlay = 0;
        int startStep = 0;
    };

    std::vector<Layer> layers;
    std::vector<Note> arrangement;
    int numBars = 1;
    double swing = 0.0;
    bool sequencerMode = false;
    bool fillGaps = true;
    bool shortenNotes = false;
    double bpm = 160.0;
    Preview preview;
};

// Plays slices for triggered steps and Library previews, mirroring the web app's graph.ts:
// voices -> layer gains -> saturation -> 0.3 trim. Previews skip the layer gains and saturation.
class Engine
{
public:
    static constexpr int maxLayers = 16;

    static constexpr int numSlots = 8;

    // Values of the DAW parameters, read every block so automation applies straight away.
    struct Parameters
    {
        std::array<float, numSlots> volume {};
        std::array<int, numSlots> pitch {};
        int saturation = 50;
        double swing = 0.0;
        double noteLengthMs = 200.0;
        double noteFadeOutMs = 10.0;
    };

    struct Transport
    {
        Parameters parameters;
        bool hostPlaying = false;
        std::optional<double> hostBpm;
        bool auditioning = false;
    };

    ~Engine();
    void prepare (double sampleRate);

    // Message thread only.
    void publish (std::unique_ptr<EngineState>);

    // Audio thread only. MIDI notes 36-51 trigger steps 0-15 in MIDI mode; in sequencer mode any held
    // note plays the arrangement from its start. Either mode plays it while auditioning.
    void process (juce::AudioBuffer<float>&, const juce::MidiBuffer&, const Transport&);

    // Arrangement position in steps for the UI's play-head, or -1 when the arrangement isn't playing.
    std::atomic<double> playheadStep { -1.0 };
    // The tempo the play-head moves at.
    std::atomic<double> playheadBpm { 160.0 };

private:
    struct Voice
    {
        bool active = false;
        int layer = -1; // -1 for the preview
        const Break* source = nullptr;
        int regionStart = 0;
        int regionLength = 0;
        bool reversedTail = false;
        bool loop = false;
        double position = 0.0;
        double rate = 1.0;
        float gain = 1.0f;
        int64_t age = 0;
        int64_t played = 0;
        int64_t fadeStart = -1;
        int64_t stop = -1;
    };

    void takeNewState();
    struct Trigger
    {
        int offset = 0;
        int stepNum = 0;
        int startStep = 0;
        float velocity = 1.0f;
        bool swung = false;
        bool stop = false; // fades out the arrangement's sounding notes instead
    };

    void collectArrangementTriggers (double fromStep, int numSegmentSamples, double samplesPerStep, int baseOffset);
    void addStop (int offset);
    void triggerStep (const Trigger&, double bpm);
    void fadeOutLayerVoices();
    float layerVolume (size_t layer) const;
    int layerPitch (size_t layer) const;
    Voice& allocateVoice();
    void render (int start, int numSamples);
    float renderVoice (Voice&, int channel, double position) const;
    void saturate (juce::dsp::AudioBlock<float>);

    static constexpr int maxChunk = 1024;
    static constexpr int numVoices = 128;

    double sampleRate = 44100.0;
    std::array<Voice, numVoices + 8> voices;
    int64_t voiceCounter = 0;
    int previewSerial = 0;

    std::array<Trigger, 1024> triggers {};
    int numTriggers = 0;
    bool wasAuditioning = false;
    double auditionStep = 0.0;
    bool patternPlaying = false;
    int heldNotes = 0;
    double patternStep = 0.0;

    std::atomic<EngineState*> incoming { nullptr };
    std::atomic<EngineState*> outgoing { nullptr };
    std::unique_ptr<EngineState> active = std::make_unique<EngineState>();
    Parameters parameters;

    std::array<float, maxLayers> layerGain {};
    std::array<std::array<float, maxChunk>, maxLayers> layerGainRamp {};
    juce::AudioBuffer<float> layerBus { 2, maxChunk }, previewBus { 2, maxChunk };
    juce::dsp::Oversampling<float> oversampling { 2, 2, juce::dsp::Oversampling<float>::filterHalfBandPolyphaseIIR, true };
    float smoothing = 0.0f;
    juce::AudioBuffer<float>* output = nullptr;
};
