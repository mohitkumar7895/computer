"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { useBrand } from "@/context/BrandContext";
import MarksheetBackgroundOverlay, {
  type MarksheetPageData,
} from "@/components/marksheet/MarksheetBackgroundOverlay";
import { downloadElementAsA4Pdf } from "@/lib/downloadA4";
import DocumentTemplateBackground from "@/components/documents/DocumentTemplateBackground";

export default function AdminMarksheetPage() {
  const { examId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  /** Print-only mode (zip exports / kiosk print) — hides background on the captured render. */
  const isPrintMode = searchParams.get("print") === "1";
  const isZipPrintMode = searchParams.get("zipPrint") === "1";
  const shouldDownload = searchParams.get("download") === "1";
  const { brandName } = useBrand();

  const [data, setData] = useState<MarksheetPageData | null>(null);
  const [learningCenterLine, setLearningCenterLine] = useState("");
  const [bg, setBg] = useState("");
  const [templatePainted, setTemplatePainted] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [bgResolved, setBgResolved] = useState(false);

  const showBgForTemplate = !!(data && !isPrintMode && !isZipPrintMode && bg);

  useEffect(() => {
    if (!showBgForTemplate) setTemplatePainted(true);
    else setTemplatePainted(false);
  }, [showBgForTemplate]);

  const onTemplatePainted = useCallback(() => {
    setTemplatePainted(true);
  }, []);

  useEffect(() => {
    setBgResolved(false);
    fetch(`/api/admin/documents/marksheet?examId=${examId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.data) {
          setData(d.data as MarksheetPageData);
          setLearningCenterLine(typeof d.learningCenterLine === "string" ? d.learningCenterLine : "");
        } else router.push("/admin/panel");
      })
      .catch(() => router.push("/admin/panel"));

    fetch("/api/public/background/marksheet")
      .then((r) => r.json())
      .then((body) => {
        if (typeof body?.url === "string" && body.url.trim() !== "") setBg(body.url);
      })
      .catch(() => setBg(""))
      .finally(() => setBgResolved(true));
  }, [examId, router]);

  const downloadPdf = useCallback(async () => {
    const el = document.getElementById("cert-a4");
    if (!el || !data) return;
    const needsDecodedBg = !(isPrintMode || isZipPrintMode) && !!bg;
    if (!bgResolved || (needsDecodedBg && !templatePainted)) return;
    setDownloading(true);
    try {
      const studentObj = data?.studentId && typeof data.studentId === "object" ? data.studentId : null;
      const fileName = String(
        studentObj?.enrollmentNo || data?.enrollmentNo || "marksheet",
      ).replace(/\s+/g, "_");
      const suffix = isPrintMode || isZipPrintMode ? "Marksheet_Print" : "Marksheet";
      await downloadElementAsA4Pdf(el, `${fileName}_${suffix}`, "portrait");
    } catch (err) {
      console.error("Marksheet download failed", err);
    } finally {
      setDownloading(false);
    }
  }, [data, isPrintMode, isZipPrintMode, bg, templatePainted, bgResolved]);

  const needsTemplateDecode = !isPrintMode && !isZipPrintMode && !!bg;
  const textOnTemplateReady = bgResolved && (!needsTemplateDecode || templatePainted);
  const pdfReady = textOnTemplateReady;

  useEffect(() => {
    if (!data || !shouldDownload) return;
    if (!pdfReady) return;
    const t = window.setTimeout(() => {
      void downloadPdf();
    }, 350);
    return () => window.clearTimeout(t);
  }, [data, shouldDownload, pdfReady, downloadPdf]);

  useEffect(() => {
    if (!data || !isPrintMode || isZipPrintMode) return;
    const t = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(t);
  }, [data, isPrintMode, isZipPrintMode]);

  if (!data) {
    return (
      <div className="p-10 text-center font-bold uppercase tracking-widest text-slate-400 animate-pulse">
        Processing Marksheet…
      </div>
    );
  }

  const showBg = !(isPrintMode || isZipPrintMode) && bg;
  const verifyUrl =
    typeof window !== "undefined" ? `${window.location.origin}/verification/marksheet` : "";

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex w-[210mm] items-center justify-between rounded-3xl border border-white bg-white p-4 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-black uppercase text-slate-600 hover:bg-slate-200"
          >
            Back
          </button>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Marksheet · Template Overlay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading || !pdfReady}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-60"
          >
            <Download size={14} /> {downloading ? "Preparing…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!pdfReady}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-60"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div
        id="cert-a4"
        className="relative mx-auto h-[297mm] w-[210mm] overflow-visible bg-white shadow-2xl print:m-0 print:shadow-none"
      >
        {showBg ? (
          <DocumentTemplateBackground src={bg} onPainted={onTemplatePainted} />
        ) : null}
        {textOnTemplateReady ? (
          <MarksheetBackgroundOverlay
            data={data}
            learningCenter={learningCenterLine || brandName?.toUpperCase() || ""}
            verifyUrl={verifyUrl}
          />
        ) : null}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
