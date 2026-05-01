"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, GraduationCap, Award, Printer } from "lucide-react";
import { apiFetch } from "@/utils/api";
import { useBrand } from "@/context/BrandContext";

export default function CertificatePrintPage() {
  const { examId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bg, setBg] = useState("");
  const [sig, setSig] = useState("");
  const { brandName, brandMobile, brandEmail, brandAddress, brandUrl } = useBrand();

  useEffect(() => {
    // 1. Fetch Certificate Data
    apiFetch(`/api/student/documents/certificate?examId=${examId}`)
      .then(res => res.json())
      .then(d => {
        if (d.data) setData(d.data);
        else router.push("/student/dashboard");
      })
      .catch(() => router.push("/student/dashboard"));

    // 2. Fetch Background Template
    apiFetch("/api/public/backgrounds").then(res => res.json()).then(bgs => {
      const nextBg = typeof bgs.certificate === "string" && bgs.certificate.trim() !== "-" ? bgs.certificate : "";
      setBg(nextBg);
    });

    // 3. Fetch Signature
    apiFetch("/api/public/settings?key=authorized_signature").then(res => res.json()).then(sig => {
      if (sig.value) setSig(sig.value);
    });

    setLoading(false);
  }, [examId, router]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 print:p-0 print:bg-white">
      {/* Controls */}
      <div className="mb-8 flex gap-4 print:hidden">
        <button 
          onClick={() => router.back()} 
          className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight hover:bg-slate-50"
        >
          Back
        </button>
        <button 
          onClick={() => window.print()} 
          className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-tight flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700"
        >
          <Printer size={16} /> Print Certificate (A4)
        </button>
      </div>

      {/* A4 Container */}
      <div className="w-[210mm] h-[297mm] bg-white shadow-2xl relative overflow-hidden print:shadow-none" id="cert-a4">
        {/* Background Layer */}
        {bg && (
          <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Dynamic Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center pt-[70mm] text-[#1a1a1a]">
           {/* Photo */}
           <div className="absolute top-[55mm] right-[30mm] w-[35mm] h-[45mm] border-2 border-slate-200">
              {data.studentId?.photo && <img src={data.studentId.photo} alt="" className="w-full h-full object-cover" />}
           </div>

           {/* Certificate Meta */}
           <div className="absolute top-[40mm] left-[30mm] flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <p>{brandName || "Institution"}</p>
              <p>SR NO: <span className="text-slate-800">{data.serialNo}</span></p>
              <p>ENROLLMENT: <span className="text-slate-800">{data.enrollmentNo}</span></p>
              <p>DATE: <span className="text-slate-800">{new Date(data.issueDate).toLocaleDateString()}</span></p>
           </div>

           {/* Main Text Section */}
           <div className="text-center w-full px-[20mm] space-y-[12mm]">
              <div className="space-y-4">
                 <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-blue-800">Certificate of Achievement</h2>
                 <p className="text-[14px] font-medium italic">This is to certify that</p>
                 <h1 className="text-[32px] font-black uppercase tracking-tight text-slate-900 leading-none">{data.studentId?.name}</h1>
              </div>

              <div className="flex flex-col gap-2">
                 <div className="flex justify-center gap-[10mm] text-[12px]">
                    <p className="flex items-center gap-2">S/o, D/o, W/o: <span className="font-bold border-b border-slate-300 pb-0.5">{data.studentId?.fatherName}</span></p>
                    <p className="flex items-center gap-2">Mothers Name: <span className="font-bold border-b border-slate-300 pb-0.5">{data.studentId?.motherName}</span></p>
                 </div>
                 <p className="text-[12px] flex items-center justify-center gap-2">
                    Roll Number: <span className="font-black px-3 py-0.5 bg-blue-50 border border-blue-100 rounded">{data.studentId?.classRollNo || "N/A"}</span>
                 </p>
              </div>

              <div className="space-y-4 pt-4">
                 <p className="text-[12px] font-medium leading-relaxed max-w-lg mx-auto">
                    Has successfully completed the prescribed course of study and passed the final examination in
                 </p>
                 <h3 className="text-[20px] font-black text-blue-900 border-2 border-blue-900/10 rounded-2xl py-4 mx-[20mm]">
                    {data.courseName}
                 </h3>
              </div>

              <div className="grid grid-cols-2 gap-[20mm] pt-10 px-[15mm]">
                 <div className="text-left space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Center</p>
                    <p className="text-[11px] font-black text-slate-900">{data.centerName} ({data.centerCode})</p>
                 </div>
                 <div className="text-right space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Examination Session</p>
                    <p className="text-[11px] font-black text-slate-900">{data.session}</p>
                 </div>
              </div>

              <div className="flex justify-center items-center gap-[40mm] pt-[20mm]">
                 <div className="flex flex-col items-center">
                    <div className="w-[30mm] h-0.5 bg-slate-300 mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest">Center Head Signature</p>
                 </div>
                  <div className="flex flex-col items-center">
                    {sig ? (
                       <img src={sig} alt="" className="h-[25mm] object-contain mb-[-10mm]" />
                    ) : (
                       <Award size={60} className="text-blue-900/10 mb-[-10mm] opacity-50" />
                    )}
                    <div className="w-[30mm] h-0.5 bg-slate-300 mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-blue-900">Administrator Signature</p>
                  </div>
              </div>
           </div>

           {/* Verification Footer */}
           <div className="absolute bottom-[20mm] left-0 w-full flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-[8px] font-black text-slate-400">
                 <ShieldCheck size={12} />
                 {(brandName || "AUTHENTIC ACADEMIC RECORD")} • {(brandUrl || brandEmail || brandMobile || "SCAN QR TO VERIFY")}
              </div>
              <div className="w-[20mm] h-[20mm] bg-slate-50 border border-slate-100 p-1 flex items-center justify-center opacity-50">
                 <p className="text-[6px] font-black text-slate-300 text-center uppercase tracking-tighter">QR Placeholder</p>
              </div>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { padding: 0; background-color: white; }
          .print-hidden { display: none !important; }
          #cert-a4 { 
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
