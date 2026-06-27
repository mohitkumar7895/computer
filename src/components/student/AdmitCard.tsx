import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  GraduationCap,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useBrand } from "@/context/BrandContext";
import { plainDocumentNumber } from "@/lib/documentNumberFormat";

type AdmitCardStudent = {
  name?: string;
  photo?: string;
  enrollmentNo?: string;
  /** Issued when admit card is released (Registration → Student registration format). */
  registrationNo?: string;
  session?: string;
  fatherName?: string;
  tpCode?: string;
  course?: string;
};

type AdmitCardExam = {
  durationMinutes?: number | string;
  examTime?: string;
  examDate?: string;
  examMode?: string;
  offlineDetails?: { preferredCenter?: string };
};

interface AdmitCardProps {
  student: AdmitCardStudent;
  exam: AdmitCardExam;
  onClose: () => void;
}

export default function AdmitCard({ student, exam, onClose }: AdmitCardProps) {
  const [background, setBackground] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { brandName, brandMobile, brandEmail, brandAddress, brandUrl } = useBrand();
  const displayEnrollmentNo = plainDocumentNumber(student.enrollmentNo);
  const displayRegistrationNo = plainDocumentNumber(student.registrationNo);
  const durationMinutes = Number(exam?.durationMinutes || 0);
  const examDateText = exam.examDate
    ? new Date(exam.examDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "To be announced";
  const slotText = exam?.examTime
    ? `${exam.examTime} (${durationMinutes > 0 ? `${durationMinutes} mins` : "Duration as per schedule"})`
    : "Time to be announced";
  const examCenter =
    exam.examMode === "online"
      ? "Candidate Digital Portal (Self Login)"
      : exam.offlineDetails?.preferredCenter || "Official ATC Branch";

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch("/api/public/assets");
        if (res.ok) {
          const assets = await res.json();
          const nextBackground = typeof assets.admit_card === "string" && assets.admit_card.trim() !== "-" ? assets.admit_card : "";
          const nextSignature = typeof assets.auth_signature === "string" && assets.auth_signature.trim() !== "-" ? assets.auth_signature : "";
          if (nextBackground) setBackground(nextBackground);
          if (nextSignature) setSignature(nextSignature);
        }
      } catch (err) {
        console.error("Failed to fetch assets", err);
      }
    };
    fetchAssets();
  }, []);

  const handleDownloadPdf = async () => {
    const element = document.getElementById("admit-card-view");
    if (!element) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      const fileName = `${(displayRegistrationNo || displayEnrollmentNo || "admit-card").replace(/\s+/g, "-")}.pdf`;
      pdf.save(fileName);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center overflow-auto bg-slate-950/90 p-3 backdrop-blur-md print:block print:bg-white print:p-0">
      <div className="fixed right-6 top-6 z-110 flex flex-col gap-3 print:hidden">
        <button
          onClick={() => void handleDownloadPdf()}
          disabled={downloading}
          className="flex items-center gap-3 rounded-2xl bg-emerald-600 px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-950/30 transition hover:bg-emerald-700 disabled:opacity-70"
        >
          <Download size={17} />
          {downloading ? "Generating..." : "Download PDF"}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-3 rounded-2xl bg-[#0a0aa1] px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-950/30 transition hover:bg-[#080885]"
        >
          <Printer size={17} />
          Print Admit Card
        </button>
        <button
          onClick={onClose}
          className="self-end rounded-2xl border border-white/15 bg-white/10 p-3 text-white shadow-xl backdrop-blur-xl transition hover:bg-white/20"
          aria-label="Close admit card"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex w-full justify-center print:block">
        <div
          id="admit-card-view"
          className="relative flex overflow-hidden bg-white shadow-[0_0_100px_rgba(0,0,0,0.45)] print:shadow-none"
          style={{
            width: "min(210mm, calc(100vw - 24px))",
            aspectRatio: "210 / 297",
          }}
        >
          <div className="absolute inset-0 z-0">
            {background ? (
              <Image
                src={background}
                alt="Background"
                fill
                unoptimized
                className="pointer-events-none object-fill opacity-20"
                style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
              />
            ) : (
              <div className="relative h-full w-full bg-[#f8fafc]">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#0a0aa1]/8" />
                <div className="pointer-events-none absolute -bottom-20 -left-16 h-80 w-80 rounded-full bg-amber-400/10" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.025]">
                  <GraduationCap size={620} />
                </div>
              </div>
            )}
          </div>

          <div className="relative z-20 m-[13mm] flex flex-1 flex-col border-[1.5px] border-slate-900 bg-white/94">
            <div className="flex items-center justify-between border-b-[1.5px] border-slate-900 bg-white px-[11mm] py-[8mm]">
              <div className="flex items-center gap-4">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-[#0a0aa1] text-white shadow-lg">
                  <GraduationCap size={34} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#0a0aa1]">
                    Official Examination Document
                  </p>
                  <h1 className="mt-1 max-w-[120mm] text-3xl font-black uppercase leading-none tracking-tight text-slate-950">
                    {brandName || "Institution"}
                  </h1>
                  <p className="mt-2 max-w-[122mm] truncate text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {brandEmail || brandMobile || brandUrl || "Professional Education Portal"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border-[1.5px] border-[#0a0aa1] px-5 py-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#0a0aa1]">Admit Card</p>
                <p className="mt-1 text-2xl font-black uppercase tracking-tight text-slate-950">Hall Ticket</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">Valid for exam entry</p>
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-900 bg-[#0a0aa1] text-white">
              <MiniInfo label="Enrollment No." value={displayEnrollmentNo || "---"} />
              <MiniInfo label="Registration No." value={displayRegistrationNo || "---"} />
              <MiniInfo label="Session" value={student.session || "2025-2026"} />
            </div>

            <div className="grid flex-1 grid-cols-[48mm_1fr] gap-[9mm] px-[11mm] py-[10mm]">
              <aside className="space-y-5">
                <div className="relative h-[58mm] overflow-hidden border-[1.5px] border-slate-900 bg-slate-100">
                  {student.photo ? (
                    <Image src={student.photo} alt="Candidate photo" fill unoptimized className="object-cover object-top" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <User size={72} />
                    </div>
                  )}
                </div>

                <div className="border-[1.5px] border-slate-900 p-4 text-center">
                  <QrCode size={72} className="mx-auto text-slate-900" />
                  <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-slate-500">
                    Candidate Verification
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-100">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-700">
                    <CheckCircle size={14} />
                    <p className="text-[9px] font-black uppercase tracking-widest">Verified</p>
                  </div>
                  <p className="mt-1 text-[8px] font-bold uppercase text-emerald-700/70">Entry permitted</p>
                </div>
              </aside>

              <main className="flex flex-col gap-6">
                <section>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0a0aa1]">
                    Candidate Details
                  </p>
                  <h2 className="mt-2 text-4xl font-black uppercase leading-tight tracking-tight text-slate-950">
                    {student.name || "---"}
                  </h2>
                </section>

                <section className="grid grid-cols-2 overflow-hidden border border-slate-900">
                  <Detail label="Father / Guardian" value={student.fatherName} />
                  <Detail label="Course" value={student.course} />
                  <Detail label="Enrollment Number" value={displayEnrollmentNo} strong />
                  <Detail label="Registration Number" value={displayRegistrationNo || "---"} strong />
                  <Detail label="Exam Mode" value={exam.examMode || "Offline / Online"} />
                  <Detail label="Associated Center" value={student.tpCode || "Official Branch"} />
                </section>

                <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
                  <div className="grid grid-cols-[1fr_1fr] border-b border-white/10">
                    <ScheduleItem icon={<Calendar size={20} />} label="Date of Examination" value={examDateText} />
                    <ScheduleItem icon={<Clock size={20} />} label="Examination Slot" value={slotText} />
                  </div>
                  <div className="flex items-start gap-4 p-6">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                        Examination Center
                      </p>
                      <p className="mt-1 text-lg font-black uppercase leading-snug text-white">{examCenter}</p>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-[1fr_52mm] gap-5">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-700">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Mandatory Instructions
                    </p>
                    <ul className="space-y-2 text-[10.5px] font-bold leading-relaxed text-slate-600">
                      <li>1. Carry this admit card and a valid identity proof to the examination center.</li>
                      <li>2. Report at least 30 minutes before the scheduled examination time.</li>
                      <li>3. Mobile phones, smart watches, calculators and study material are not allowed.</li>
                      <li>4. Follow the instructions given by the invigilator/center authority.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col justify-end text-center">
                    <div className="relative mx-auto mb-3 h-20 w-40 rounded-xl border border-slate-200 bg-white">
                      {signature ? (
                        <Image src={signature} alt="Authorized signature" fill unoptimized className="object-contain p-2" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[9px] font-bold uppercase tracking-widest text-slate-300">
                          Signature
                        </span>
                      )}
                    </div>
                    <p className="border-t border-slate-900 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-900">
                      Exam Controller
                    </p>
                    <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-[#0a0aa1]">
                      {brandName || "Institution"}
                    </p>
                  </div>
                </section>
              </main>
            </div>

            <div className="mt-auto border-t border-slate-900 px-[11mm] py-3 text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-500">
                {brandAddress || "Digitally issued official document"} {brandMobile ? `| ${brandMobile}` : ""}
              </p>
            </div>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media print {
                  @page { size: A4 portrait; margin: 0; }
                  body {
                    margin: 0;
                    padding: 0;
                    background: white !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  body * { visibility: hidden !important; }
                  #admit-card-view, #admit-card-view * { visibility: visible !important; }
                  #admit-card-view {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 210mm !important;
                    height: 297mm !important;
                    aspect-ratio: auto !important;
                    padding: 0 !important;
                    border: none !important;
                    visibility: visible !important;
                  }
                }
                #admit-card-view {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              `,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/20 px-6 py-3 last:border-r-0">
      <p className="text-[8px] font-black uppercase tracking-[0.24em] text-blue-100">{label}</p>
      <p className="mt-1 text-lg font-black uppercase leading-none text-white">{value}</p>
    </div>
  );
}

function ScheduleItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="mt-1 text-xl font-black uppercase leading-tight text-white">{value}</p>
      </div>
    </div>
  );
}

function Detail({ label, value, strong = false }: { label: string; value?: string; strong?: boolean }) {
  return (
    <div className="min-h-[72px] border-b border-r border-slate-900 p-4 even:border-r-0 last:border-b-0">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p
        className={`mt-1 uppercase leading-tight ${
          strong ? "text-2xl font-black text-[#0a0aa1]" : "text-sm font-bold text-slate-900"
        }`}
      >
        {value || "---"}
      </p>
    </div>
  );
}
