// Web worker that runs the optional on-device language model of the site assistant (WebLLM, WebGPU), so that
// loading and generating never freeze the page. Started only after the visitor turns the feature on.
import { WebWorkerMLCEngineHandler } from '../vendor/web-llm-0.2.86/index.js';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (message) => handler.onmessage(message);
