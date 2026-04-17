"use client";

import { GraduationCap, ShieldCheck, MapPin, Calendar, Clock, User, Download, X, QrCode } from "lucide-react";

interface AdmitCardProps {
  student: any;
  exam: any;
  onClose: () => void;
}

export default function AdmitCard({ student, exam, onClose }: AdmitCardProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden relative print:shadow-none print:rounded-none">
        
        {/* Action Buttons (Hidden on Print) */}
        <div className="absolute top-4 right-4 flex gap-2 z-20 print:hidden">
          <button onClick={() => window.print()} className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition">
            <Download size={16} />
          </button>
          <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition">
            <X size={16} />
          </button>
        </div>

        {/* Card Content */}
        <div id="admit-card-content" className="relative p-6 bg-white min-h-[380px] flex flex-col justify-between">
          
          {/* Subtle Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-10 -mt-10 opacity-50" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-tr-[4rem] -ml-10 -mb-10 opacity-30" />

          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <div className="leading-tight">
                <h1 className="text-base font-black text-slate-800 tracking-tight uppercase">YUKTI COMPUTER EDUCATION</h1>
                <p className="text-[8px] font-black text-blue-500 tracking-[0.2em] uppercase">Examination Admit Card</p>
              </div>
            </div>
            <div className="text-right">
               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Roll No</p>
               <p className="text-xs font-black text-slate-800 tracking-tight">{student.registrationNo}</p>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex gap-6 relative z-10 mb-4">
            {/* Photo Column */}
            <div className="shrink-0 space-y-3">
              <div className="w-28 h-32 bg-slate-50 rounded-xl border-2 border-white shadow-md overflow-hidden ring-1 ring-slate-100">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <User size={40} />
                  </div>
                )}
              </div>
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                 <QrCode size={32} className="text-slate-800 mx-auto" />
                 <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest text-center mt-1">Verified</p>
              </div>
            </div>

            {/* Info Column */}
            <div className="flex-1 grid grid-cols-1 gap-4">
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Student Name</p>
                 <p className="text-sm font-black text-slate-800 capitalize leading-none">{student.name}</p>
              </div>
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Parent/Guardian</p>
                 <p className="text-xs font-bold text-slate-600 leading-none">{student.fatherName}</p>
              </div>
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Course</p>
                 <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 inline-block uppercase leading-none">{student.course}</p>
              </div>
              
              {/* Exam Info Row */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <Calendar size={10} className="text-slate-400" />
                  <p className="text-[9px] font-black text-slate-700">{exam.examDate ? new Date(exam.examDate).toLocaleDateString("en-IN") : "TBD"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={10} className="text-slate-400" />
                  <p className="text-[9px] font-black text-slate-700">{exam.examTime || "Batch 1"}</p>
                </div>
                <div className="col-span-2 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100/50 overflow-hidden">
                  <MapPin size={10} className="text-blue-500 shrink-0" />
                  <p className="text-[8px] font-bold text-slate-500 uppercase truncate">
                    {exam.examMode === 'online' ? "Online Portal" : (exam.offlineDetails?.preferredCenter || "Official ATC")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Auth */}
          <div className="flex justify-between items-end border-t border-slate-100 pt-4 relative z-10">
             <div className="space-y-1">
                <h3 className="text-[7px] font-black text-slate-400 uppercase leading-none">Exam Instructions</h3>
                <ul className="text-[6px] font-bold text-slate-500 space-y-0.5 italic">
                  <li>• Carry Original ID & Admit Card</li>
                  <li>• Report 30 mins before start</li>
                </ul>
             </div>
             
             <div className="flex items-end gap-6 h-10">
               <div className="text-center">
                  <div className="w-16 h-[0.5px] bg-slate-200 mb-1" />
                  <p className="text-[6px] font-black text-slate-300 uppercase">Candidate</p>
               </div>
               <div className="text-center">
                  <div className="w-16 h-[0.5px] bg-slate-200 mb-1" />
                  <p className="text-[6px] font-black text-slate-300 uppercase">Controller</p>
               </div>
             </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
        </div>

        {/* Global Print Optimized Styling */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden !important; }
            #admit-card-content, #admit-card-content * { visibility: visible !important; }
            #admit-card-content {
              position: fixed !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 500px !important;
              border: 1px solid #eee !important;
              padding: 30px !important;
              background: white !important;
              visibility: visible !important;
            }
            .print\\:hidden { display: none !important; }
          }
        ` }} />
      </div>
    </div>
  );
}
