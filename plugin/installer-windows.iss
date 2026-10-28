; Inno Setup script for the unsigned Windows installer: the VST3 and CLAP plugins, plus the
; factory breaks in the shared folder every format reads from.
#define AppVersion GetEnv("JUNGLE_TOOL_VERSION")

[Setup]
AppId=JungleToolPlugin
AppName=Jungle Tool
AppVersion={#AppVersion}
AppPublisher=Jungle Tool
DefaultDirName={commoncf64}\VST3
DisableDirPage=yes
DisableProgramGroupPage=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
OutputDir=.
OutputBaseFilename=jungle-tool-windows
UninstallDisplayName=Jungle Tool

[Files]
Source: "build-release\JungleTool_artefacts\Release\VST3\Jungle Tool.vst3\*"; DestDir: "{commoncf64}\VST3\Jungle Tool.vst3"; Flags: recursesubdirs ignoreversion
Source: "build-release\JungleTool_artefacts\Release\CLAP\Jungle Tool.clap"; DestDir: "{commoncf64}\CLAP"; Flags: ignoreversion
Source: "build-release\library\*.json"; DestDir: "{commonappdata}\Jungle Tool\Library"; Flags: ignoreversion
