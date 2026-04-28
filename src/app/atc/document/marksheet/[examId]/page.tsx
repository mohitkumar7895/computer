"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, FileText, CheckCircle, ShieldCheck, User, QrCode } from "lucide-react";

import { useBrand } from "@/context/BrandContext";

export default function AtcMarksheetPage() {
  const { examId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const { brandName: rawBrandName, brandMobile, brandEmail, brandAddress, brandUrl } = useBrand();
  const brandName = rawBrandName.toUpperCase();

  useEffect(() => {
    fetch(`/api/atc/documents/marksheet?examId=${examId}`)
      .then((res) => res.json())
      .then((d) => (d.data ? setData(d.data) : router.push("/atc/dashboard")))
      .catch(() => router.push("/atc/dashboard"));
  }, [examId, router]);

  if (!data) return <div className="p-10 font-bold text-slate-400 animate-pulse uppercase tracking-widest text-center">Processing Statement of Marks...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
      {/* Control Bar */}
      <div className="mx-auto w-[210mm] mb-6 print:hidden flex justify-between items-center bg-white p-4 rounded-[1.5rem] shadow-xl border border-white">
        <div className="flex items-center gap-3">
           <button onClick={() => router.back()} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs hover:bg-slate-200 transition">Back</button>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Document Preview: Statement of Marks</p>
        </div>
        <button onClick={() => window.print()} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2">
           Print Marksheet
        </button>
      </div>

      <div className="mx-auto w-[210mm] h-[297mm] bg-white relative shadow-2xl print:shadow-none overflow-hidden print:m-0 flex flex-col p-[15mm]">
        
        {/* Borders */}
        <div className="absolute inset-[8mm] border-[0.5px] border-slate-200 pointer-events-none" />
        <div className="absolute inset-[10mm] border-[2px] border-slate-900 pointer-events-none" />

        {/* Header Section */}
        <div className="relative z-10 flex justify-between items-start mb-12">
           <div className="flex gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                 <FileText size={28} />
              </div>
              <div className="leading-tight">
                 <h1 className="text-2xl font-black text-slate-900 uppercase">{brandName}</h1>
                 <p className="text-[8px] font-black text-slate-400 tracking-[0.1em] uppercase">{brandEmail || brandMobile || brandUrl || brandAddress || "Official Institution"}</p>
                 <div className="mt-2 inline-block px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase rounded">Statement of Marks</div>
              </div>
           </div>
           
           <div className="text-right">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 inline-block">
                 <QrCode size={40} className="text-slate-800" />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified Document</p>
           </div>
        </div>

        {/* Identity Grid */}
        <div className="relative z-10 grid grid-cols-12 gap-8 mb-10">
           <div className="col-span-3">
              <div className="w-full aspect-[3/4] bg-slate-50 border-4 border-white shadow-xl ring-1 ring-slate-100 rounded-xl overflow-hidden group">
                {data.studentId?.photo ? (
                  <img src={data.studentId.photo} alt={data.studentId?.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={40} /></div>
                )}
              </div>
           </div>
           
           <div className="col-span-9 grid grid-cols-2 gap-y-6 pt-2">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Candidate Name</p>
                 <p className="text-sm font-black text-slate-900 uppercase">{data.studentId?.name}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrollment / Roll No</p>
                 <p className="text-sm font-black text-slate-900 uppercase">{data.enrollmentNo}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Father's Name</p>
                 <p className="text-sm font-black text-slate-800 uppercase">{data.studentId?.fatherName}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mother's Name</p>
                 <p className="text-sm font-black text-slate-800 uppercase">{data.studentId?.motherName}</p>
              </div>
              <div className="space-y-1 col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Course of Study</p>
                 <p className="text-sm font-black text-indigo-700 uppercase">{data.courseName}</p>
              </div>
           </div>
        </div>

        {/* Info Row */}
        <div className="relative z-10 grid grid-cols-4 gap-4 mb-8">
           {[
             { label: 'Issue Date', val: new Date(data.issueDate).toLocaleDateString('en-GB') },
             { label: 'Session', val: data.studentId?.session || '2024-25' },
             { label: 'Center Code', val: data.centerCode || data.centerName || brandName },
             { label: 'Status', val: data.result || 'Pass' },
           ].map((item, i) => (
             <div key={i} className="p-3 border border-slate-100 rounded-xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-[10px] font-black text-slate-800 uppercase">{item.val}</p>
             </div>
           ))}
        </div>

        {/* Marks Table */}
        <div className="relative z-10 flex-1">
           <table className="w-full border-collapse">
              <thead>
                 <tr className="bg-slate-900 text-white">
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest rounded-tl-xl">Subject / Modules</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Max Marks</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest rounded-tr-xl">Marks Obtained</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border border-slate-100 border-t-0">
                 {data.subjects?.length > 0 ? (
                   data.subjects.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700 uppercase">{s.subjectName}</p>
                          <p className="text-[9px] text-slate-400 font-medium">Core Examination Module</p>
                       </td>
                       <td className="px-6 py-4 text-center text-sm font-black text-slate-400">{s.totalMarks}</td>
                       <td className="px-6 py-4 text-center text-sm font-black text-slate-900 border-l border-slate-50">{s.marksObtained}</td>
                    </tr>
                   ))
                 ) : (
                    <tr>
                       <td className="px-6 py-8">
                          <p className="text-sm font-bold text-slate-700 uppercase">General Course Assessment</p>
                          <p className="text-[9px] text-slate-400 font-medium">Continuous Comprehensive Evaluation</p>
                       </td>
                       <td className="px-6 py-8 text-center text-sm font-black text-slate-400">{data.totalMax || 100}</td>
                       <td className="px-6 py-8 text-center text-sm font-black text-slate-900 border-l border-slate-50">{data.totalObtained}</td>
                    </tr>
                 )}
              </tbody>
              <tfoot className="bg-slate-50">
                 <tr className="border border-slate-100 border-t-0">
                    <td className="px-6 py-4 font-black text-slate-900 uppercase text-xs">Aggregate Total</td>
                    <td className="px-6 py-4 text-center font-black text-slate-400 text-sm">{data.totalMax}</td>
                    <td className="px-6 py-4 text-center font-black text-slate-900 text-lg">{data.totalObtained}</td>
                 </tr>
              </tfoot>
           </table>

           {/* Results Summary */}
           <div className="mt-8 grid grid-cols-3 gap-6">
              <div className="bg-slate-900 text-white p-6 rounded-[2rem] text-center shadow-lg transform -rotate-2">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Percentage</p>
                 <p className="text-3xl font-black">{data.percentage || Math.round((data.totalObtained/data.totalMax)*100)}%</p>
              </div>
              <div className="bg-amber-500 text-white p-6 rounded-[2rem] text-center shadow-lg">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">Grade Awarded</p>
                 <p className="text-3xl font-black">{data.grade}</p>
              </div>
              <div className="bg-indigo-600 text-white p-6 rounded-[2rem] text-center shadow-lg transform rotate-2">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">Final Result</p>
                 <p className="text-3xl font-black uppercase">{data.result || 'Pass'}</p>
              </div>
           </div>
        </div>

        {/* Footer / Signatures */}
        <div className="mt-auto relative z-10 flex justify-between items-end pb-10 px-6">
           <div className="text-center group">
              <div className="w-40 h-12 flex items-center justify-center opacity-20">
                 <ShieldCheck size={32} className="text-slate-400" />
              </div>
              <div className="w-40 h-[0.5px] bg-slate-200 mb-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training Partner</p>
           </div>

           <div className="text-center group">
              <div className="w-48 h-12 flex flex-col items-center justify-center mb-1">
                 <div className="px-4 py-1.5 border border-slate-100 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Digitally Verified Document</div>
              </div>
              <div className="w-48 h-[1px] bg-slate-900 mb-2" />
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Controller of Examination</p>
           </div>
        </div>

        {/* Side Watermark */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 select-none pointer-events-none opacity-[0.05]">
           <p className="text-[90px] font-black tracking-[0.5em] text-slate-900 whitespace-nowrap">AUTHENTIC ACADEMIC RECORD</p>
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
