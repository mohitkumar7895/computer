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

  const handleModeSelect = async (mode: "online" | "offline") => {
    if (mode === "online") {
      if (confirm("You have selected Online Exam. Please ensure you have a stable internet connection and a suitable environment. Do you want to proceed?")) {
        submitRequest("online");
      }
    } else {
      setModeSelection("offline");
    }
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
      {!modeSelection && exams.every(e => e.status === "completed" || e.approvalStatus === "rejected") && (
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sm:p-10">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <Monitor className="text-blue-600" /> Exam Mode Selection
          </h2>
          <p className="text-slate-500 mb-8 font-medium">Choose how you would like to appear for your upcoming examination.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button 
              onClick={() => handleModeSelect("online")}
              className="group p-8 rounded-[2rem] border-2 border-blue-50 bg-blue-50/30 hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 text-left"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Monitor className="text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 group-hover:text-white mb-2">Start Online Exam</h3>
              <p className="text-sm text-slate-500 group-hover:text-blue-100 font-medium">Take the exam from any device with a stable internet connection.</p>
            </button>

            <button 
              onClick={() => handleModeSelect("offline")}
              className="group p-8 rounded-[2rem] border-2 border-emerald-50 bg-emerald-50/30 hover:bg-emerald-600 hover:border-emerald-600 transition-all duration-300 text-left"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Map className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 group-hover:text-white mb-2">Apply for Offline Exam</h3>
              <p className="text-sm text-slate-500 group-hover:text-emerald-100 font-medium">Visit your assigned training center to appear for the exam.</p>
            </button>
          </div>
        </section>
      )}

      {/* Offline Request Form / Edit Mode Form */}
      {(modeSelection === "offline" || (editingExamId && modeSelection)) && (
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FileText className={modeSelection === 'online' ? "text-blue-600" : "text-emerald-600"} /> 
              {editingExamId ? `Update ${modeSelection} Details` : "Offline Exam Request"}
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
          <div className="overflow-x-auto">
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
                        {exam.status === 'pending' && (exam.approvalStatus === 'pending' || exam.approvalStatus === 'approved') && (
                          <button 
                            onClick={() => handleEdit(exam)}
                            className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-2"
                          >
                            Edit Mode
                          </button>
                        )}
                        {exam.status === 'completed' && (
                          <div className="flex flex-col items-start gap-1">
                              <span className="text-[10px] font-black text-green-600 uppercase">Completed</span>
                              {exam.resultDeclared ? (
                                <span className="text-sm font-black text-slate-800">{exam.totalScore}/{exam.maxScore}</span>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-400 italic">Processing Result</span>
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

       {/* Notifications Section */}
       <section className="bg-[#0a0a2e] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 uppercase">
              <AlertCircle className="text-blue-400" /> Notifications & Updates
            </h2>
            <div className="space-y-4">
              {exams.some(e => e.approvalStatus === 'approved' && !e.admitCardReleased) && (
                 <div className="bg-white/10 border border-white/20 rounded-[1.5rem] p-5 flex items-start gap-4 backdrop-blur-md">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle className="text-green-400" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Exam Approved!</p>
                      <p className="text-xs text-blue-200 font-medium leading-relaxed mt-1">Your exam request has been approved. Your admit card will be released soon.</p>
                    </div>
                 </div>
              )}
              {exams.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 flex items-start gap-4 opacity-60">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">No New Notifications</p>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed mt-1">Upcoming exam schedules and results will appear here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px]" />
      </section>

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
