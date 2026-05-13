#!/bin/sh
set -e
mkdir -p dist
javy emit-plugin -o plugin.wasm
javy build -C dynamic -C plugin=plugin.wasm -o dist/index.wasm src/run.js
rm -f plugin.wasm
echo "Built dist/index.wasm ($(wc -c < dist/index.wasm) bytes)"
