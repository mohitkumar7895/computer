"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Printer, FileText } from "lucide-react";
import { apiFetch } from "@/utils/api";

export default function MarksheetPrintPage() {
  const { examId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bg, setBg] = useState("");
  const [sig, setSig] = useState("");

  useEffect(() => {
    // 1. Fetch Marksheet Data
    apiFetch(`/api/student/documents/marksheet?examId=${examId}`)
      .then(res => res.json())
      .then(d => {
        if (d.data) setData(d.data);
        else router.push("/student/dashboard");
      })
      .catch(() => router.push("/student/dashboard"));

    // 2. Fetch Background Template
    apiFetch("/api/public/backgrounds").then(res => res.json()).then(bgs => {
      setBg(bgs.marksheet);
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
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-tight flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700"
        >
          <Printer size={16} /> Print Marksheet (A4)
        </button>
      </div>

      {/* A4 Container */}
      <div className="w-[210mm] h-[297mm] bg-white shadow-2xl relative overflow-hidden print:shadow-none" id="cert-a4">
        {/* Background Layer */}
        {bg && (
          <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Dynamic Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col pt-[50mm] px-[25mm] text-[#1a1a1a]">
           {/* Header Area */}
           <div className="flex justify-between items-start mb-[15mm]">
              <div className="space-y-1">
                 <h2 className="text-[18px] font-black uppercase tracking-tight text-indigo-900 leading-none">Academic Marksheet</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statement of Marks</p>
              </div>
              <div className="w-[25mm] h-[30mm] border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
                 {data.studentId?.photo ? <img src={data.studentId.photo} alt="" className="w-full h-full object-cover" /> : <FileText className="text-slate-200" />}
              </div>
           </div>

           {/* Personal Info Grid */}
           <div className="grid grid-cols-2 gap-y-4 border-y-2 border-slate-100 py-6 mb-[10mm]">
              {[
                 { l: 'Full Name', v: data.studentId?.name },
                 { l: 'Father Name', v: data.studentId?.fatherName },
                 { l: 'Enrollment No', v: data.enrollmentNo },
                 { l: 'Roll Number', v: data.rollNo },
                 { l: 'Course Opted', v: data.courseName },
                 { l: 'Academic Date', v: new Date(data.issueDate).toLocaleDateString() },
              ].map(it => (
                 <div key={it.l} className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{it.l}</span>
                    <span className="text-[11px] font-bold text-slate-800 uppercase">{it.v}</span>
                 </div>
              ))}
           </div>

           {/* Marks Table */}
           <div className="border border-slate-200 rounded-sm mb-[10mm]">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <tr>
                       <th className="px-4 py-3">Subject / Paper Description</th>
                       <th className="px-4 py-3 text-center">Max Marks</th>
                       <th className="px-4 py-3 text-center">Marks Obtained</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-[11px]">
                    {data.subjects?.map((s: any, idx: number) => (
                       <tr key={idx}>
                          <td className="px-4 py-3 font-bold text-slate-700">{s.subjectName}</td>
                          <td className="px-4 py-3 text-center font-bold">{s.totalMarks}</td>
                          <td className="px-4 py-3 text-center font-black text-indigo-700">{s.marksObtained}</td>
                       </tr>
                    ))}
                    {/* Padding rows */}
                    {[1, 2, 3].map(i => (
                       <tr key={i}><td className="px-4 py-5 font-bold text-slate-700" /><td /><td /></tr>
                    ))}
                 </tbody>
                 <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr className="text-[11px] font-black uppercase tracking-widest">
                       <td className="px-4 py-4 text-right">Aggregate Total</td>
                       <td className="px-4 py-4 text-center">{data.totalMax}</td>
                       <td className="px-4 py-4 text-center text-indigo-900 border-l border-slate-100">{data.totalObtained}</td>
                    </tr>
                 </tfoot>
              </table>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-3 gap-6 mb-[20mm]">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                 <p className="text-xl font-black text-slate-900">{data.percentage}%</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Grade</p>
                 <p className="text-xl font-black text-slate-900">{data.grade}</p>
              </div>
              <div className="p-4 bg-indigo-900 text-white rounded-lg text-center">
                 <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mb-1">Result Status</p>
                 <p className="text-xl font-black uppercase">{data.result}</p>
              </div>
           </div>

           {/* Signature Row */}
           <div className="flex justify-between items-end mt-auto pb-[20mm]">
               <div className="text-center space-y-2">
                  <div className="h-[20mm] flex items-center justify-center">
                    {sig ? (
                       <img src={sig} alt="" className="h-full object-contain" />
                    ) : (
                       <div className="italic text-slate-300 transform -rotate-12">Authorized Signature</div>
                    )}
                  </div>
                  <div className="w-[40mm] h-[0.5mm] bg-slate-200 mx-auto" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Exam Controller</p>
               </div>
              <div className="text-center space-y-2">
                 <div className="h-[20mm] flex items-center justify-center italic text-slate-300 transform -rotate-12">Authorized Signature</div>
                 <div className="w-[40mm] h-[0.5mm] bg-slate-200 mx-auto" />
                 <p className="text-[9px] font-black uppercase tracking-widest">Seal of Academy</p>
              </div>
           </div>

           {/* Verification */}
           <div className="flex items-center justify-center gap-4 py-6 border-t border-slate-50">
              <ShieldCheck className="text-indigo-200" size={24} />
              <div className="text-left">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Digital Identity Verification</p>
                 <p className="text-[7px] font-bold text-slate-300 uppercase leading-none">Scan QR code on the back side or portal for authenticity check</p>
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
