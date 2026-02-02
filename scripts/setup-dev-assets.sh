#!/bin/bash

# setup-dev-assets.sh
# Automates the setup of ONNX assets for development mode by symlinking 
# from the node_modules to the public/assets folder.

set -e

# Base directories
PROJECT_ROOT=$(pwd)
WEB_APP_PUBLIC="$PROJECT_ROOT/apps/web/public"
ASSETS_DIR="$WEB_APP_PUBLIC/assets"

# 1. Ensure assets directory exists
echo "Creating assets directory: $ASSETS_DIR"
mkdir -p "$ASSETS_DIR"

# 2. Find onnxruntime-web dist folder
# We check both local node_modules and root node_modules for monorepo compatibility
ONNX_DIST="$PROJECT_ROOT/apps/web/node_modules/onnxruntime-web/dist"

if [ ! -d "$ONNX_DIST" ]; then
    ONNX_DIST="$PROJECT_ROOT/node_modules/onnxruntime-web/dist"
fi

if [ ! -d "$ONNX_DIST" ]; then
    echo "Error: onnxruntime-web not found in node_modules. Please run npm install."
    exit 1
fi

echo "Found ONNX dist at: $ONNX_DIST"

# 3. Symlink all .wasm and .mjs files
echo "Symlinking ONNX assets (Relative)..."
for file in "$ONNX_DIST"/*.wasm "$ONNX_DIST"/*.mjs; do
    filename=$(basename "$file")
    target="$ASSETS_DIR/$filename"
    
    # Remove existing link or file if it exists
    rm -f "$target"
    
    # Create RELATIVE symlink
    # From apps/web/public/assets to node_modules/onnxruntime-web/dist is usually ../../../node_modules/onnxruntime-web/dist
    # However, if it's in the local apps/web/node_modules, it's ../node_modules/onnxruntime-web/dist
    
    RELATIVE_PATH=$(python3 -c "import os.path; print(os.path.relpath('$file', '$ASSETS_DIR'))")
    ln -s "$RELATIVE_PATH" "$target"
    echo "  Linked $filename"
done

echo "Done! Neural engine assets are now available for Development mode."
echo "You may need to restart 'npm run dev' if it was already running."
