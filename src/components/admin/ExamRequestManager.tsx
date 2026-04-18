"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle, XCircle, Clock, Search, 
  Download, Calendar, MapPin, Monitor, Eye,
  RefreshCw, AlertCircle, FileText, X
} from "lucide-react";

interface ExamRequestManagerProps {
  atcId?: string;
}

export default function ExamRequestManager({ atcId }: ExamRequestManagerProps) {
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
      const res = await fetch("/api/admin/exams/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, approvalStatus: status, ...extraData })
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

  const openApproveModal = (exam: any) => {
    setSelectedExam(exam);
    setApprovalForm({
      examDate: exam.offlineDetails?.preferredDate || "",
      examTime: exam.offlineDetails?.preferredTimeSlot || "10:00 AM",
      setId: exam.setId || "",
      examMode: exam.examMode // Pre-fill with student's choice
    } as any);
    setShowApproveModal(true);
  };

  const filtered = requests.filter(r => {
    const matchesMode = filterMode === "all" || r.examMode === filterMode;
    const matchesStatus = filterStatus === "all" || r.approvalStatus === filterStatus;
    const matchesSearch = !searchTerm || 
      r.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId?.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMode && matchesStatus && matchesSearch;
  });

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
                      {exam.examMode === 'offline' ? (
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
                         exam.approvalStatus === 'approved' ? 'bg-green-50 text-green-700' : 
                         exam.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                       }`}>
                         {exam.status === 'completed' ? <CheckCircle size={12} /> : 
                          exam.approvalStatus === 'pending' ? <Clock size={12} /> : 
                          exam.approvalStatus === 'approved' ? <CheckCircle size={12} /> : 
                          <XCircle size={12} />}
                         {exam.status === 'completed' ? 'COMPLETED' : exam.approvalStatus}
                       </span>
                       {exam.status === 'completed' && (
                         <div className="mt-2 font-black text-slate-800 text-[10px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            RESULT: {exam.totalScore || 0}/{exam.maxScore || 100}
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      <div className="flex items-center gap-2">
                        {exam.approvalStatus === 'pending' && (
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
                        )}
                        {exam.approvalStatus === 'approved' && !exam.admitCardReleased && (
                           <button 
                            onClick={() => openApproveModal(exam)}
                            disabled={actionLoading === exam._id}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition shadow-sm"
                          >
                            Set Date & Release
                          </button>
                        )}
                         {exam.approvalStatus === 'approved' && exam.admitCardReleased && (
                            <span className="text-[10px] font-black text-green-600 uppercase">Released</span>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Final Exam Mode</label>
                    <select 
                        className="w-full px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                        value={(approvalForm as any).examMode}
                        onChange={(e) => setApprovalForm({...approvalForm, examMode: e.target.value} as any)}
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Final Exam Date</label>
                    <input 
                        type="date"
                        className="w-full px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                        value={approvalForm.examDate}
                        onChange={(e) => setApprovalForm({...approvalForm, examDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Slot</label>
                   <input 
                      type="text"
                      placeholder="e.g. 11:00 AM - 01:00 PM"
                      className="w-full px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      value={approvalForm.examTime}
                      onChange={(e) => setApprovalForm({...approvalForm, examTime: e.target.value})}
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Question Set</label>
                   <select 
                      className="w-full px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
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
                  onClick={() => handleAction(selectedExam._id, "approved", { ...approvalForm, admitCardReleased: true })}
                  className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl"
                >
                  Approve & Release Admit Card
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
