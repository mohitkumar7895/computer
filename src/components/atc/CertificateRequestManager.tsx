"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Users, Clock, Search, RefreshCw, Calendar, X, Filter, Monitor, AlertCircle, CheckCircle, XCircle, Building2, ClipboardCheck, Trash2 } from "lucide-react";

interface ExamRequest {
  _id: string;
  atcId?: {
    _id?: string;
    trainingPartnerName?: string;
    tpCode?: string;
  };
  studentId: {
    _id: string;
    name: string;
    registrationNo: string;
    course: string;
    fatherName?: string;
    mobile?: string;
    photo?: string;
    profileImage?: string;
  };
  examMode: "online" | "offline";
  offlineDetails?: {
    preferredDate?: string;
    preferredCenter?: string;
    preferredTimeSlot?: string;
  };
  examDate?: string;
  examTime?: string;
  setId?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  status: "pending" | "completed";
  admitCardReleased?: boolean;
  totalScore?: number;
  maxScore?: number;
  offlineExamStatus?: string;
  offlineExamResult?: string;
  offlineExamCopy?: string;
  marksheetReleased?: boolean;
  certificateReleased?: boolean;
  grade?: string;
  session?: string;
  submittedAt?: string;
  updatedAt: string;
}

interface QuestionSet {
  _id: string;
  title: string;
  questionCount: number;
}

export default function CertificateRequestManager({ atcId, role = "atc" }: { atcId?: string, role?: "admin" | "atc" }) {
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "online" | "offline">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamRequest | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    examDate: "",
    setId: "",
    examMode: "online"
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [atcTab, setAtcTab] = useState<"new" | "history">(role === "admin" ? "history" : "new");
  const [requestExamStudent, setRequestExamStudent] = useState<any | null>(null);
  const [examReqForm, setExamReqForm] = useState({ 
    examMode: "online", 
    preferredDate: "", 
    preferredCenter: "",
    examDate: "",
    examTime: "",
    setId: ""
  });
  const [requesting, setRequesting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({
    status: "published" as "not_appeared" | "appeared" | "published",
    marks: "",
    resultStatus: "Pass" as "Pass" | "Fail" | "Waiting",
    grade: "A",
    session: ""
  });
  const [resultSaving, setResultSaving] = useState(false);
  const [resultCopyFile, setResultCopyFile] = useState<File | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseForm, setReleaseForm] = useState({ 
    marksheet: true, 
    certificate: true 
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = role === "admin" ? "/api/admin/exams/all" : "/api/atc/exams/all";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
      
      if (role === "atc") {
        const studentRes = await fetch("/api/atc/students");
        if (studentRes.ok) {
          const sData = await studentRes.json();
          setAvailableStudents(sData.students || []);
        }
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionSets = async () => {
    try {
      const res = await fetch("/api/atc/question-sets");
      if (res.ok) {
        const data = await res.json();
        setQuestionSets(data.sets || []);
      }
    } catch (err) {
      console.error("Failed to fetch sets", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchQuestionSets();
  }, [atcId, role]);

  const handleAction = async (requestId: string, status: string, details?: any) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/exams/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status, ...details }),
      });
      if (res.ok) {
        await fetchRequests();
        setShowApproveModal(false);
      }
    } catch (err) {
      console.error("Action failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestExam = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestExamStudent) return;
    setRequesting(true);
    try {
      const res = await fetch("/api/atc/exams/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: requestExamStudent._id, 
          examMode: examReqForm.examMode,
          offlineDetails: examReqForm.examMode === 'offline' ? {
            preferredDate: examReqForm.examDate,
            preferredCenter: examReqForm.preferredCenter
          } : undefined,
          examDate: examReqForm.examDate,
          examTime: examReqForm.examTime,
          setId: examReqForm.setId
        }),
      });
      if (res.ok) {
        await fetchRequests();
        setRequestExamStudent(null);
      }
    } catch (err) {
      console.error("Request failed", err);
    } finally {
      setRequesting(false);
    }
  };

  const handleResultSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    setResultSaving(true);
    try {
      const submitStatus = role === "atc" ? "published" : resultForm.status;
      const formData = new FormData();
      formData.append("studentId", selectedExam.studentId?._id);
      formData.append("examId", selectedExam._id);
      formData.append("offlineExamStatus", submitStatus);
      formData.append("totalScore", resultForm.marks);
      formData.append("offlineExamResult", resultForm.resultStatus);
      formData.append("grade", resultForm.grade);
      formData.append("session", resultForm.session);
      formData.append("examMode", selectedExam.examMode);
      if (resultCopyFile) formData.append("examCopy", resultCopyFile);

      const res = await fetch("/api/atc/exams/offline-result", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchRequests();
        setShowResultModal(false);
      }
    } catch (err) {
      console.error("Result save failed", err);
    } finally {
      setResultSaving(false);
    }
  };

  const handleApproveResult = async (examId: string, status: "published" | "appeared" = "published") => {
    setActionLoading(examId);
    try {
      const res = await fetch("/api/admin/exams/approve-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, status }),
      });
      if (res.ok) {
        await fetchRequests();
      }
    } catch (err) {
      console.error("Approve failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject" | "delete") => {
    if (selectedExams.length === 0) return;
    
    if (action === "approve") {
      setShowApproveModal(true);
      return; // The modal will handle the final batch submit
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedExams.length} requests?`)) return;

    setActionLoading("bulk");
    try {
      // In a real scenario, ideally a single bulk API endpoint. 
      // For now, loop or use a /bulk endpoint if it exists.
      for (const id of selectedExams) {
        await fetch("/api/admin/exams/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: id, status: action === "reject" ? "rejected" : "delete" }),
        });
      }
      setSelectedExams([]);
      await fetchRequests();
    } catch (err) {
      console.error("Bulk action failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const openApproveModal = (exam: ExamRequest) => {
    setSelectedExam(exam);
    setApprovalForm({
      examDate: exam.examDate || "",
      setId: exam.setId || "",
      examMode: exam.examMode
    });
    setShowApproveModal(true);
  };

  const openResultModal = (exam: ExamRequest) => {
    const autoResultStatus =
      exam.offlineExamResult ||
      (typeof exam.totalScore === "number" ? (exam.totalScore >= 33 ? "Pass" : "Fail") : "Pass");

    setSelectedExam(exam);
    setResultForm({
      status: "published",
      marks: exam.totalScore?.toString() || "",
      resultStatus: autoResultStatus as any,
      grade: (exam as any).grade || "A",
      session: (exam as any).session || ""
    });
    setResultCopyFile(null);
    setShowResultModal(true);
  };

  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId?.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.atcId?.trainingPartnerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = filterMode === "all" || r.examMode === filterMode;
    const matchesStatus = filterStatus === "all" || r.approvalStatus === filterStatus;
    return matchesSearch && matchesMode && matchesStatus;
  });

  const labelCls = "block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2";
  const inputCls = "w-full px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 transition";

  return (
    <div className="bg-slate-50/30 rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px] text-slate-800">
      {/* Top Tabs styling same as StudentManager */}
      <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-white">
        <button
          onClick={() => setAtcTab("new")}
          className={`px-4 py-3 text-sm font-bold transition-all relative ${atcTab === "new" ? "text-green-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <span className="flex items-center gap-2">
            {role === "admin" ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {role === "admin" ? "Certificate Authorize" : "Draft Certificates"}
          </span>
          {atcTab === "new" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setAtcTab("history")}
          className={`px-4 py-3 text-sm font-bold transition-all relative ${atcTab === "history" ? "text-green-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <span className="flex items-center gap-2">
            {role === "admin" ? <ClipboardCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {role === "admin" ? "Verified Certificates" : "Certificate History"}
          </span>
          {atcTab === "history" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
        </button>
      </div>

      <div className="p-6">
        {/* Search & Filter bar like StudentManager */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search student or registration..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 transition font-bold text-slate-600"
            value={filterMode}
            onChange={(e: any) => setFilterMode(e.target.value)}
          >
            <option value="all">All Modes</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>
          <button onClick={fetchRequests} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {atcTab === "new" ? (
          <div className="animate-in fade-in duration-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <span className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading student records...</p>
              </div>
            ) : requests.filter(r => r.approvalStatus === 'approved' && r.offlineExamStatus !== 'published').length === 0 ? (
              <div className="text-center p-24 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                 <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <ClipboardCheck className="w-10 h-10 text-blue-400" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">No Pending Certificates</h3>
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">All candidate requests have been processed.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Bulk Action Bar */}
                {selectedExams.length > 0 && role === "admin" && (
                  <div className="bg-slate-900 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4 text-white text-xs font-bold">
                       <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedExams.length}</div>
                       <span className="uppercase tracking-widest">Requests Selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={() => handleBulkAction("approve")} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition shadow-lg">Approve Selective</button>
                       <button onClick={() => handleBulkAction("reject")} className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase hover:bg-amber-600 transition shadow-lg">Reject Selective</button>
                       <button onClick={() => setSelectedExams([])} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">Cancel</button>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Reg No / ID</th>
                      <th className="px-6 py-4">Student Identity</th>
                      <th className="px-6 py-4">Opted Course</th>
                      <th className="px-6 py-4 text-center">Eligibility</th>
                      <th className="px-6 py-4">Result Preview</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.filter(r => r.approvalStatus === 'approved' && r.offlineExamStatus !== 'published').map(r => {
                      return (
                        <tr key={r._id} className="hover:bg-slate-50/50 transition cursor-default">
                          <td className="px-6 py-5">
                            <input 
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                              checked={selectedExams.includes(r._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedExams(prev => [...prev, r._id]);
                                else setSelectedExams(prev => prev.filter(id => id !== r._id));
                              }}
                            />
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                              {r.studentId?.registrationNo || "PENDING"}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              {r.studentId?.photo ? (
                                <img src={r.studentId.photo} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm" />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 font-black text-slate-400">{r.studentId?.name?.charAt(0)}</div>
                              )}
                              <div>
                                <p className="font-bold text-slate-800 leading-none mb-1 uppercase text-xs">{r.studentId?.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{r.studentId?.mobile}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                             <span className="font-bold text-emerald-700 uppercase text-xs">{r.studentId?.course}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                             <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase rounded-full border border-blue-200 tracking-widest shadow-sm">
                               {r.examMode}
                             </span>
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex flex-col gap-0.5">
                                <p className="text-[10px] font-black text-slate-800 uppercase">Marks: <span className="text-emerald-600">{r.totalScore ?? 0}</span></p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Grade: {r.grade || '—'} | {r.session || '—'}</p>
                                {r.offlineExamCopy && (
                                  <button 
                                    onClick={() => {
                                      const win = window.open();
                                      const html = `<html><body style="margin:0"><embed src="${r.offlineExamCopy}" width="100%" height="100%" type="application/pdf"></body></html>`;
                                      win?.document.write(html);
                                    }}
                                    className="text-[9px] font-black text-blue-600 uppercase underline mt-1 text-left"
                                  >
                                    View Exam Copy
                                  </button>
                                )}
                             </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 text-slate-800">
                                {role === "atc" && (
                                  <button 
                                    onClick={() => openResultModal(r)}
                                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                                  >
                                    {r.examMode === "online" ? "Edit Exam Result" : "Enter Exam Result"}
                                  </button>
                                )}
                                {role === "admin" && (
                                  (r.offlineExamStatus === "review_pending") || 
                                  (r.examMode === "online" && r.status === "completed" && r.offlineExamStatus !== "published")
                                ) && (
                                  <>
                                    <button 
                                      onClick={() => { setSelectedExam(r); setShowReleaseModal(true); }}
                                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                                    >
                                      Approve & Issue
                                    </button>
                                    <button 
                                      onClick={() => handleApproveResult(r._id, "appeared")}
                                      className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase hover:bg-amber-200 transition"
                                    >
                                      Send Back
                                    </button>
                                  </>
                                )}
                                {role === "admin" && !(r.offlineExamStatus === "review_pending" || (r.examMode === "online" && r.status === "completed" && r.offlineExamStatus !== "published")) && (
                                   <span className="text-[9px] font-black italic text-slate-400 uppercase tracking-widest">
                                     {r.examMode === 'online' && r.status !== 'completed' ? 'Exam Not Started/Finished' : 'Waiting for ATC Action'}
                                   </span>
                                )}
                              </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {loading ? (
               <div className="flex flex-col items-center justify-center p-20 gap-4">
                 <span className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
               </div>
            ) : filtered.length === 0 ? (
               <div className="bg-white p-24 text-center rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                  <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                     <Clock className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">No History Found</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">There are no verified certificates in the registry yet.</p>
               </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-4">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                          checked={selectedExams.length > 0 && selectedExams.length === filtered.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedExams(filtered.map(r => r._id));
                            else setSelectedExams([]);
                          }}
                        />
                      </th>
                      <th className="px-6 py-4">Student Info</th>
                      {role === "admin" && <th className="px-6 py-4">Authorized Center</th>}
                      <th className="px-6 py-4 text-center">Mode</th>
                      <th className="px-6 py-4">Schedule / Center</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((exam) => (
                      <tr key={exam._id} className={selectedExams.includes(exam._id) ? 'bg-green-50/30' : ''}>
                        <td className="px-6 py-5">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                            checked={selectedExams.includes(exam._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedExams(prev => [...prev, exam._id]);
                              else setSelectedExams(prev => prev.filter(id => id !== exam._id));
                            }}
                          />
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-800 uppercase text-xs leading-none mb-1">{exam.studentId?.name || "N/A"}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{exam.studentId?.registrationNo || "No Reg"}</p>
                        </td>
                        {role === "admin" && (
                          <td className="px-6 py-5">
                            <p className="font-bold text-slate-700 uppercase text-[10px] leading-tight mb-1">{(exam.atcId as any)?.trainingPartnerName || "N/A"}</p>
                            <p className="text-[10px] font-black text-blue-600 tracking-widest uppercase">ID: {(exam.atcId as any)?.tpCode || "—"}</p>
                          </td>
                        )}
                        <td className="px-6 py-5 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                            exam.examMode === 'online' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                          }`}>
                            {exam.examMode}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {exam.status === 'completed' ? (
                            <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black text-slate-400 uppercase">Attempt Completed</span>
                               <span className="text-xs font-bold text-slate-700">{new Date(exam.submittedAt || exam.updatedAt).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {exam.examDate ? (
                                <>
                                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <Calendar size={12} className="text-slate-400" /> {new Date(exam.examDate).toLocaleDateString()}
                                  </p>

                                </>
                              ) : (
                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none italic">Waiting for schedule...</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm ${
                             exam.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                             exam.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                             exam.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                           }`}>
                             {exam.status === 'completed' ? 'COMPLETED' : exam.approvalStatus}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2 text-slate-800">
                             {role === "admin" && exam.approvalStatus === "pending" && (
                               <div className="flex gap-2">
                                 <button 
                                   onClick={() => openApproveModal(exam)}
                                   className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition"
                                 >
                                   Approve
                                 </button>
                                 <button 
                                   onClick={() => handleAction(exam._id, "rejected")}
                                   className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase shadow-lg shadow-red-100 hover:bg-red-700 transition"
                                 >
                                   Reject
                                 </button>
                                 <button 
                                   onClick={() => { if(confirm('Delete request?')) handleAction(exam._id, "delete"); }}
                                   className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                               </div>
                             )}
                            {role === "atc" && exam.approvalStatus === "approved" && exam.offlineExamStatus !== "published" && (
                               <button onClick={() => openResultModal(exam)} className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition uppercase shadow-sm">
                                 {exam.examMode === "online" ? "Edit Exam Result" : "Enter Exam Result"}
                               </button>
                            )}
                            {role === "admin" && exam.offlineExamStatus === "review_pending" && (
                               <div className="flex items-center gap-2">
                                 <button 
                                   onClick={() => { setSelectedExam(exam); setShowReleaseModal(true); }}
                                   className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition uppercase shadow-sm"
                                 >
                                   Approve & Issue
                                 </button>
                                 <button onClick={() => handleApproveResult(exam._id, "appeared")} className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition uppercase shadow-sm">
                                   Send Back
                                 </button>
                               </div>
                            )}

                             {exam.status === 'completed' && (
                               <>
                                 <div className="flex flex-col gap-1.5">
                                   {role === "admin" && (
                                     <button
                                       onClick={() => { setSelectedExam(exam); setShowReleaseModal(true); }}
                                       className="text-[10px] font-black px-2 py-1 rounded bg-slate-900 text-white hover:bg-black transition uppercase whitespace-nowrap"
                                     >
                                       Issue Docs
                                     </button>
                                   )}
                                   <div className="flex gap-1.5">
                                     <button
                                       onClick={() => window.open(`/${role}/document/marksheet/${exam._id}`, "_blank")}
                                       disabled={!exam.marksheetReleased}
                                       className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition uppercase shadow-sm ${
                                         exam.marksheetReleased 
                                           ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" 
                                           : "bg-slate-50 text-slate-300 cursor-not-allowed opacity-50"
                                       }`}
                                     >
                                       M-Sheet
                                     </button>
                                     <button
                                       onClick={() => window.open(`/${role}/document/certificate/${exam._id}`, "_blank")}
                                       disabled={!exam.certificateReleased}
                                       className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition uppercase shadow-sm ${
                                         exam.certificateReleased 
                                           ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                                           : "bg-slate-50 text-slate-300 cursor-not-allowed opacity-50"
                                       }`}
                                     >
                                       Cert
                                     </button>
                                   </div>
                                 </div>
                               </>
                             )}
                            <div className="text-[10px] font-black uppercase bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-slate-600">
                              {exam.offlineExamStatus === "review_pending" ? "Pending Admin Review" : "Result Workflow"}
                            </div>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal overlays */}
      {showApproveModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Finalize Schedule</h3>
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
                  onClick={async () => {
                    if (selectedExams.length > 0) {
                      setActionLoading("bulk");
                      try {
                        for (const id of selectedExams) {
                          await fetch("/api/admin/exams/update", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ requestId: id, status: "approved", ...approvalForm, admitCardReleased: role === "admin" }),
                          });
                        }
                        setSelectedExams([]);
                        await fetchRequests();
                        setShowApproveModal(false);
                      } catch (err) { console.error(err); }
                      finally { setActionLoading(null); }
                    } else if (selectedExam) {
                      handleAction(selectedExam._id, "approved", { ...approvalForm, admitCardReleased: role === "admin" });
                    }
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition shadow-xl"
                >
                  {(actionLoading === "bulk" || actionLoading) ? "Processing..." : (role === "admin" ? "Approve & Release" : "Save Schedule Details")}
                </button>
             </div>
          </div>
        </div>
      )}

      {showResultModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                      {selectedExam.examMode === "online" ? "Online Exam Result" : "Offline Exam Result"}
                    </h3>
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
                         disabled={role === "atc"}
                         required
                       >
                          <option value="not_appeared">Not Appeared</option>
                          <option value="appeared">Attended</option>
                          <option value="published">Result Published</option>
                       </select>
                       {role === "atc" && (
                         <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                           On submit this goes to admin for approval.
                         </p>
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className={labelCls}>Final Score {selectedExam.examMode === 'online' ? '(System Calculated)' : '*'}</label>
                       <input 
                         className={`${inputCls} ${selectedExam.examMode === 'online' ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                         placeholder={selectedExam.examMode === 'online' ? "System Score" : "e.g. 85"}
                         value={resultForm.marks}
                         onChange={e => setResultForm({...resultForm, marks: e.target.value})}
                         readOnly={selectedExam.examMode === 'online'}
                         required={selectedExam.examMode === 'offline'}
                       />
                       {selectedExam.examMode === 'online' && (
                         <p className="text-[9px] font-bold text-blue-600 uppercase">System recorded {resultForm.marks} marks.</p>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className={labelCls}>Grade *</label>
                       <input
                         className={inputCls}
                         placeholder="e.g. A+"
                         value={resultForm.grade}
                         onChange={e => setResultForm({ ...resultForm, grade: e.target.value })}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <label className={labelCls}>Academic Session *</label>
                       <input
                         className={inputCls}
                         placeholder="e.g. 2025-26"
                         value={resultForm.session}
                         onChange={e => setResultForm({ ...resultForm, session: e.target.value })}
                         required
                       />
                     </div>
                 </div>

                 {selectedExam.examMode === "offline" && (
                 <div className="space-y-2">
                    <label className={labelCls}>Upload Answer Copy (PDF/Image)</label>
                    <input 
                      type="file"
                      accept=".pdf,image/*"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:uppercase file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 transition"
                      onChange={e => setResultCopyFile(e.target.files?.[0] || null)}
                    />
                 </div>
                 )}

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowResultModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Cancel</button>
                    <button type="submit" disabled={resultSaving} className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-orange-700 transition shadow-xl shadow-orange-100">
                      {resultSaving ? "Processing..." : "Submit Result"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {requestExamStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Finalize Request</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{requestExamStudent.name} • {requestExamStudent.registrationNo}</p>
                 </div>
                 <button onClick={() => setRequestExamStudent(null)} className="p-2 bg-white rounded-full border border-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleRequestExam} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-full">
                       <label className={labelCls}>Examination Mode *</label>
                       <select 
                         className={inputCls}
                         value={examReqForm.examMode}
                         onChange={e => setExamReqForm({...examReqForm, examMode: e.target.value})}
                         required
                       >
                          <option value="online">Online Examination</option>
                          <option value="offline">Offline Examination (Center Based)</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className={labelCls}>Proposed Date *</label>
                       <input 
                         type="date"
                         className={inputCls}
                         required
                         value={examReqForm.examDate}
                         onChange={e => setExamReqForm({...examReqForm, examDate: e.target.value})}
                       />
                    </div>



                    <div className="space-y-2 col-span-full">
                       <label className={labelCls}>Select Question Set *</label>
                       <select 
                         className={inputCls}
                         value={examReqForm.setId}
                         onChange={e => setExamReqForm({...examReqForm, setId: e.target.value})}
                         required
                       >
                          <option value="">Choose Set</option>
                          {questionSets.map(set => (
                            <option key={set._id} value={set._id}>{set.title} ({set.questionCount}Q)</option>
                          ))}
                       </select>
                    </div>

                    {examReqForm.examMode === 'offline' && (
                      <div className="space-y-2 col-span-full">
                         <label className={labelCls}>Preferred Center *</label>
                         <input 
                           className={inputCls}
                           placeholder="Center Name"
                           required
                           value={examReqForm.preferredCenter}
                           onChange={e => setExamReqForm({...examReqForm, preferredCenter: e.target.value})}
                         />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-4">
                     <button type="button" onClick={() => setRequestExamStudent(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Cancel</button>
                     <button type="submit" disabled={requesting} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-black transition shadow-xl">
                       {requesting ? "Submitting..." : "Submit Request"}
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}
      {showReleaseModal && selectedExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Issue Documents</h3>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Select what to release for {selectedExam.studentId?.name}</p>
                 </div>
                 <button onClick={() => setShowReleaseModal(false)} className="p-2 bg-white rounded-full border border-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition group">
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                         checked={releaseForm.marksheet}
                         onChange={e => setReleaseForm({...releaseForm, marksheet: e.target.checked})}
                       />
                       <div>
                          <p className="text-xs font-black text-slate-800 uppercase leading-none mb-1">Generate Marksheet</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase leading-none italic">Official Statement of Marks</p>
                       </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition group">
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                         checked={releaseForm.certificate}
                         onChange={e => setReleaseForm({...releaseForm, certificate: e.target.checked})}
                       />
                       <div>
                          <p className="text-xs font-black text-slate-800 uppercase leading-none mb-1">Generate Certificate</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase leading-none italic">Official Diploma Document</p>
                       </div>
                    </label>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowReleaseModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Cancel</button>
                    <button 
                      onClick={() => handleApproveResult(selectedExam._id, "published")}
                      disabled={actionLoading === selectedExam._id || (!releaseForm.marksheet && !releaseForm.certificate)}
                      className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-black transition shadow-xl disabled:opacity-50"
                    >
                      {actionLoading === selectedExam._id ? "Processing..." : "Process Release"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
