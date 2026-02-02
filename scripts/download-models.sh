#!/bin/bash
# This script downloads the required ML models and WASM runtimes for Solana Age Verify.
# It places them in the SDK's public folder, which is symlinked by the web app.

TARGET_DIR="packages/age-verify-sdk/public/models"
mkdir -p "$TARGET_DIR"

echo "Downloading ONNX Runtime WASM binaries..."
# You can update these URLs if needed, using the official ONNX Runtime Web ones or a mirror
BASE_URL="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist"

curl -L -o "$TARGET_DIR/ort-wasm-simd-threaded.wasm" "$BASE_URL/ort-wasm-simd-threaded.wasm"
curl -L -o "$TARGET_DIR/ort-wasm-simd-threaded.jsep.wasm" "$BASE_URL/ort-wasm-simd-threaded.jsep.wasm"
curl -L -o "$TARGET_DIR/ort-wasm-simd-threaded.asyncify.wasm" "$BASE_URL/ort-wasm-simd-threaded.asyncify.wasm"

echo "Downloading Age Estimation Model (age_gender.onnx)..."
curl -L -o "$TARGET_DIR/age_gender.onnx" "https://github.com/yakyo/facial-analysis/raw/master/weights/genderage.onnx"

echo "Download complete. All models and runtimes are in $TARGET_DIR"
