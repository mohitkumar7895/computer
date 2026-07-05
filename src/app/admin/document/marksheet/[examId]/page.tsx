"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { useBrand } from "@/context/BrandContext";
import MarksheetBackgroundOverlay, {
  type MarksheetPageData,
} from "@/components/marksheet/MarksheetBackgroundOverlay";
import { downloadElementAsA4Pdf } from "@/lib/downloadA4";
import { preloadImageUrl } from "@/lib/preloadImageUrl";
import DocumentTemplateBackground from "@/components/documents/DocumentTemplateBackground";
import MarksheetA4Frame, { MARKSHEET_A4_PRINT_CSS } from "@/components/marksheet/MarksheetA4Frame";

const BG_WAIT_MS = 700;

export default function AdminMarksheetPage() {
  const { examId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get("print") === "1";
  const isZipPrintMode = searchParams.get("zipPrint") === "1";
  const shouldDownload = searchParams.get("download") === "1";
  const fastPath = shouldDownload || isPrintMode;
  const { brandName } = useBrand();

  const [data, setData] = useState<MarksheetPageData | null>(null);
  const [learningCenterLine, setLearningCenterLine] = useState("");
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
        const docRes = await fetch(`/api/admin/documents/marksheet?examId=${examIdStr}`, {
          credentials: "include",
        });
        if (cancelled) return;

        const docJson = await docRes.json();
        if (docJson?.data) {
          setData(docJson.data as MarksheetPageData);
          setLearningCenterLine(
            typeof docJson.learningCenterLine === "string" ? docJson.learningCenterLine : "",
          );
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
      const studentObj = data?.studentId && typeof data.studentId === "object" ? data.studentId : null;
      const fileName = String(
        studentObj?.enrollmentNo || data?.enrollmentNo || "marksheet",
      ).replace(/\s+/g, "_");
      const suffix = isPrintMode || isZipPrintMode ? "Marksheet_Print" : "Marksheet";
      await downloadElementAsA4Pdf(el, `${fileName}_${suffix}`, "portrait", { fast: true });
    } catch (err) {
      console.error("Marksheet download failed", err);
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
        {shouldDownload ? "Loading marksheet…" : "Processing Marksheet…"}
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

      <MarksheetA4Frame>
        {showBg ? (
          <DocumentTemplateBackground
            src={bg}
            fullBleed
            fastReady={fastPath}
            onPainted={handleBgPainted}
          />
        ) : null}
        <MarksheetBackgroundOverlay
          data={data}
          learningCenter={learningCenterLine || brandName?.toUpperCase() || ""}
          verifyUrl={verifyUrl}
          signatureUrl={sig || undefined}
          atcSignatureUrl={atcSig || undefined}
          skipGradeBandsFetch
        />
      </MarksheetA4Frame>

      <style jsx global>{`${MARKSHEET_A4_PRINT_CSS}`}</style>
    </div>
  );
}
