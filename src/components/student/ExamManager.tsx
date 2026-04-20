"use client";

import { useState, useEffect } from "react";
import { 
  FileText, CheckCircle, Clock, AlertCircle, 
  Download, Calendar, MapPin, Monitor, Map
} from "lucide-react";
import AdmitCard from "./AdmitCard";
import LiveExam from "./LiveExam";

interface ExamManagerProps {
  student: any;
}

export default function ExamManager({ student }: ExamManagerProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeSelection, setModeSelection] = useState<"online" | "offline" | null>(null);
  const [offlineForm, setOfflineForm] = useState({
    preferredDate: "",
    preferredCenter: "",
    preferredTimeSlot: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examInProgress, setExamInProgress] = useState<any>(null);

  useEffect(() => {
    fetchExams();
  }, [student]);

  const fetchExams = async () => {
    try {
      const res = await fetch(`/api/student/exams/status?studentId=${student._id}`);
      const data = await res.json();
      setExams(data.exams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exam: any) => {
    setEditingExamId(exam._id);
    setModeSelection(exam.examMode);
    if (exam.examMode === "offline") {
      setOfflineForm({
        preferredDate: exam.offlineDetails?.preferredDate || "",
        preferredCenter: exam.offlineDetails?.preferredCenter || "",
        preferredTimeSlot: exam.offlineDetails?.preferredTimeSlot || ""
      });
    }
  };

  const handleModeSelect = (mode: "online" | "offline") => {
    setModeSelection(mode);
  };

  const submitRequest = async (mode: "online" | "offline") => {
    setSubmitting(true);
    try {
      const body = {
        studentId: student._id,
        examId: editingExamId,
        examMode: mode,
        ...(mode === "offline" ? offlineForm : {})
      };
      
      const res = await fetch("/api/student/exams/status", {
        method: editingExamId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(editingExamId ? "Exam request updated successfully!" : "Exam request submitted successfully!");
        setModeSelection(null);
        setEditingExamId(null);
        fetchExams();
      } else {
        alert(data.message || "Failed to process request");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 truncate">Loading exam records...</div>;

  return (
    <div className="space-y-8">
      {/* Mode Selection UI */}
      {/* Mode Selection UI Removed as requested */}

      {/* Offline Request Form / Edit Mode Form */}
      {(modeSelection === "offline" || (editingExamId && modeSelection)) && (
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FileText className={modeSelection === 'online' ? "text-blue-600" : "text-emerald-600"} /> 
              {editingExamId ? `Update ${modeSelection} Details` : `${modeSelection === 'online' ? 'Online' : 'Offline'} Exam Request`}
            </h2>
            <button onClick={() => { setModeSelection(null); setEditingExamId(null); }} className="text-sm font-bold text-slate-400 hover:text-slate-600">Cancel</button>
          </div>

          {editingExamId && modeSelection === "online" ? (
             <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6 font-bold text-blue-700 text-sm">
                You are switching to Online Mode. You can directly attempt the exam once saved.
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Exam Date</label>
                <input 
                  type="date" 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition"
                  value={offlineForm.preferredDate}
                  onChange={(e) => setOfflineForm({...offlineForm, preferredDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Time Slot</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition"
                  value={offlineForm.preferredTimeSlot}
                  onChange={(e) => setOfflineForm({...offlineForm, preferredTimeSlot: e.target.value})}
                >
                  <option value="">Select Slot</option>
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                  <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Center (ATC)</label>
                <input 
                  type="text" 
                  placeholder="Enter center name or code"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition"
                  value={offlineForm.preferredCenter}
                  onChange={(e) => setOfflineForm({...offlineForm, preferredCenter: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            {editingExamId && (
              <select 
                value={modeSelection || ""}
                onChange={(e) => setModeSelection(e.target.value as any)}
                className="w-1/3 px-6 py-5 bg-slate-100 rounded-[1.5rem] font-black uppercase text-xs tracking-widest outline-none border-none"
              >
                <option value="online">Online Mode</option>
                <option value="offline">Offline Mode</option>
              </select>
            )}
            <button 
              disabled={submitting}
              onClick={() => submitRequest(modeSelection || "offline")}
              className="flex-1 py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl"
            >
              {submitting ? "Processing..." : (editingExamId ? "Update Request" : "Submit Request")}
            </button>
          </div>
        </section>
      )}

      {/* My Exams Section */}
      {exams.length > 0 && (
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sm:p-10">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <Calendar className="text-blue-600" /> My Examination Records
          </h2>
          <div>
            <table className="w-full border-separate border-spacing-y-4">
              <thead>
                <tr className="text-left">
                  <th className="px-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mode</th>
                  <th className="px-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date & Time</th>
                  <th className="px-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Admit Card</th>
                  <th className="px-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id} className="group hover:scale-[1.01] transition-transform">
                    <td className="px-6 py-5 bg-slate-50/50 rounded-l-[1.5rem]">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        exam.examMode === 'online' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {exam.examMode}
                      </span>
                    </td>
                    <td className="px-6 py-5 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-800">
                        {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : 'TBD'}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">{exam.examTime || 'TBD'}</p>
                    </td>
                    <td className="px-6 py-5 bg-slate-50/50">
                       <span className={`flex items-center gap-1.5 text-xs font-black uppercase ${
                        exam.approvalStatus === 'approved' ? 'text-green-600' : 
                        exam.approvalStatus === 'rejected' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {exam.approvalStatus === 'pending' && <Clock size={12} />}
                        {exam.approvalStatus === 'approved' && <CheckCircle size={12} />}
                        {exam.approvalStatus === 'rejected' && <AlertCircle size={12} />}
                        {exam.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-5 bg-slate-50/50">
                      {exam.admitCardReleased ? (
                        <button 
                          onClick={() => setSelectedExam(exam)}
                          className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:underline decoration-2 underline-offset-4"
                        >
                          <Download size={14} /> View
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Not Released</span>
                      )}
                    </td>
                    <td className="px-6 py-5 bg-slate-50/50 rounded-r-[1.5rem]">
                      <div className="flex items-center gap-3">
                        {exam.approvalStatus === 'approved' && exam.status === 'pending' && exam.examMode === 'online' && (
                          <div className="flex flex-col items-start gap-1">
                            {(() => {
                              const examDateObj = exam.examDate ? new Date(exam.examDate) : null;
                              const now = new Date();
                              
                              // Check if it's the right date
                              const isToday = examDateObj && examDateObj.toDateString() === now.toDateString();
                              const isReleased = exam.admitCardReleased;
                              
                              if (!isReleased) {
                                return <span className="text-[9px] font-bold text-slate-400 italic">Admit Card Not Released</span>;
                              }

                              // Allow online exam to start if matches today OR if no specific date is set 
                              // OR if examDate was in the past (still active)
                              const canStart = !examDateObj || isToday || examDateObj < now;

                              if (!canStart) {
                                return (
                                  <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-black text-amber-600 uppercase">Wait for Schedule</span>
                                    <span className="text-[8px] font-bold text-slate-400">Date: {examDateObj?.toLocaleDateString()}</span>
                                  </div>
                                );
                              }

                              return (
                                <button 
                                  onClick={() => setExamInProgress(exam)}
                                  className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                                >
                                  Attempt Now
                                </button>
                              );
                            })()}
                          </div>
                        )}

                        {exam.status === 'completed' && (
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                                  exam.offlineExamResult === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 
                                  exam.offlineExamResult === 'Fail' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                   {exam.offlineExamResult || 'COMPLETED'}
                                </span>
                                <span className="text-sm font-black text-slate-800">{exam.totalScore}/{exam.maxScore}</span>
                             </div>

                             {exam.examMode === 'offline' && exam.offlineExamCopy ? (
                                <a 
                                  href={exam.offlineExamCopy} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                                >
                                  <FileText size={12} className="text-blue-400" /> View Exam Copy
                                </a>
                             ) : exam.examMode === 'offline' && (
                                <span className="text-[9px] font-bold text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                   Wait for Digital Copy
                                </span>
                             )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Offline Examination Results */}
      {(() => {
        // Find the latest completed offline exam with a published result
        const publishedOfflineExam = exams.find(e => e.examMode === 'offline' && e.offlineExamStatus === 'published');
        
        if (!publishedOfflineExam) return null;

        return (
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sm:p-10 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <CheckCircle className="text-orange-600" /> Offline Examination Results
                  </h2>
                  <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Officially Published Result Card</p>
                </div>
                <div className="px-6 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-2">
                   <CheckCircle size={16} />
                   <span className="text-xs font-black uppercase tracking-widest">Authenticated</span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center flex flex-col items-center justify-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Secured Marks</p>
                   <p className="text-4xl font-black text-slate-900 leading-none">{publishedOfflineExam.totalScore}/{publishedOfflineExam.maxScore || 100}</p>
                   <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Final Score
                   </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center flex flex-col items-center justify-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Result Status</p>
                   <p className={`text-3xl font-black leading-none ${publishedOfflineExam.offlineExamResult === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {publishedOfflineExam.offlineExamResult || "Waiting"}
                   </p>
                   <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Evaluation Complete</p>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2rem] text-center flex flex-col items-center justify-center shadow-2xl group">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="text-white" size={24} />
                   </div>
                   <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-4">Exam Answer Sheet</p>
                   {publishedOfflineExam.offlineExamCopy ? (
                      <a 
                        href={publishedOfflineExam.offlineExamCopy} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-50 transition active:scale-95"
                      >
                         <Download size={14} /> View Result Copy
                      </a>
                   ) : (
                      <span className="text-[10px] text-white/40 font-bold uppercase italic tracking-wider">File Processing...</span>
                   )}
                </div>
             </div>
          </section>
        );
      })()}



      {selectedExam && (
        <AdmitCard 
          student={student} 
          exam={selectedExam} 
          onClose={() => setSelectedExam(null)} 
        />
      )}

      {examInProgress && (
        <LiveExam 
          exam={examInProgress}
          student={student}
          onFinish={() => {
            setExamInProgress(null);
            fetchExams();
          }}
        />
      )}
    </div>
  );
}
