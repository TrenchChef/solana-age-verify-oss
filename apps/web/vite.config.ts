import { defineConfig, normalizePath } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// ----------------------------------------------------------------------
// WASM Binary Resolution (ONNX & TFJS)
// ----------------------------------------------------------------------
const resolveWasmDir = (pkgName: string) => {
    try {
        const pkgEntry = require.resolve(pkgName);
        const pkgPath = path.dirname(pkgEntry);
        const candidates = [
            pkgPath,
            path.resolve(pkgPath, 'dist'),
            path.resolve(__dirname, 'node_modules', pkgName, 'dist'),
            path.resolve(__dirname, '../../node_modules', pkgName, 'dist'),
            path.resolve(__dirname, '../../packages/age-verify-sdk/node_modules', pkgName, 'dist')
        ];
        const found = candidates.find(dir => fs.existsSync(dir) && fs.readdirSync(dir).some(f => f.endsWith('.wasm')));
        if (found) console.log(`[Vite] Found WASM for ${pkgName} in:`, found);
        return found;
    } catch (_e: unknown) {
        console.warn(`[Vite] Could not resolve WASM for ${pkgName}`);
        return undefined;
    }
};

const onnxWasmDir = resolveWasmDir('onnxruntime-web');
const tfjsWasmDir = resolveWasmDir('@tensorflow/tfjs-backend-wasm');

const copyTargets = [
    ...(onnxWasmDir ? [
        { src: normalizePath(path.join(onnxWasmDir, '*.wasm')), dest: 'assets' },
        { src: normalizePath(path.join(onnxWasmDir, '*.mjs')), dest: 'assets' }
    ] : []),
    ...(tfjsWasmDir ? [
        { src: normalizePath(path.join(tfjsWasmDir, '*.wasm')), dest: 'assets' }
    ] : []),
    {
        src: normalizePath(path.resolve(__dirname, '../../packages/age-verify-sdk/public/models/*')),
        dest: 'models'
    },
    {
        src: normalizePath(path.resolve(__dirname, '../../packages/age-verify-sdk/public/models/m_*.json')),
        dest: 'models'
    }
];
// ----------------------------------------------------------------------

export default defineConfig({
    envPrefix: ['VITE_', 'helius_', 'quicknode_', 'HELIUS_', 'QUICKNODE_'],
    resolve: {
        alias: {
            'solana-age-verify': path.resolve(__dirname, '../../packages/age-verify-sdk/src/index.ts')
        }
    },
    // Server config to expose host
    server: {
        host: '127.0.0.1',
        // Allow running in restricted environments
        strictPort: false,
        port: 5173,
        open: false,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    },
    plugins: [
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
        react(),
        viteStaticCopy({
            targets: copyTargets
        })
    ],
    worker: {
        format: 'es'
    }
})
