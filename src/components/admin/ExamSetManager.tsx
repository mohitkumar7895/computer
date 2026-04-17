"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, PlusCircle, Trash2, CheckCircle, ShieldCheck, RefreshCw } from "lucide-react";

interface ExamSet {
  _id: string;
  title: string;
  description: string;
  questionCount: number;
  durationMinutes: number;
  totalMarks: number;
  examMode: "online" | "offline" | "both";
  isActive: boolean;
  createdAt: string;
}

interface ExamQuestion {
  _id: string;
  setId: string;
  questionText: string;
  options: string[];
  correctOption: string;
  marks: number;
  isActive: boolean;
}

interface ExamSetManagerProps {
  role: "admin" | "atc";
}

export default function ExamSetManager({ role }: ExamSetManagerProps) {
  const [sets, setSets] = useState<ExamSet[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newSet, setNewSet] = useState({ title: "", description: "", questionCount: "100", durationMinutes: "120", totalMarks: "100", examMode: "both" });
  const [questionForm, setQuestionForm] = useState({ questionText: "", options: ["", "", "", ""], correctOption: "", marks: "1" });
  const [creatingSet, setCreatingSet] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [subTab, setSubTab] = useState<"questions" | "assign">("questions");
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({ date: "", time: "10:00 AM", mode: "online" });
  const [assigning, setAssigning] = useState(false);

  const apiBase = role === "admin" ? "/api/admin" : "/api/atc";

  const selectedSet = useMemo(
    () => sets.find((set) => set._id === selectedSetId) ?? null,
    [sets, selectedSetId],
  );

  const fetchSets = async () => {
    setLoadingSets(true);
    try {
      const res = await fetch(`${apiBase}/question-sets`);
      if (!res.ok) throw new Error("Unable to load exam sets.");
      const data = await res.json();
      setSets(data.sets ?? []);
    } catch (error) {
      setStatusMessage({ type: "error", text: "Failed to load exam sets." });
    } finally {
      setLoadingSets(false);
    }
  };

  const fetchQuestions = async (setId: string) => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`${apiBase}/questions?setId=${encodeURIComponent(setId)}`);
      if (!res.ok) throw new Error("Unable to load questions.");
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchPendingStudents = async () => {
    try {
      const res = await fetch(role === "atc" ? "/api/admin/exams/all?status=pending" : "/api/admin/exams/all?status=pending");
      const data = await res.json();
      setPendingStudents(data.exams || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    void fetchSets();
  }, []);

  useEffect(() => {
    if (selectedSetId) {
      void fetchQuestions(selectedSetId);
    } else {
      setQuestions([]);
    }
  }, [selectedSetId]);

  useEffect(() => {
    if (subTab === "assign") fetchPendingStudents();
  }, [subTab]);

  const handleCreateSet = async () => {
    if (!newSet.title.trim()) return;
    setCreatingSet(true);
    try {
      const res = await fetch(`${apiBase}/question-sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSet.title.trim(),
          questionCount: Number(newSet.questionCount) || 100,
          durationMinutes: Number(newSet.durationMinutes) || 120,
          totalMarks: Number(newSet.totalMarks) || 100,
          examMode: newSet.examMode,
        }),
      });
      if (res.ok) {
        setNewSet({ title: "", description: "", questionCount: "100", durationMinutes: "120", totalMarks: "100", examMode: "both" });
        await fetchSets();
      }
    } finally {
      setCreatingSet(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!selectedSetId) return;
    setCreatingQuestion(true);
    try {
      await fetch(`${apiBase}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId: selectedSetId,
          questionText: questionForm.questionText.trim(),
          options: questionForm.options.filter((opt) => opt.trim()),
          correctOption: questionForm.correctOption.trim(),
          marks: Number(questionForm.marks) || 1,
        }),
      });
      setQuestionForm({ questionText: "", options: ["", "", "", ""], correctOption: "", marks: "1" });
      await fetchQuestions(selectedSetId);
    } finally {
      setCreatingQuestion(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`${apiBase}/questions?id=${encodeURIComponent(questionId)}`, { method: "DELETE" });
    if (selectedSetId) await fetchQuestions(selectedSetId);
  };

  const handleBulkAssign = async (studentExamIds: string[]) => {
    setAssigning(true);
    try {
      for (const id of studentExamIds) {
        await fetch("/api/admin/exams/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            examId: id, 
            approvalStatus: "approved", 
            examDate: assignForm.date, 
            examTime: assignForm.time, 
            examMode: assignForm.mode,
            setId: selectedSetId,
            admitCardReleased: true 
          })
        });
      }
      setStatusMessage({ type: "success", text: `Successfully assigned set to ${studentExamIds.length} students.` });
      fetchPendingStudents();
    } catch {
      setStatusMessage({ type: "error", text: "Some assignments failed." });
    } finally {
      setAssigning(false);
    }
  };

  const questionsForSet = useMemo(
    () => questions.filter((question) => question.setId === selectedSetId),
    [questions, selectedSetId],
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-1">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <ShieldCheck className="w-6 h-6 text-white" />
             </div>
             <div>
                Paper Designer & Exam Controller
                <span className="block text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Examination Management System</span>
             </div>
          </h2>
        </div>
        <button
          onClick={fetchSets}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> REFRESH SYSTEM
        </button>
      </div>

      {statusMessage && (
        <div className={`rounded-2xl px-6 py-4 text-sm font-bold animate-in bounce-in duration-300 ${statusMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        <div className="space-y-8">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
               <PlusCircle className="text-blue-600" /> Create Paper Set
            </h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Title</label>
                <input
                  value={newSet.title}
                  onChange={(e) => setNewSet((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-2xl border-none bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Computer Science Part-1"
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Duration</label>
                   <input
                     type="number"
                     value={newSet.durationMinutes}
                     onChange={(e) => setNewSet((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                     className="w-full rounded-2xl border-none bg-slate-50 px-5 py-4 text-sm font-bold"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Max Marks</label>
                   <input
                     type="number"
                     value={newSet.totalMarks}
                     onChange={(e) => setNewSet((prev) => ({ ...prev, totalMarks: e.target.value }))}
                     className="w-full rounded-2xl border-none bg-slate-50 px-5 py-4 text-sm font-bold"
                   />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Exam Mode</label>
                 <select 
                   value={newSet.examMode}
                   onChange={(e) => setNewSet((prev) => ({ ...prev, examMode: e.target.value }))}
                   className="w-full rounded-2xl border-none bg-slate-50 px-5 py-4 text-sm font-bold"
                 >
                   <option value="both">Online & Offline</option>
                   <option value="online">Online Only</option>
                   <option value="offline">Offline Only</option>
                 </select>
              </div>
              <button
                onClick={handleCreateSet}
                disabled={creatingSet}
                className="w-full rounded-2xl bg-slate-900 px-5 py-5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 shadow-xl active:scale-95"
              >
                {creatingSet ? "Processing..." : "Generate Set"}
              </button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
               Question Papers
               <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{sets.length} Papers</span>
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingSets ? (
                 <div className="p-10 text-center animate-pulse text-slate-300 font-bold">Initializing papers...</div>
              ) : sets.map((set) => (
                <button
                  key={set._id}
                  onClick={() => setSelectedSetId(set._id)}
                  className={`w-full group text-left p-5 rounded-3xl border-2 transition-all duration-300 ${
                    selectedSetId === set._id 
                    ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 -translate-y-1" 
                    : "bg-white border-slate-50 hover:border-slate-200"}`}
                >
                  <p className={`font-black uppercase text-sm tracking-tight ${selectedSetId === set._id ? "text-white" : "text-slate-800"}`}>
                    {set.title}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${
                      selectedSetId === set._id ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                    }`}>
                      {set.examMode}
                    </span>
                    <span className={`text-[10px] font-bold ${selectedSetId === set._id ? "text-blue-100" : "text-slate-400"}`}>
                      {set.questionCount} Questions • {set.totalMarks} Marks
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {selectedSet ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[800px]">
              <div className="flex bg-slate-50/50 p-3 gap-3 border-b border-slate-100">
                 <button 
                  onClick={() => setSubTab("questions")}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${
                    subTab === "questions" ? "bg-white text-blue-600 shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Step 1: Build Paper Set
                </button>
                <button 
                  onClick={() => setSubTab("assign")}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${
                    subTab === "assign" ? "bg-white text-emerald-600 shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Step 2: Assign & Deploy
                </button>
              </div>

              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                 {subTab === "questions" ? (
                   <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                      <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white shadow-2xl">
                         <div>
                            <h4 className="text-2xl font-black uppercase tracking-tight">{selectedSet.title}</h4>
                            <div className="flex gap-4 mt-3">
                               <span className="text-[10px] font-black uppercase bg-white/10 px-3 py-1 rounded-full border border-white/10">Mode: {selectedSet.examMode}</span>
                               <span className="text-[10px] font-black uppercase bg-white/10 px-3 py-1 rounded-full border border-white/10">{questionsForSet.length} OF {selectedSet.questionCount} QUESTION ADDED</span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time Assigned</p>
                            <p className="text-2xl font-black">{selectedSet.durationMinutes}m</p>
                         </div>
                      </div>

                      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
                         <div className="space-y-8">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Question Content</label>
                               <textarea
                                  rows={4}
                                  className="w-full px-8 py-6 bg-slate-50/50 border-2 border-slate-100 rounded-[2.5rem] font-bold text-slate-800 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none text-lg"
                                  placeholder="Enter the full question text here..."
                                  value={questionForm.questionText}
                                  onChange={(e) => setQuestionForm({...questionForm, questionText: e.target.value})}
                               />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               {questionForm.options.map((opt, i) => (
                                 <div key={i} className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">
                                       {String.fromCharCode(65+i)}
                                    </div>
                                    <input 
                                      value={opt}
                                      onChange={(e) => setQuestionForm({
                                        ...questionForm, 
                                        options: questionForm.options.map((o, idx) => idx === i ? e.target.value : o)
                                      })}
                                      placeholder={`Enter option ${i+1}`}
                                      className="w-full pl-16 pr-6 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-200"
                                    />
                                 </div>
                               ))}
                            </div>

                            <div className="flex gap-6 items-end">
                               <div className="flex-1 space-y-3">
                                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 ml-1">Correct Answer Verification</label>
                                  <input 
                                    className="w-full px-8 py-5 bg-emerald-50 border-2 border-emerald-100 rounded-2xl font-black text-emerald-700 outline-none"
                                    placeholder="Paste the exact correct option text here"
                                    value={questionForm.correctOption}
                                    onChange={(e) => setQuestionForm({...questionForm, correctOption: e.target.value})}
                                  />
                               </div>
                               <button 
                                 onClick={handleQuestionSubmit}
                                 disabled={creatingQuestion}
                                 className="h-[66px] px-12 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all shadow-xl active:scale-95"
                               >
                                 {creatingQuestion ? "..." : "ADD TO PAPER"}
                               </button>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Paper Preview</h5>
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-6 max-h-[700px] overflow-y-auto custom-scrollbar space-y-4">
                               {questionsForSet.length === 0 ? (
                                  <div className="py-20 text-center text-slate-300 font-bold italic px-10">No questions added to this set yet.</div>
                               ) : (
                                  questionsForSet.map((q, i) => (
                                    <div key={q._id} className="p-6 bg-white rounded-2xl border border-slate-100 relative group hover:shadow-md transition-shadow">
                                       <p className="font-bold text-slate-800 leading-tight mb-4 pr-6">
                                          <span className="text-blue-500 mr-2">Q{i+1}.</span> {q.questionText}
                                       </p>
                                       <div className="grid grid-cols-1 gap-2">
                                          {q.options.map((o, j) => (
                                            <div key={j} className={`text-[10px] px-3 py-2 rounded-lg border ${o === q.correctOption ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-black' : 'bg-slate-50 border-slate-50 text-slate-500'}`}>
                                              {String.fromCharCode(65+j)}. {o}
                                            </div>
                                          ))}
                                       </div>
                                       <button 
                                          onClick={() => deleteQuestion(q._id)}
                                          className="absolute top-4 right-4 text-slate-200 hover:text-red-500 transition-colors"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                  ))
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                      <div className="bg-emerald-50/30 border-2 border-emerald-100/50 p-10 rounded-[3rem] flex flex-wrap items-end gap-8">
                         <div className="flex-1 min-w-[300px] space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-2">Final Assignment Mode</label>
                            <select 
                               className="w-full px-8 py-5 bg-white rounded-2xl border-none font-bold text-slate-800 shadow-sm outline-none"
                               value={assignForm.mode}
                               onChange={(e) => setAssignForm({...assignForm, mode: e.target.value})}
                            >
                               <option value="online">Cloud-Based Online Exam</option>
                               <option value="offline">Center-Based Offline Paper</option>
                            </select>
                         </div>
                         <div className="flex-1 min-w-[300px] space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-2">Execution Date</label>
                            <input 
                               type="date" 
                               className="w-full px-8 py-5 bg-white rounded-2xl border-none font-bold text-slate-800 shadow-sm outline-none"
                               value={assignForm.date}
                               onChange={(e) => setAssignForm({...assignForm, date: e.target.value})}
                            />
                         </div>
                         <button 
                           onClick={() => handleBulkAssign(pendingStudents.map(p => p._id))}
                           disabled={assigning || pendingStudents.length === 0}
                           className="px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-2xl active:scale-95"
                         >
                           {assigning ? "DEPLOYING..." : `DEPLOY TO ${pendingStudents.length} STUDENTS`}
                         </button>
                      </div>

                      <div className="space-y-6">
                         <div className="flex items-center justify-between px-2">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Queue: Students Awaiting Assignment</h5>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold">{pendingStudents.length} IN QUEUE</span>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingStudents.length === 0 ? (
                               <div className="md:col-span-2 py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                                  <RefreshCw className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                  <p className="text-slate-300 font-black uppercase tracking-widest text-sm italic">Clear Queue: No pending exam requests</p>
                               </div>
                            ) : (
                               pendingStudents.map(s => (
                                 <div key={s._id} className="group p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-blue-100 hover:bg-white transition-all">
                                    <div className="flex justify-between items-start">
                                       <div>
                                          <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{s.studentId?.name}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">REG # {s.studentId?.registrationNo}</p>
                                       </div>
                                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                         s.examMode === 'online' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                       }`}>
                                          {s.examMode} REQUESTED
                                       </span>
                                    </div>
                                    <div className="mt-6 flex items-center gap-2">
                                       <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                                          <div className="h-full w-1/3 bg-blue-500 rounded-full animate-progress" />
                                       </div>
                                       <span className="text-[8px] font-black text-slate-300 uppercase">Awaiting Set</span>
                                    </div>
                                 </div>
                               ))
                            )}
                         </div>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-40 bg-white rounded-[4rem] border border-dashed border-slate-100 h-full min-h-[800px]">
               <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-10">
                  <BookOpen className="w-10 h-10 text-slate-200" />
               </div>
               <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-base mb-2">Paper Designer Workspace</p>
               <p className="text-slate-400 font-bold text-sm">Select a question paper from the left panel to begin construction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
