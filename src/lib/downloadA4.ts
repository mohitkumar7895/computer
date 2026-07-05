/**
 * Capture an A4-sized element to a single-page PDF download.
 */

export type A4Orientation = "portrait" | "landscape";

export type A4DownloadOptions = {
  /** Lower pixel ratio + shorter settle — faster download, still readable on A4. */
  fast?: boolean;
  pixelRatio?: number;
  jpegQuality?: number;
};

const ORIENTATION_TO_MM: Record<A4Orientation, { width: number; height: number }> = {
  portrait: { width: 210, height: 297 },
  landscape: { width: 297, height: 210 },
};

type HtmlToImage = typeof import("html-to-image");
type JsPDF = typeof import("jspdf").default;

let libsPromise: Promise<{ htmlToImage: HtmlToImage; jsPDF: JsPDF }> | null = null;

function preloadPdfLibs(): Promise<{ htmlToImage: HtmlToImage; jsPDF: JsPDF }> {
  if (!libsPromise) {
    libsPromise = Promise.all([import("html-to-image"), import("jspdf")]).then(
      ([htmlToImage, jspdf]) => ({
        htmlToImage,
        jsPDF: jspdf.default,
      }),
    );
  }
  return libsPromise;
}

/** Warm PDF libraries during idle time (e.g. panel mount). */
export function preloadA4PdfLibs(): void {
  if (typeof window === "undefined") return;
  const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 1));
  idle(() => {
    void preloadPdfLibs();
  });
}

async function waitForImages(el: HTMLElement, timeoutMs = 5000): Promise<void> {
  const imgs = Array.from(el.querySelectorAll("img"));
  if (!imgs.length) return;
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };
          img.addEventListener("load", finish, { once: true });
          img.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, timeoutMs);
        }),
    ),
  );
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForPaintSettle(fast: boolean): Promise<void> {
  if (fast) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }
  try {
    await document.fonts?.ready;
  } catch {
    /* ignore */
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 120));
}

function capturePixelSize(el: HTMLElement): { w: number; h: number } {
  const rect = el.getBoundingClientRect();
  const w = Math.ceil(rect.width) || el.offsetWidth || el.clientWidth;
  const h = Math.ceil(rect.height) || el.offsetHeight || el.clientHeight;
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

function styleExportClone(el: HTMLElement): void {
  el.querySelectorAll<HTMLElement>("img").forEach((img) => {
    if (img.classList.contains("document-template-bg")) {
      img.style.display = "block";
      img.style.position = "absolute";
      img.style.inset = "0";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.minWidth = "100%";
      img.style.minHeight = "100%";
      img.style.maxWidth = "none";
      img.style.objectFit = "fill";
      img.style.objectPosition = "center";
      img.style.zIndex = "1";
    }
  });
  el.querySelectorAll<HTMLElement>(".document-overlay-print-root").forEach((overlay) => {
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.zIndex = "80";
    overlay.style.isolation = "isolate";
  });
}

function buildExportClone(el: HTMLElement, w: number, h: number): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.left = "-100000px";
  clone.style.top = "0";
  clone.style.width = `${w}px`;
  clone.style.height = `${h}px`;
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.overflow = "hidden";
  clone.style.background = "#ffffff";
  clone.style.isolation = "isolate";
  clone.setAttribute("data-export-clone", "true");
  styleExportClone(clone);
  document.body.appendChild(clone);
  return clone;
}

/** Render `el` (A4 in CSS) to PDF and trigger browser download. */
export async function downloadElementAsA4Pdf(
  el: HTMLElement,
  fileName: string,
  orientation: A4Orientation = "portrait",
  options: A4DownloadOptions = {},
): Promise<void> {
  const fast = options.fast ?? false;
  const pixelRatio = options.pixelRatio ?? (fast ? 1.15 : 1.35);
  const jpegQuality = options.jpegQuality ?? (fast ? 0.82 : 0.88);

  const [{ htmlToImage, jsPDF }, _] = await Promise.all([
    preloadPdfLibs(),
    waitForImages(el, fast ? 4000 : 6000),
  ]);
  await waitForPaintSettle(fast);

  const { w, h } = capturePixelSize(el);
  const ratio = Math.max(fast ? 1.15 : 1.35, pixelRatio);
  const cw = Math.max(1, Math.round(w * ratio));
  const ch = Math.max(1, Math.round(h * ratio));

  const captureOpts = {
    cacheBust: true,
    pixelRatio: ratio,
    quality: jpegQuality,
    width: w,
    height: h,
    canvasWidth: cw,
    canvasHeight: ch,
    backgroundColor: "#ffffff",
    skipFonts: true,
    style: { transform: "none", margin: "0" },
  };

  let imageData: string;
  try {
    imageData = await htmlToImage.toJpeg(el, captureOpts);
  } catch {
    const exportEl = buildExportClone(el, w, h);
    try {
      await waitForImages(exportEl, 3000);
      imageData = await htmlToImage.toJpeg(exportEl, captureOpts);
    } finally {
      exportEl.remove();
    }
  }

  const dims = ORIENTATION_TO_MM[orientation];
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  pdf.addImage(imageData, "JPEG", 0, 0, dims.width, dims.height);
  const safeName = fileName.trim() || "document";
  pdf.save(safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`);
}
