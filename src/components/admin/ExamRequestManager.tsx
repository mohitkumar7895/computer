"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle, XCircle, Clock, Search, 
  Download, Calendar, MapPin, Monitor, Eye,
  RefreshCw, AlertCircle, FileText, X
} from "lucide-react";

interface ExamRequestManagerProps {
  atcId?: string;
  role?: "admin" | "atc";
}

export default function ExamRequestManager({ atcId, role = "admin" }: ExamRequestManagerProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "online" | "offline">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Approval Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [questionSets, setQuestionSets] = useState<any[]>([]);
  const [approvalForm, setApprovalForm] = useState({
    examDate: "",
    examTime: "",
    setId: ""
  });

  // Result Modal States
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({
    status: "not_appeared" as "not_appeared" | "appeared" | "published",
    marks: "",
    resultStatus: "Waiting" as "Pass" | "Fail" | "Waiting"
  });
  const [resultCopyFile, setResultCopyFile] = useState<File | null>(null);
  const [resultSaving, setResultSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchQuestionSets();
  }, [atcId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = atcId ? `/api/admin/exams/all?atcId=${atcId}` : `/api/admin/exams/all`;
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data.exams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionSets = async () => {
    try {
      const res = await fetch("/api/atc/question-sets");
      const data = await res.json();
      setQuestionSets(data.sets || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (examId: string, status: string, extraData: any = {}) => {
    setActionLoading(examId);
    try {
      const endpoint = role === "atc" ? "/api/atc/exams/update-schedule" : "/api/admin/exams/approve";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, approvalStatus: role === "atc" ? undefined : status, ...extraData })
      });
      if (res.ok) {
        setShowApproveModal(false);
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.message || "Action failed");
      }
    } catch (err) {
      alert("Error processing action");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResultSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedExam) return;
    setResultSaving(true);
    try {
      const formData = new FormData();
      formData.append("examId", selectedExam._id);
      formData.append("offlineExamStatus", resultForm.status);
      formData.append("totalScore", resultForm.marks);
      formData.append("offlineExamResult", resultForm.resultStatus);
      if (resultCopyFile) {
        formData.append("examCopy", resultCopyFile);
      }

      const res = await fetch("/api/atc/exams/offline-result", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowResultModal(false);
        setResultCopyFile(null);
        fetchRequests();
      } else {
        const d = await res.json();
        throw new Error(d.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update result");
    } finally {
      setResultSaving(false);
    }
  };

  const openApproveModal = (exam: any) => {
    setSelectedExam(exam);
    setApprovalForm({
      examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : (exam.offlineDetails?.preferredDate || ""),
      examTime: exam.examTime || (exam.offlineDetails?.preferredTimeSlot || "10:00 AM"),
      setId: exam.setId || "",
      examMode: exam.examMode || "online" // Pre-fill with student's choice or default
    } as any);
    setShowApproveModal(true);
  };

  const handleApproveResult = async (examId: string) => {
    setActionLoading(examId);
    try {
      const res = await fetch("/api/admin/exams/declare-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, resultDeclared: true })
      });
      if (res.ok) {
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.message || "Approval failed");
      }
    } catch (err) {
      alert("Error approving result");
    } finally {
      setActionLoading(null);
    }
  };

  const openResultModal = (exam: any) => {
    setSelectedExam(exam);
    setResultForm({
      status: exam.offlineExamStatus || "not_appeared",
      marks: exam.totalScore?.toString() || "",
      resultStatus: exam.offlineExamResult || "Waiting"
    });
    setShowResultModal(true);
  };

  const filtered = requests.filter(r => {
    const matchesMode = filterMode === "all" || r.examMode === filterMode;
    const matchesStatus = filterStatus === "all" || r.approvalStatus === filterStatus;
    const matchesSearch = !searchTerm || 
      r.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId?.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMode && matchesStatus && matchesSearch;
  });

  const labelCls = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2";
  const inputCls = "w-full px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4 text-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search student or registration..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
          value={filterMode}
          onChange={(e: any) => setFilterMode(e.target.value)}
        >
          <option value="all">All Modes</option>
          <option value="online">Online Only</option>
          <option value="offline">Offline Only</option>
        </select>
        <select 
          className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
          value={filterStatus}
          onChange={(e: any) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={fetchRequests} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-800">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-2xl border border-slate-100 shadow-sm text-slate-800">
          <Monitor className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium tracking-tight">No exam requests found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600">Student Info</th>
                  <th className="px-6 py-4 font-bold text-slate-600">Exam Mode</th>
                  <th className="px-6 py-4 font-bold text-slate-600">Details / Request</th>
                  <th className="px-6 py-4 font-bold text-slate-600">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50/50 transition duration-200">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{exam.studentId?.name || "N/A"}</p>
                      <p className="text-xs text-slate-500">{exam.studentId?.registrationNo || "No Reg"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        exam.examMode === 'online' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {exam.examMode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {exam.status === 'completed' ? (
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase">Attempt Completed</span>
                           <span className="text-xs font-bold text-slate-700">{new Date(exam.submittedAt || exam.updatedAt).toLocaleDateString()}</span>
                        </div>
                      ) : exam.examMode === 'offline' ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" /> {exam.offlineDetails?.preferredDate || 'Any'}
                          </p>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" /> {exam.offlineDetails?.preferredCenter || 'Any'}
                          </p>
                          <p className="text-[10px] bg-slate-100 w-fit px-2 rounded text-slate-500">{exam.offlineDetails?.preferredTimeSlot}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Self-scheduled online</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                         exam.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                         exam.offlineExamStatus === 'review_pending' ? 'bg-purple-100 text-purple-700' :
                         exam.approvalStatus === 'approved' ? 'bg-green-50 text-green-700' : 
                         exam.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                       }`}>
                         {exam.status === 'completed' ? <CheckCircle size={12} /> : 
                          exam.offlineExamStatus === 'review_pending' ? <Clock size={12} /> :
                          exam.approvalStatus === 'pending' ? <Clock size={12} /> : 
                          exam.approvalStatus === 'approved' ? <CheckCircle size={12} /> : 
                          <XCircle size={12} />}
                         {exam.status === 'completed' ? 'COMPLETED' : 
                          exam.offlineExamStatus === 'review_pending' ? 'REVIEW PENDING' :
                          exam.approvalStatus}
                       </span>
                       {exam.offlineExamStatus === 'published' && (
                         <div className="mt-2 font-black text-slate-800 text-[10px] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                            RESULT: {exam.totalScore || 0}/{exam.maxScore || 100} ({exam.offlineExamResult})
                         </div>
                       )}
                       {exam.examMode === 'online' && exam.status === 'completed' && (
                          <div className="mt-2 font-black text-slate-800 text-[10px] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                             SCORE: {exam.totalScore || 0}/{exam.maxScore || 100}
                          </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      <div className="flex items-center gap-2">
                        {exam.approvalStatus === 'pending' && (
                          <>
                            {role === "admin" ? (
                              <>
                                <button 
                                  onClick={() => openApproveModal(exam)}
                                  disabled={actionLoading === exam._id}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-green-700 transition shadow-sm"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleAction(exam._id, "rejected")}
                                  disabled={actionLoading === exam._id}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-700 transition shadow-sm"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                               <button 
                                  onClick={() => openApproveModal(exam)}
                                  disabled={actionLoading === exam._id}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
                                >
                                  Set Schedule
                                </button>
                            )}
                          </>
                        )}
                        {exam.approvalStatus === 'approved' && (
                           <button 
                            onClick={role === "admin" ? () => openApproveModal(exam) : undefined}
                            disabled={actionLoading === exam._id || role !== "admin"}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition shadow-sm whitespace-nowrap disabled:opacity-50"
                          >
                            {exam.admitCardReleased ? 'Edit Schedule' : 'Set Date & Release'}
                          </button>
                        )}
                        
                        {exam.examMode === 'offline' && exam.approvalStatus === 'approved' && (
                           <button 
                             onClick={() => openResultModal(exam)}
                             className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition shadow-sm whitespace-nowrap ${
                               exam.offlineExamStatus === 'review_pending' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-orange-600 text-white hover:bg-orange-700'
                             }`}
                           >
                             {exam.offlineExamStatus === 'review_pending' ? 'Edit Result' : 'Offline Result'}
                           </button>
                        )}

                        {exam.offlineExamStatus === 'review_pending' && (
                          <button 
                             onClick={() => handleApproveResult(exam._id)}
                             disabled={actionLoading === exam._id}
                             className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 transition shadow-sm whitespace-nowrap flex items-center gap-1"
                          >
                            {actionLoading === exam._id ? <RefreshCw className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3" />}
                            Approve Result
                          </button>
                        )}

                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve / Schedule Modal */}
      {showApproveModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Finalize Exam Schedule</h3>
                  <p className="text-xs text-slate-500 font-medium">Set the official exam date and time.</p>
                </div>
                <button onClick={() => setShowApproveModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
             </div>

             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={labelCls}>Final Exam Mode</label>
                    <select 
                        className={inputCls}
                        value={(approvalForm as any).examMode}
                        onChange={(e) => setApprovalForm({...approvalForm, examMode: e.target.value} as any)}
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className={labelCls}>Final Exam Date</label>
                    <input 
                        type="date"
                        className={inputCls}
                        value={approvalForm.examDate}
                        onChange={(e) => setApprovalForm({...approvalForm, examDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className={labelCls}>Time Slot</label>
                   <input 
                      type="text"
                      placeholder="e.g. 11:00 AM - 01:00 PM"
                      className={inputCls}
                      value={approvalForm.examTime}
                      onChange={(e) => setApprovalForm({...approvalForm, examTime: e.target.value})}
                   />
                </div>

                <div className="space-y-2">
                   <label className={labelCls}>Select Question Set</label>
                   <select 
                      className={inputCls}
                      value={approvalForm.setId}
                      onChange={(e) => setApprovalForm({...approvalForm, setId: e.target.value})}
                   >
                     <option value="">Choose Set</option>
                     {questionSets.map(set => (
                       <option key={set._id} value={set._id}>{set.title} ({set.questionCount}Q)</option>
                     ))}
                   </select>
                </div>

                <button 
                  onClick={() => handleAction(selectedExam._id, "approved", { ...approvalForm, admitCardReleased: role === "admin" })}
                  className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl"
                >
                  {role === "admin" ? "Approve & Release Admit Card" : "Save Schedule Details"}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Offline Result Modal */}
      {showResultModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800">Manage Offline Result</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {selectedExam.studentId?.name} • {selectedExam.studentId?.registrationNo}
                    </p>
                 </div>
                 <button onClick={() => setShowResultModal(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition">
                    <X className="w-5 h-5 text-slate-400" />
                 </button>
              </div>

              <form onSubmit={handleResultSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className={labelCls}>Exam Status</label>
                       <select 
                         className={inputCls}
                         value={resultForm.status}
                         onChange={e => setResultForm({...resultForm, status: e.target.value as any})}
                         required
                       >
                          <option value="not_appeared">Not Appeared</option>
                          <option value="appeared">Attended</option>
                          <option value="published">Result Published</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className={labelCls}>Total Marks Obtained</label>
                       <input 
                         className={inputCls}
                         placeholder="e.g. 85"
                         value={resultForm.marks}
                         onChange={e => setResultForm({...resultForm, marks: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className={labelCls}>Result Outcome</label>
                       <select 
                         className={inputCls}
                         value={resultForm.resultStatus}
                         onChange={e => setResultForm({...resultForm, resultStatus: e.target.value as any})}
                         required
                       >
                          <option value="Waiting">Waiting</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className={labelCls}>Upload Scanned Copy (PDF)</label>
                       <input 
                         type="file"
                         accept="application/pdf"
                         onChange={e => setResultCopyFile(e.target.files?.[0] ?? null)}
                         className="w-full text-[10px] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:font-black file:uppercase"
                       />
                    </div>
                 </div>

                 <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                       Results marked as &quot;Published&quot; will be visible to the student in their dashboard instantly. Marks and copy will also be synced to their profile.
                    </p>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowResultModal(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={resultSaving}
                      className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-700 transition shadow-xl shadow-orange-100 disabled:opacity-50"
                    >
                      {resultSaving ? "Processing..." : "Submit Result"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
