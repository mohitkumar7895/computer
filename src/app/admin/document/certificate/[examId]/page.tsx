"use client";



import { useCallback, useEffect, useState } from "react";

import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Download, Printer } from "lucide-react";

import { useBrand } from "@/context/BrandContext";

import { downloadElementAsA4Pdf, preloadA4PdfLibs } from "@/lib/downloadA4";

import CertificateBackgroundOverlay, {

  type CertificatePageData,

} from "@/components/certificate/CertificateBackgroundOverlay";

import DocumentTemplateBackground from "@/components/documents/DocumentTemplateBackground";



async function fetchSignatureUrl(): Promise<string> {

  try {

    const res = await fetch("/api/public/settings?key=auth_signature");

    const body = await res.json();

    if (typeof body?.value === "string" && body.value.trim()) return body.value;

    const res2 = await fetch("/api/public/settings?key=authorized_signature");

    const body2 = await res2.json();

    if (typeof body2?.value === "string" && body2.value.trim()) return body2.value;

  } catch {

    /* ignore */

  }

  return "";

}



export default function AdminCertificatePage() {

  const { examId } = useParams();

  const router = useRouter();

  const { brandName } = useBrand();

  const searchParams = useSearchParams();

  const isPrintMode = searchParams.get("print") === "1";

  const isZipPrintMode = searchParams.get("zipPrint") === "1";

  const shouldDownload = searchParams.get("download") === "1";



  const [data, setData] = useState<CertificatePageData | null>(null);

  const [bg, setBg] = useState("");

  const [sig, setSig] = useState("");

  const [atcSig, setAtcSig] = useState("");

  const [bgPainted, setBgPainted] = useState(false);

  const [downloading, setDownloading] = useState(false);



  useEffect(() => {

    preloadA4PdfLibs();

  }, []);



  useEffect(() => {

    let cancelled = false;

    const examIdStr = String(examId ?? "");



    setAtcSig("");

    setBgPainted(false);



    void (async () => {

      try {

        const [docRes, bgRes, signatureUrl] = await Promise.all([

          fetch(`/api/admin/documents/certificate?examId=${examIdStr}`, { credentials: "include" }),

          fetch("/api/public/background/certificate"),

          fetchSignatureUrl(),

        ]);

        if (cancelled) return;



        const docJson = await docRes.json();

        if (docJson?.data) {

          setData(docJson.data as CertificatePageData);

          setAtcSig(typeof docJson.atcSignature === "string" ? docJson.atcSignature : "");

        } else if (!shouldDownload) {

          router.push("/admin/panel");

          return;

        }



        const bgJson = await bgRes.json();

        if (!cancelled && typeof bgJson?.url === "string" && bgJson.url.trim()) {

          setBg(bgJson.url);

        } else if (!cancelled) {

          setBg("");

          setBgPainted(true);

        }



        if (!cancelled) setSig(signatureUrl);

      } catch {

        if (!cancelled && !shouldDownload) router.push("/admin/panel");

      }

    })();



    return () => {

      cancelled = true;

    };

  }, [examId, router, shouldDownload]);



  useEffect(() => {

    if (!bg || isPrintMode || isZipPrintMode) setBgPainted(true);

  }, [bg, isPrintMode, isZipPrintMode]);



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

      await downloadElementAsA4Pdf(el, `${fileName}_${suffix}`, "landscape", { fast: shouldDownload });

    } catch (err) {

      console.error("Certificate download failed", err);

    } finally {

      setDownloading(false);

    }

  }, [data, isPrintMode, isZipPrintMode, shouldDownload]);



  const showBg = !(isPrintMode || isZipPrintMode) && bg;

  const captureReady = !!data && (!showBg || bgPainted);



  useEffect(() => {

    if (!shouldDownload || !captureReady) return;

    const t = window.setTimeout(() => {

      void downloadPdf();

    }, 40);

    return () => window.clearTimeout(t);

  }, [shouldDownload, captureReady, downloadPdf]);



  useEffect(() => {

    if (!data || !isPrintMode || isZipPrintMode) return;

    const t = window.setTimeout(() => window.print(), 120);

    return () => window.clearTimeout(t);

  }, [data, isPrintMode, isZipPrintMode]);



  if (!data) {
    return (
      <div className="p-10 text-center font-bold uppercase tracking-widest text-slate-400 animate-pulse">
        {shouldDownload ? "Opening certificate & preparing PDF…" : "Preparing Certificate…"}
      </div>
    );
  }

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

          <DocumentTemplateBackground src={bg} onPainted={handleBgPainted} />

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


