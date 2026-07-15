"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Download, Printer, RefreshCw } from "lucide-react";
import { useBrand } from "@/context/BrandContext";
import { downloadElementAsA4Pdf } from "@/lib/downloadA4";
import { useDocumentPageData } from "@/lib/useDocumentPageData";
import CertificateBackgroundOverlay, {
  type CertificatePageData,
} from "@/components/certificate/CertificateBackgroundOverlay";
import DocumentTemplateBackground from "@/components/documents/DocumentTemplateBackground";

const BG_WAIT_MS = 350;

export default function AdminCertificatePage() {
  const { examId } = useParams();
  const router = useRouter();
  const { brandName } = useBrand();
  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get("print") === "1";
  const isZipPrintMode = searchParams.get("zipPrint") === "1";
  const shouldDownload = searchParams.get("download") === "1";
  const fastPath = shouldDownload || isPrintMode;
  const examIdStr = String(examId ?? "");

  const { payload, loadState, errorMessage, retry } = useDocumentPageData({
    apiPath: "/api/admin/documents/certificate",
    examId: examIdStr,
    stayOnFailure: shouldDownload,
    onHardFailure: () => router.push("/admin/panel"),
  });

  const data = (payload?.data as CertificatePageData | undefined) ?? null;
  const bg = payload?.backgroundUrl?.trim() ?? "";
  const sig = payload?.signatureUrl ?? "";
  const atcSig = payload?.atcSignature ?? "";

  const [bgPainted, setBgPainted] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadStartedRef = useRef(false);

  useEffect(() => {
    setBgPainted(false);
    setCaptureReady(false);
    downloadStartedRef.current = false;
  }, [examIdStr, payload]);

  useEffect(() => {
    if (!data) {
      setCaptureReady(false);
      return;
    }
    const showBg = !(isPrintMode || isZipPrintMode) && bg;
    if (!showBg || bgPainted) {
      setCaptureReady(true);
      return;
    }
    const t = window.setTimeout(() => setCaptureReady(true), BG_WAIT_MS);
    return () => window.clearTimeout(t);
  }, [data, bg, bgPainted, isPrintMode, isZipPrintMode]);

  const handleBgPainted = useCallback(() => setBgPainted(true), []);

  const downloadPdf = useCallback(async () => {
    const el = document.getElementById("cert-a4");
    if (!el || !data) return;
    setDownloading(true);
    try {
      const studentObj =
        data?.studentId && typeof data.studentId === "object" ? data.studentId : null;
      const fileName = String(
        data?.serialNo || studentObj?.name || data?.enrollmentNo || "certificate",
      ).replace(/\s+/g, "_");
      const suffix = isPrintMode || isZipPrintMode ? "Certificate_Print" : "Certificate";
      await downloadElementAsA4Pdf(el, `${fileName}_${suffix}`, "landscape", { fast: true });
      if (shouldDownload) {
        window.setTimeout(() => window.close(), 400);
      }
    } catch (err) {
      console.error("Certificate download failed", err);
    } finally {
      setDownloading(false);
    }
  }, [data, isPrintMode, isZipPrintMode, shouldDownload]);

  useEffect(() => {
    if (!shouldDownload || !captureReady || !data || downloadStartedRef.current) return;
    downloadStartedRef.current = true;
    requestAnimationFrame(() => {
      void downloadPdf();
    });
  }, [shouldDownload, captureReady, data, downloadPdf]);

  useEffect(() => {
    if (!data || !isPrintMode || isZipPrintMode) return;
    const t = window.setTimeout(() => window.print(), 80);
    return () => window.clearTimeout(t);
  }, [data, isPrintMode, isZipPrintMode]);

  if (loadState === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-10 text-center">
        <p className="font-bold uppercase tracking-widest text-red-600">Certificate load failed</p>
        <p className="max-w-md text-sm text-slate-500">{errorMessage}</p>
        <button
          type="button"
          onClick={() => void retry()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase text-white"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-center font-bold uppercase tracking-widest text-slate-400 animate-pulse">
        {shouldDownload ? "Preparing certificate…" : "Preparing Certificate…"}
      </div>
    );
  }

  const showBg = !(isPrintMode || isZipPrintMode) && bg;
  const verifyUrl =
    typeof window !== "undefined" ? `${window.location.origin}/verification/certificate` : "";

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex w-[297mm] items-center justify-between rounded-3xl border border-white bg-white p-4 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-black uppercase text-slate-600 hover:bg-slate-200"
          >
            Back
          </button>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Certificate · Template Overlay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading || !captureReady}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-60"
          >
            <Download size={14} /> {downloading ? "Preparing…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!captureReady}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-60"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div
        id="cert-a4"
        className="relative mx-auto h-[210mm] w-[297mm] overflow-hidden bg-white shadow-2xl print:m-0 print:shadow-none"
      >
        {showBg ? (
          <DocumentTemplateBackground src={bg} fastReady={fastPath} onPainted={handleBgPainted} />
        ) : null}
        <CertificateBackgroundOverlay
          data={data}
          brandName={brandName || undefined}
          signatureUrl={sig || undefined}
          atcSignatureUrl={atcSig || undefined}
          verifyUrl={verifyUrl}
        />
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
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
