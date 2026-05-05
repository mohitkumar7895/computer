"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { apiFetch } from "@/utils/api";
import { useBrand } from "@/context/BrandContext";
import MarksheetBackgroundOverlay, {
  type MarksheetPageData,
} from "@/components/marksheet/MarksheetBackgroundOverlay";
import { downloadElementAsA4Pdf } from "@/lib/downloadA4";

export default function AtcMarksheetPage() {
  const { examId } = useParams();
  const router = useRouter();
  const { brandName } = useBrand();

  const [data, setData] = useState<MarksheetPageData | null>(null);
  const [learningCenterLine, setLearningCenterLine] = useState("");
  const [bg, setBg] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [docRes, bgRes] = await Promise.all([
          apiFetch(`/api/atc/documents/marksheet?examId=${examId}`).then((r) => r.json()),
          apiFetch("/api/public/backgrounds").then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (!docRes?.data) {
          router.push("/atc/dashboard");
          return;
        }
        setData(docRes.data as MarksheetPageData);
        setLearningCenterLine(typeof docRes.learningCenterLine === "string" ? docRes.learningCenterLine : "");
        const nextBg =
          typeof bgRes?.marksheet === "string" && bgRes.marksheet.trim() !== "-"
            ? bgRes.marksheet
            : "";
        setBg(nextBg);
      } catch {
        if (!cancelled) router.push("/atc/dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, router]);

  const handleDownloadPdf = useCallback(async () => {
    const el = document.getElementById("cert-a4");
    if (!el || !data) return;
    setDownloading(true);
    try {
      const studentObj = data?.studentId && typeof data.studentId === "object" ? data.studentId : null;
      const fileName = String(
        studentObj?.enrollmentNo || data?.enrollmentNo || "marksheet",
      ).replace(/\s+/g, "_");
      await downloadElementAsA4Pdf(el, `${fileName}_Marksheet`, "portrait", 2);
    } catch (err) {
      console.error("Marksheet download failed", err);
    } finally {
      setDownloading(false);
    }
  }, [data]);

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  const verifyUrl =
    typeof window !== "undefined" ? `${window.location.origin}/verification/marksheet` : "";

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-100 py-10 print:bg-white print:p-0">
      <div className="mb-8 flex flex-wrap gap-4 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-tight hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-xs font-bold uppercase tracking-tight text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-60"
        >
          <Download size={16} /> {downloading ? "Preparing…" : "Download PDF (with background)"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-xs font-bold uppercase tracking-tight text-white shadow-lg shadow-blue-100 hover:bg-blue-700"
        >
          <Printer size={16} /> Print (text only)
        </button>
      </div>

      <div
        id="cert-a4"
        className="relative h-[297mm] w-[210mm] overflow-visible bg-white shadow-2xl print:shadow-none"
      >
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            className="absolute inset-0 z-0 h-full w-full bg-white object-fill print:hidden"
          />
        ) : null}
        <MarksheetBackgroundOverlay
          data={data}
          learningCenter={learningCenterLine || brandName?.toUpperCase() || ""}
          verifyUrl={verifyUrl}
        />
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
