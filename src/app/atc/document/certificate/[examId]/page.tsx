"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, Award, MapPin, Calendar, ShieldCheck, User } from "lucide-react";

import { useBrand } from "@/context/BrandContext";

export default function AtcCertificatePage() {
  const { examId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const { brandName: rawBrandName, brandMobile, brandEmail, brandAddress, brandUrl } = useBrand();
  const brandName = rawBrandName.toUpperCase();

  useEffect(() => {
    fetch(`/api/atc/documents/certificate?examId=${examId}`)
      .then((res) => res.json())
      .then((d) => (d.data ? setData(d.data) : router.push("/atc/dashboard")))
      .catch(() => router.push("/atc/dashboard"));
  }, [examId, router]);

  if (!data) return <div className="p-10 font-bold text-slate-400 animate-pulse uppercase tracking-widest text-center">Preparing Authenticated Document...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
      {/* Control Bar */}
      <div className="mx-auto w-[210mm] mb-6 print:hidden flex justify-between items-center bg-white p-4 rounded-[1.5rem] shadow-xl border border-white">
        <div className="flex items-center gap-3">
           <button onClick={() => router.back()} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs hover:bg-slate-200 transition">Back</button>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Document Preview: Certificate</p>
        </div>
        <button onClick={() => window.print()} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-xs hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center gap-2">
           Print Document
        </button>
      </div>

      {/* A4 Document Container */}
      <div className="mx-auto w-[210mm] h-[297mm] bg-white relative shadow-2xl print:shadow-none overflow-hidden print:m-0 flex flex-col p-[15mm]">
        
        {/* Borders */}
        <div className="absolute inset-[8mm] border-[1px] border-amber-200 pointer-events-none" />
        <div className="absolute inset-[10mm] border-[3px] border-double border-amber-600 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50 rounded-bl-[100%] opacity-30 -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-tr-[100%] opacity-20 -ml-24 -mb-24" />

        {/* Header Section */}
        <div className="relative z-10 flex flex-col items-center text-center mt-8">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-6 border-4 border-white">
              <GraduationCap className="text-white w-8 h-8" />
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">{brandName}</h1>
           <p className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase mb-10 border-t border-slate-100 pt-2 w-1/2">
             {brandAddress || brandUrl || brandEmail || brandMobile || "Autonomous Organization"}
           </p>
           
           <div className="relative mb-12">
              <div className="h-[1px] w-48 bg-amber-200 absolute left-full top-1/2 ml-4" />
              <div className="h-[1px] w-48 bg-amber-200 absolute right-full top-1/2 mr-4" />
              <h2 className="text-5xl font-serif text-amber-700 italic px-8">Diploma Certificate</h2>
           </div>
        </div>

        {/* Body Content */}
        <div className="relative z-10 px-12 flex flex-col items-center mt-4">
           {/* Student Photo */}
           <div className="absolute top-0 right-0 w-32 h-36 border-4 border-white shadow-xl ring-1 ring-slate-100 rounded-xl overflow-hidden mb-6 group transition-all duration-300">
             {data.studentId?.photo ? (
               <img src={data.studentId.photo} alt="" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><User size={40} /></div>
             )}
           </div>

           <div className="w-full space-y-10 text-center mt-20">
              <p className="text-lg font-medium text-slate-500 italic">This is to certify that</p>
              
              <div>
                 <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight border-b-2 border-slate-900 inline-block px-4 pb-1">{data.studentId?.name}</h3>
                 <div className="flex justify-center gap-12 mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>S/o / D/o: <span className="text-slate-800">{data.studentId?.fatherName}</span></span>
                    <span>M/o: <span className="text-slate-800">{data.studentId?.motherName}</span></span>
                 </div>
              </div>

              <p className="text-lg font-medium text-slate-500 italic">has successfully completed the prescribed course of study in</p>
              
              <div>
                 <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 inline-block">{data.courseName}</h4>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Course Specialized Subject</p>
              </div>

              <div className="grid grid-cols-2 gap-y-8 gap-x-16 text-left py-10 px-6 bg-amber-50/20 rounded-[2.5rem] border border-amber-100/50">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Enrollment Number</p>
                    <p className="text-sm font-black text-slate-800 uppercase leading-none">{data.enrollmentNo}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Certificate Serial</p>
                    <p className="text-sm font-black text-slate-800 uppercase leading-none">{data.serialNo}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Issue Date</p>
                    <p className="text-sm font-black text-slate-800 uppercase leading-none">{new Date(data.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Academic Session</p>
                    <p className="text-sm font-black text-slate-800 uppercase leading-none">{data.session}</p>
                 </div>
              </div>

              <div className="pt-8 w-full flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                       <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Training Auth</p>
                       <p className="text-[11px] font-black text-slate-800 uppercase">{data.centerName} ({data.centerCode})</p>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    Grade Awarded: <span className="text-lg text-slate-900 ml-2">{data.grade}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer / Signatures */}
        <div className="mt-auto relative z-10 flex justify-between items-end pb-10 px-6">
           <div className="text-center group">
              <div className="w-40 h-10 border-b-2 border-slate-200 mb-2 transition-colors group-hover:border-amber-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Candidate Signature</p>
           </div>
           
           {/* Seal Place */}
           <div className="w-24 h-24 rounded-full border-2 border-amber-100/50 flex items-center justify-center opacity-40 grayscale group-hover:grayscale-0 transition-all">
              <div className="w-20 h-20 rounded-full border border-amber-200 flex items-center justify-center">
                 <ShieldCheck className="w-8 h-8 text-amber-600" />
              </div>
           </div>

           <div className="text-center group">
              <div className="w-40 h-12 flex items-center justify-center mb-1">
                 <div className="p-2 border border-slate-100 rounded-lg bg-slate-50 text-[10px] font-black text-slate-300 uppercase italic">Digital Archive Copy</div>
              </div>
              <div className="w-40 h-[0.5px] bg-slate-200 mb-2" />
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Admin / Controller</p>
           </div>
        </div>

        {/* Diagonal Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none transform rotate-[35deg]">
           <p className="text-[120px] font-black uppercase text-slate-900 tracking-[0.1em]">{brandName}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background-color: white !important;
          }
          .mx-auto {
            margin: 0 !important;
            padding: 10mm !important;
          }
          .absolute.inset-\\[8mm\\] {
            inset: 8mm !important;
          }
          .absolute.inset-\\[10mm\\] {
            inset: 10mm !important;
          }
        }
      `}</style>
    </div>
  );
}

