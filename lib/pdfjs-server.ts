// Server-side pdfjs-dist loader.
//
// pdfjs-dist v5 references DOMMatrix/ImageData/Path2D at module load. In a
// plain Node process it self-polyfills from @napi-rs/canvas via a dynamic
// createRequire, but that path doesn't survive Next.js's bundled server
// runtime — DOMMatrix ends up undefined and any getDocument() call throws
// "DOMMatrix is not defined". Polyfilling the globals before importing
// pdfjs avoids the crash.

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjsPromise: Promise<PdfjsModule> | null = null;

export async function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const g = globalThis as unknown as {
        DOMMatrix?: unknown;
        ImageData?: unknown;
        Path2D?: unknown;
      };
      if (!g.DOMMatrix || !g.ImageData || !g.Path2D) {
        const canvas = (await import("@napi-rs/canvas")) as unknown as {
          DOMMatrix: unknown;
          ImageData: unknown;
          Path2D: unknown;
        };
        if (!g.DOMMatrix) g.DOMMatrix = canvas.DOMMatrix;
        if (!g.ImageData) g.ImageData = canvas.ImageData;
        if (!g.Path2D) g.Path2D = canvas.Path2D;
      }
      // Pre-import the worker module so it registers
      // globalThis.pdfjsWorker.WorkerMessageHandler. With that in place,
      // pdfjs's fake-worker bootstrap uses it directly and never tries to
      // dynamic-import GlobalWorkerOptions.workerSrc — which fails in
      // bundled serverless runtimes (Vercel) regardless of whether the path
      // is empty or a resolved file:// URL.
      await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}
