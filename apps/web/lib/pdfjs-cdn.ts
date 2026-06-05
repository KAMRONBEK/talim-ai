const PDFJS_VERSION = '5.4.296';

export interface PdfViewport {
  width: number;
  height: number;
  transform: number[];
}

export interface PdfDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageProxy>;
}

export interface PdfPageProxy {
  getViewport(params: { scale: number }): PdfViewport;
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
    canvas: HTMLCanvasElement;
  }): { promise: Promise<void> };
  getTextContent(): Promise<{
    items: Array<
      | { str?: string; transform: number[]; width?: number; height?: number; fontName?: string }
      | { type: string }
    >;
  }>;
  streamTextContent(params?: { includeMarkedContent?: boolean }): AsyncIterable<unknown>;
}

export interface PdfJsModule {
  getDocument(src: string): { promise: Promise<PdfDocumentProxy> };
  GlobalWorkerOptions: { workerSrc: string };
  Util: {
    transform: (m1: number[], m2: number[]) => number[];
  };
  TextLayer?: new (params: {
    textContentSource:
      | AsyncIterable<unknown>
      | { items: unknown[]; styles?: Record<string, unknown> };
    container: HTMLElement;
    viewport: PdfViewport;
  }) => { render: () => Promise<void>; cancel?: () => void };
}

let pdfjsPromise: Promise<PdfJsModule> | null = null;

export function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import(
      /* webpackIgnore: true */
      `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`
    ).then((pdfjs: PdfJsModule) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}
