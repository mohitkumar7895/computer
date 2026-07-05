"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { useBrand } from "@/context/BrandContext";
import { downloadElementAsA4Pdf } from "@/lib/downloadA4";
import { preloadImageUrl } from "@/lib/preloadImageUrl";
import CertificateBackgroundOverlay, {
  type CertificatePageData,
} from "@/components/certificate/CertificateBackgroundOverlay";
import DocumentTemplateBackground from "@/components/documents/DocumentTemplateBackground";

const BG_WAIT_MS = 700;

export default function AdminCertificatePage() {
  const { examId } = useParams();
  const router = useRouter();
  const { brandName } = useBrand();
  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get("print") === "1";
  const isZipPrintMode = searchParams.get("zipPrint") === "1";
  const shouldDownload = searchParams.get("download") === "1";
  const fastPath = shouldDownload || isPrintMode;

  const [data, setData] = useState<CertificatePageData | null>(null);
  const [bg, setBg] = useState("");
  const [sig, setSig] = useState("");
  const [atcSig, setAtcSig] = useState("");
  const [bgPainted, setBgPainted] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const examIdStr = String(examId ?? "");

    setAtcSig("");
    setBgPainted(false);
    setCaptureReady(false);
    downloadStartedRef.current = false;

    void (async () => {
      try {
        const docRes = await fetch(`/api/admin/documents/certificate?examId=${examIdStr}`, {
          credentials: "include",
        });
        if (cancelled) return;

        const docJson = await docRes.json();
        if (docJson?.data) {
          setData(docJson.data as CertificatePageData);
          setAtcSig(typeof docJson.atcSignature === "string" ? docJson.atcSignature : "");
          if (typeof docJson.signatureUrl === "string") setSig(docJson.signatureUrl);
          if (typeof docJson.backgroundUrl === "string" && docJson.backgroundUrl.trim()) {
            setBg(docJson.backgroundUrl);
            preloadImageUrl(docJson.backgroundUrl);
          } else {
            setBg("");
            setBgPainted(true);
          }
          return;
        }
        if (!shouldDownload) router.push("/admin/panel");
      } catch {
        if (!cancelled && !shouldDownload) router.push("/admin/panel");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, router, shouldDownload]);

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
    } catch (err) {
      console.error("Certificate download failed", err);
    } finally {
      setDownloading(false);
    }
  }, [data, isPrintMode, isZipPrintMode]);

  useEffect(() => {
    if (!shouldDownload || !captureReady || downloadStartedRef.current) return;
    downloadStartedRef.current = true;
    requestAnimationFrame(() => {
      void downloadPdf();
    });
  }, [shouldDownload, captureReady, downloadPdf]);

  useEffect(() => {
    if (!data || !isPrintMode || isZipPrintMode) return;
    const t = window.setTimeout(() => window.print(), 80);
    return () => window.clearTimeout(t);
  }, [data, isPrintMode, isZipPrintMode]);

  if (!data) {
    return (
      <div className="p-10 text-center font-bold uppercase tracking-widest text-slate-400 animate-pulse">
        {shouldDownload ? "Loading certificate…" : "Preparing Certificate…"}
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
