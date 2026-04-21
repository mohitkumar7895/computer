"use client";

import React from "react";
import { GraduationCap, User, ShieldCheck } from "lucide-react";

interface StudentIdCardProps {
  student: {
    photo?: string;
    name: string;
    course: string;
    registrationNo: string;
    tpCode: string;
    mobile: string;
    dob: string;
  };
  backgroundFront?: string;
}

export default function StudentIdCard({ student, backgroundFront }: StudentIdCardProps) {
  return (
    <div id="student-id-card" className="w-[340px] h-[520px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-200 print:shadow-none print:border-slate-300">
      {/* Front Design */}
      <div className="h-[43%] bg-[#0a0a2e] p-8 text-center relative overflow-hidden">
         {backgroundFront && (
           <img src={backgroundFront} alt="" className="absolute inset-0 w-full h-full object-cover" />
         )}
         <div className="flex flex-col items-center relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <GraduationCap className="text-blue-500" />
              <span className="text-white text-[12px] font-black tracking-widest uppercase italic">Yukti Education</span>
            </div>
            <div className="relative">
               {student.photo ? (
                 <img src={student.photo} alt={student.name} className="w-32 h-32 rounded-[2rem] border-4 border-white shadow-2xl object-cover" />
               ) : (
                 <div className="w-32 h-32 rounded-[2rem] bg-white flex items-center justify-center shadow-2xl">
                    <User size={60} className="text-slate-200" />
                 </div>
               )}
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full border-2 border-white shadow-lg uppercase tracking-widest ring-4 ring-blue-600/20">Verified</div>
            </div>
         </div>
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Details View */}
      <div className="p-10 pt-12 text-center bg-white relative">
         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-1 truncate">{student.name}</h3>
         <p className="text-blue-600 font-black text-[11px] uppercase tracking-[0.25em] mb-10 truncate">{student.course}</p>
         
         <div className="space-y-4 px-2">
            <div className="grid grid-cols-2 pb-4 border-b border-slate-100 gap-6 text-left">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Student UID</p>
                  <p className="text-[10px] font-black text-slate-800 leading-none">{student.registrationNo}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Center</p>
                  <p className="text-[10px] font-black text-slate-800 leading-none truncate">{student.tpCode}</p>
               </div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Validated Contact</p>
               <p className="text-xs font-black text-slate-800 leading-none">{student.mobile}</p>
            </div>
            <div className="flex justify-between items-center pb-4">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Birth Date</p>
               <p className="text-xs font-black text-slate-800 leading-none">{student.dob}</p>
            </div>
         </div>
         
         <div className="mt-14 flex flex-col items-center">
            <ShieldCheck className="w-10 h-10 text-slate-100" />
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2">Digital Academic Authenticator</p>
         </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
    </div>
  );
}
