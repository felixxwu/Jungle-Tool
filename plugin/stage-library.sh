#!/bin/bash
# Copies the factory breaks the installers ship into the given folder: only the breaks in the
# app's library list (src/lib/consts.ts), not every file in public/library.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p "$1"
sed -n "/^export const library = \[/,/^\]/s/^  '\(.*\)',\r\{0,1\}$/\1/p" src/lib/consts.ts | while read -r name; do
  cp "public/library/$name.json" "$1/"
done
echo "staged $(ls "$1" | wc -l | tr -d ' ') breaks"
