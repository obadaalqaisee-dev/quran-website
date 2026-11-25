# WebLLM 0.2.86 (vendored)

`index.js` is `lib/index.js` of the npm package [`@mlc-ai/web-llm@0.2.86`](https://www.npmjs.com/package/@mlc-ai/web-llm)
(Apache-2.0, see `LICENSE`), unchanged except that the final `//# sourceMappingURL=` comment was removed (the map is
not shipped). It is self-hosted, like the fonts, so the site loads no third-party script for the assistant, and it
is downloaded only when a visitor turns on the on-device answers.

The model weights (Qwen2.5 Instruct, Apache-2.0, published by MLC on huggingface.co) and the WebGPU model library
(raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs) are downloaded by the library on first use and cached by the
browser; the site's Content Security Policy allows exactly those hosts.

To update: `npm pack @mlc-ai/web-llm@<version>`, copy `lib/index.js` and `LICENSE` here into a new versioned folder,
update the import in `assets/workers/llm-worker.js` and `assets/js/features/assistant-ai.js`.
