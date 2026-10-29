#!/bin/bash
# Builds an unsigned macOS installer: the plugins in all three formats plus the factory breaks.
set -euo pipefail

cd "$(dirname "$0")/.."
VERSION=${VERSION:-0.0.0}
BUILD=plugin/build-release
ARTEFACTS="$BUILD/JungleTool_artefacts/Release"
STAGE="$BUILD/pkg-root"

npm run build:plugin
GENERATOR=()
command -v ninja >/dev/null && GENERATOR=(-G Ninja)
cmake -S plugin -B "$BUILD" "${GENERATOR[@]}" -DCMAKE_BUILD_TYPE=Release -DJUNGLE_TOOL_DEV_BUILD=OFF -DJUNGLE_TOOL_VERSION="$VERSION"
cmake --build "$BUILD"

rm -rf "$STAGE"
mkdir -p "$STAGE/Library/Audio/Plug-Ins/"{VST3,Components,CLAP}
cp -R "$ARTEFACTS/VST3/Jungle Tool.vst3" "$STAGE/Library/Audio/Plug-Ins/VST3/"
cp -R "$ARTEFACTS/AU/Jungle Tool.component" "$STAGE/Library/Audio/Plug-Ins/Components/"
cp -R "$ARTEFACTS/CLAP/Jungle Tool.clap" "$STAGE/Library/Audio/Plug-Ins/CLAP/"

plugin/stage-library.sh "$STAGE/Library/Application Support/Jungle Tool/Library"

# Stop the installer from "relocating" a bundle to wherever an older copy happens to be, and
# from skipping one because the installed copy has a higher version (local builds are 0.0.0).
pkgbuild --analyze --root "$STAGE" "$BUILD/components.plist"
i=0
while plutil -replace "$i.BundleIsRelocatable" -bool NO "$BUILD/components.plist" 2>/dev/null; do
  plutil -replace "$i.BundleIsVersionChecked" -bool NO "$BUILD/components.plist"
  i=$((i + 1))
done

pkgbuild --root "$STAGE" --component-plist "$BUILD/components.plist" \
  --identifier com.jungletool.plugin --version "$VERSION" --install-location / \
  "$BUILD/Jungle Tool Plugins.pkg"
productbuild --package "$BUILD/Jungle Tool Plugins.pkg" "$BUILD/Jungle Tool $VERSION.pkg"
echo "$BUILD/Jungle Tool $VERSION.pkg"
