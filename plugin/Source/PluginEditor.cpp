#include "PluginEditor.h"
#include "BinaryData.h"

namespace
{
constexpr int uiWidth = 1000;
constexpr int uiHeight = 650;
constexpr int stripHeight = 40;

juce::String getMimeType (const juce::String& path)
{
    if (path.endsWith (".html")) return "text/html";
    if (path.endsWith (".js")) return "text/javascript";
    if (path.endsWith (".css")) return "text/css";
    if (path.endsWith (".json")) return "application/json";
    if (path.endsWith (".svg")) return "image/svg+xml";
    if (path.endsWith (".png")) return "image/png";
    if (path.endsWith (".wav")) return "audio/wav";
    return "application/octet-stream";
}

std::vector<std::byte> toBytes (const void* data, size_t size)
{
    const auto* begin = static_cast<const std::byte*> (data);
    return { begin, begin + size };
}

}

DragMidiStrip::DragMidiStrip()
{
    addAndMakeVisible (saveButton);
    saveButton.onClick = [this] { saveClip(); };
}

void DragMidiStrip::setClip (const juce::String& fileName, juce::MemoryBlock bytes)
{
    // Not createLegalFileName, which also drops the commas between break names.
    clipName = fileName.removeCharacters ("\"<>:*?|/\\");
    clip = std::move (bytes);
}

void DragMidiStrip::resized()
{
    saveButton.setBounds (getLocalBounds().removeFromRight (120).reduced (6));
}

void DragMidiStrip::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff1e1e1e));
    g.setColour (juce::Colours::white);
    g.drawText ("Drag MIDI into your DAW", getLocalBounds().withTrimmedRight (120), juce::Justification::centred);
}

juce::File DragMidiStrip::writeClip() const
{
    auto file = juce::File::getSpecialLocation (juce::File::tempDirectory).getChildFile ("Jungle Tool").getChildFile (clipName);
    file.getParentDirectory().createDirectory();
    file.replaceWithData (clip.getData(), clip.getSize());
    return file;
}

void DragMidiStrip::mouseDrag (const juce::MouseEvent&)
{
    if (dragging || clip.isEmpty())
        return;

    dragging = true;
    juce::DragAndDropContainer::performExternalDragDropOfFiles ({ writeClip().getFullPathName() }, false, this, [this] { dragging = false; });
}

void DragMidiStrip::saveClip()
{
    if (clip.isEmpty())
        return;

    const auto start = juce::File::getSpecialLocation (juce::File::userDocumentsDirectory).getChildFile (clipName);
    chooser = std::make_unique<juce::FileChooser> ("Save MIDI clip", start, "*.mid");
    chooser->launchAsync (juce::FileBrowserComponent::saveMode | juce::FileBrowserComponent::warnAboutOverwriting,
                          [this] (const juce::FileChooser& fc)
                          {
                              if (const auto file = fc.getResult(); file != juce::File())
                                  file.replaceWithData (clip.getData(), clip.getSize());
                          });
}

JungleToolEditor::JungleToolEditor (JungleToolProcessor& p)
    : AudioProcessorEditor (p),
      owner (p),
      webView (juce::WebBrowserComponent::Options {}
                   .withBackend (juce::WebBrowserComponent::Options::Backend::webview2)
                   .withWinWebView2Options (juce::WebBrowserComponent::Options::WinWebView2 {}
                                                .withUserDataFolder (juce::File::getSpecialLocation (juce::File::tempDirectory)))
                   .withNativeIntegrationEnabled()
                   .withResourceProvider ([this] (const auto& url) { return getResource (url); })
                   .withNativeFunction ("getState", [this] (const auto&, auto complete) { complete (owner.getSavedState()); })
                   .withNativeFunction ("chooseFile", [this] (const auto& args, auto complete)
                                        {
                                            // The web view's own file input doesn't hand files back reliably inside a plugin.
                                            fileChooser = std::make_unique<juce::FileChooser> ("Import a break", juce::File(), args[0].toString());
                                            fileChooser->launchAsync (juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
                                                                      [complete] (const juce::FileChooser& chooser)
                                                                      {
                                                                          juce::MemoryBlock data;
                                                                          const auto file = chooser.getResult();
                                                                          if (file == juce::File() || ! file.loadFileAsData (data))
                                                                              return complete ({});

                                                                          auto* result = new juce::DynamicObject();
                                                                          result->setProperty ("name", file.getFileName());
                                                                          result->setProperty ("base64", juce::Base64::toBase64 (data.getData(), data.getSize()));
                                                                          complete (juce::var (result));
                                                                      });
                                        })
                   .withNativeFunction ("addProjectBreak", [this] (const auto& args, auto complete)
                                        {
                                            complete (owner.addProjectBreak (args[0].toString(), args[1].toString(), (bool) args[2]));
                                        })
                   .withNativeFunction ("setParameters", [this] (const auto& args, auto complete)
                                        {
                                            owner.setParametersFromUi (args[0]);
                                            complete ({});
                                        })
                   .withNativeFunction ("setState", [this] (const auto& args, auto complete)
                                        {
                                            owner.setUiState (args[0].toString());
                                            complete ({});
                                        })
                   .withNativeFunction ("setSlices", [this] (const auto& args, auto complete)
                                        {
                                            owner.setSlices (args[0].toString(), args[1]);
                                            complete ({});
                                        })
                   .withNativeFunction ("playPreview", [this] (const auto& args, auto complete)
                                        {
                                            owner.playPreview (args[0].toString(), (int) args[1], (int) args[2], (bool) args[3]);
                                            complete ({});
                                        })
                   .withNativeFunction ("setAuditioning", [this] (const auto& args, auto complete)
                                        {
                                            owner.setAuditioning ((bool) args[0]);
                                            complete ({});
                                        })
                   .withNativeFunction ("setMidiClip", [this] (const auto& args, auto complete)
                                        {
                                            juce::MemoryBlock bytes;
                                            if (auto* array = args[1].getArray())
                                                for (const auto& byte : *array)
                                                {
                                                    const auto value = (juce::uint8) (int) byte;
                                                    bytes.append (&value, 1);
                                                }
                                            dragStrip.setClip (args[0].toString(), std::move (bytes));
                                            complete ({});
                                        })
                   .withNativeFunction ("stopPreview", [this] (const auto&, auto complete)
                                        {
                                            owner.stopPreview();
                                            complete ({});
                                        }))
{
    addAndMakeVisible (webView);
    addAndMakeVisible (dragStrip);
    webView.goToURL (juce::WebBrowserComponent::getResourceProviderRoot());
    setSize (uiWidth, uiHeight + stripHeight);
    startTimerHz (30);
}

void JungleToolEditor::timerCallback()
{
    auto* transport = new juce::DynamicObject();
    transport->setProperty ("position", owner.getPlayheadStep());
    transport->setProperty ("bpm", owner.getPlayheadBpm());
    transport->setProperty ("hostPlaying", owner.isHostPlaying());
    transport->setProperty ("auditioning", owner.isAuditioning());
    if (const auto hostBpm = owner.getHostBpm())
        transport->setProperty ("hostBpm", *hostBpm);
    webView.emitEventIfBrowserIsVisible ("transport", juce::var (transport));

    if (owner.takeParametersChanged())
        webView.emitEventIfBrowserIsVisible ("parameters", owner.getParameterValues());
}

JungleToolEditor::~JungleToolEditor()
{
    // The web view that started a preview is going away, so nothing could stop or keep it.
    owner.stopPreview();
    owner.dropPreviews();
}

void JungleToolEditor::resized()
{
    auto bounds = getLocalBounds();
    dragStrip.setBounds (bounds.removeFromBottom (stripHeight));
    webView.setBounds (bounds);
}

std::optional<juce::WebBrowserComponent::Resource> JungleToolEditor::getResource (const juce::String& url)
{
    const auto path = url == "/" ? juce::String ("/index.html") : url.upToFirstOccurrenceOf ("?", false, false);

    if (path.startsWith ("/project/"))
    {
        const auto id = path.fromFirstOccurrenceOf ("/project/", false, false).upToLastOccurrenceOf (".json", false, false);
        const auto json = owner.getProjectBreakJson (id).toStdString();
        if (json.empty())
            return std::nullopt;
        return juce::WebBrowserComponent::Resource { toBytes (json.data(), json.size()), "application/json" };
    }

    if (path.startsWith ("/library/"))
    {
        juce::MemoryBlock data;
        const auto folder = BreakLibrary::getFactoryFolder();
        const auto file = folder.getChildFile (juce::URL::removeEscapeChars (path.fromFirstOccurrenceOf ("/library/", false, false)));
        // The page only ever asks for files directly inside the library folder.
        if (file.getParentDirectory() != folder || ! file.loadFileAsData (data))
            return std::nullopt;
        return juce::WebBrowserComponent::Resource { toBytes (data.getData(), data.getSize()), getMimeType (path) };
    }

    const auto fileName = path.fromLastOccurrenceOf ("/", false, false);
    for (int i = 0; i < BinaryData::namedResourceListSize; ++i)
    {
        if (fileName != BinaryData::originalFilenames[i])
            continue;

        int size = 0;
        const auto* data = BinaryData::getNamedResource (BinaryData::namedResourceList[i], size);
        return juce::WebBrowserComponent::Resource { toBytes (data, (size_t) size), getMimeType (path) };
    }

    return std::nullopt;
}
