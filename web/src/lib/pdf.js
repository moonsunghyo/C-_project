// pdf.js setup — uses the bundled worker via Vite's ?url import with CDN fallback
import * as pdfjsLib from 'pdfjs-dist';

// Try local worker first, but have a CDN fallback if Vite's ?url fails in some environments
const LOCAL_WORKER = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;
const CDN_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

pdfjsLib.GlobalWorkerOptions.workerSrc = LOCAL_WORKER;

export { pdfjsLib, CDN_WORKER };

