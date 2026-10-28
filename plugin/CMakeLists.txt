cmake_minimum_required(VERSION 3.22)
# These only take effect when set before project().
set(CMAKE_OSX_DEPLOYMENT_TARGET "11.0" CACHE STRING "")
set(CMAKE_OSX_ARCHITECTURES "arm64;x86_64" CACHE STRING "")
project(JungleTool VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 20)

# Dev builds install themselves to ~/Library and can read breaks from the repo.
option(JUNGLE_TOOL_DEV_BUILD "Copy plugins after building and fall back to public/library" ON)

include(FetchContent)
FetchContent_Declare(JUCE
  GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
  GIT_TAG 8.0.15
  GIT_SHALLOW ON)
FetchContent_Declare(clap-juce-extensions
  GIT_REPOSITORY https://github.com/free-audio/clap-juce-extensions.git
  GIT_TAG 7adee3a1bd4684d4caa5601100e364abccff4b4d
  GIT_SUBMODULES_RECURSE ON)
FetchContent_MakeAvailable(JUCE clap-juce-extensions)

# Placeholder manufacturer and plugin codes; pick real ones before release.
juce_add_plugin(JungleTool
  COMPANY_NAME "Jungle Tool"
  PRODUCT_NAME "Jungle Tool"
  BUNDLE_ID com.jungletool.plugin
  PLUGIN_MANUFACTURER_CODE Jngl
  PLUGIN_CODE Jngt
  IS_SYNTH TRUE
  NEEDS_MIDI_INPUT TRUE
  NEEDS_WEBVIEW2 TRUE
  AU_MAIN_TYPE kAudioUnitType_MusicDevice
  FORMATS VST3 AU Standalone
  COPY_PLUGIN_AFTER_BUILD ${JUNGLE_TOOL_DEV_BUILD})

clap_juce_extensions_plugin(TARGET JungleTool
  CLAP_ID "com.jungletool.plugin"
  CLAP_FEATURES instrument sampler drum-machine)

target_sources(JungleTool PRIVATE
  Source/PluginProcessor.cpp
  Source/PluginEditor.cpp
  Source/Breaks.cpp
  Source/Engine.cpp)

file(GLOB_RECURSE UI_FILES CONFIGURE_DEPENDS "${CMAKE_SOURCE_DIR}/../dist-plugin/*")
# Breaks are read from the library folder on disk, not embedded.
list(FILTER UI_FILES EXCLUDE REGEX "/dist-plugin/library/")
if(NOT UI_FILES)
  message(FATAL_ERROR "Run `npm run build:plugin` first")
endif()
juce_add_binary_data(JungleToolUI SOURCES ${UI_FILES})

target_compile_definitions(JungleTool PUBLIC
  JUCE_WEB_BROWSER=1
  JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=1
  JUCE_USE_CURL=0
  JUCE_VST3_CAN_REPLACE_VST2=0)

target_link_libraries(JungleTool PRIVATE
  JungleToolUI
  juce::juce_audio_utils
  juce::juce_dsp
  juce::juce_gui_extra
  PUBLIC
  juce::juce_recommended_config_flags
  juce::juce_recommended_lto_flags
  juce::juce_recommended_warning_flags)

if(JUNGLE_TOOL_DEV_BUILD)
  target_compile_definitions(JungleTool PRIVATE
    JUNGLE_TOOL_DEV_LIBRARY="${CMAKE_SOURCE_DIR}/../public/library")
endif()

add_executable(SchedulingTests Tests/SchedulingTests.cpp)
add_test(NAME SchedulingTests COMMAND SchedulingTests)

juce_add_console_app(Render)
target_sources(Render PRIVATE Tests/Render.cpp Source/Breaks.cpp Source/Engine.cpp)
target_compile_definitions(Render PRIVATE
  JUCE_WEB_BROWSER=0
  JUCE_USE_CURL=0
  JUNGLE_TOOL_DEV_LIBRARY="${CMAKE_SOURCE_DIR}/../public/library")
target_link_libraries(Render PRIVATE juce::juce_audio_formats juce::juce_dsp juce::juce_recommended_config_flags)
