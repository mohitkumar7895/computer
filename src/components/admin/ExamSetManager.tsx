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

export default function ExamSetManager() {
  const [sets, setSets] = useState<ExamSet[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newSet, setNewSet] = useState({ title: "", description: "", questionCount: "100", durationMinutes: "120", totalMarks: "100" });
  const [editSet, setEditSet] = useState({ title: "", description: "", questionCount: "", durationMinutes: "", totalMarks: "" });
  const [questionForm, setQuestionForm] = useState({ questionText: "", options: ["", "", "", ""], correctOption: "", marks: "1" });
  const [creatingSet, setCreatingSet] = useState(false);
  const [updatingSet, setUpdatingSet] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  const selectedSet = useMemo(
    () => sets.find((set) => set._id === selectedSetId) ?? null,
    [sets, selectedSetId],
  );
  const editSectionRef = useRef<HTMLDivElement | null>(null);

  const fetchSets = async () => {
    setLoadingSets(true);
    try {
      const res = await fetch("/api/admin/question-sets");
      if (!res.ok) throw new Error("Unable to load exam sets.");
      const data = await res.json();
      setSets(data.sets ?? []);
      if (!selectedSetId && data.sets?.length > 0) {
        setSelectedSetId(data.sets[0]._id);
      }
    } catch (error) {
      setStatusMessage({ type: "error", text: "Failed to load exam sets." });
    } finally {
      setLoadingSets(false);
    }
  };

  const fetchQuestions = async (setId: string) => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/admin/questions?setId=${encodeURIComponent(setId)}`);
      if (!res.ok) throw new Error("Unable to load questions.");
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch {
      setQuestions([]);
      setStatusMessage({ type: "error", text: "Failed to load questions for the selected set." });
    } finally {
      setLoadingQuestions(false);
    }
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
    if (selectedSet) {
      setEditSet({
        title: selectedSet.title,
        description: selectedSet.description ?? "",
        questionCount: String(selectedSet.questionCount),
        durationMinutes: String(selectedSet.durationMinutes),
        totalMarks: String(selectedSet.totalMarks),
      });
    }
  }, [selectedSet]);

  useEffect(() => {
    if (selectedSet && editSectionRef.current) {
      editSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedSet]);

  const clearStatus = () => setTimeout(() => setStatusMessage(null), 5000);

  const handleCreateSet = async () => {
    if (!newSet.title.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a title for the exam set." });
      clearStatus();
      return;
    }

    setCreatingSet(true);
    try {
      const res = await fetch("/api/admin/question-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSet.title.trim(),
          description: newSet.description.trim(),
          questionCount: Number(newSet.questionCount) || 100,
          durationMinutes: Number(newSet.durationMinutes) || 120,
          totalMarks: Number(newSet.totalMarks) || 100,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.message || "Could not create exam set." });
        clearStatus();
        return;
      }
      setNewSet({ title: "", description: "", questionCount: "100", durationMinutes: "120", totalMarks: "100" });
      await fetchSets();
      setStatusMessage({ type: "success", text: "Exam set created successfully." });
      clearStatus();
    } catch {
      setStatusMessage({ type: "error", text: "Unable to create exam set." });
      clearStatus();
    } finally {
      setCreatingSet(false);
    }
  };

  const handleToggleSetActive = async (setId: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/question-sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: setId, isActive: !isActive }),
      });
      if (res.ok) {
        await fetchSets();
        setStatusMessage({ type: "success", text: `Exam set ${isActive ? "disabled" : "enabled"}.` });
        clearStatus();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Unable to update exam set status." });
      clearStatus();
    }
  };

  const handleUpdateSet = async () => {
    if (!selectedSet) return;
    if (!editSet.title.trim()) {
      setStatusMessage({ type: "error", text: "Set title cannot be empty." });
      clearStatus();
      return;
    }

    setUpdatingSet(true);
    try {
      const res = await fetch("/api/admin/question-sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSet._id,
          title: editSet.title.trim(),
          description: editSet.description.trim(),
          questionCount: Number(editSet.questionCount) || 0,
          durationMinutes: Number(editSet.durationMinutes) || 0,
          totalMarks: Number(editSet.totalMarks) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.message || "Unable to save exam set changes." });
        clearStatus();
        return;
      }
      await fetchSets();
      setStatusMessage({ type: "success", text: "Exam set updated successfully." });
      clearStatus();
    } catch {
      setStatusMessage({ type: "error", text: "Unable to update exam set." });
      clearStatus();
    } finally {
      setUpdatingSet(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!selectedSetId) {
      setStatusMessage({ type: "error", text: "Select an exam set before adding questions." });
      clearStatus();
      return;
    }
    if (!questionForm.questionText.trim() || !questionForm.options.some((opt) => opt.trim())) {
      setStatusMessage({ type: "error", text: "Question text and options are required." });
      clearStatus();
      return;
    }
    if (!questionForm.correctOption.trim()) {
      setStatusMessage({ type: "error", text: "Please select the correct option." });
      clearStatus();
      return;
    }

    setCreatingQuestion(true);
    try {
      const res = await fetch("/api/admin/questions", {
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
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.message || "Could not add question." });
        clearStatus();
        return;
      }
      setQuestionForm({ questionText: "", options: ["", "", "", ""], correctOption: "", marks: "1" });
      await fetchQuestions(selectedSetId);
      setStatusMessage({ type: "success", text: "Question saved." });
      clearStatus();
    } catch {
      setStatusMessage({ type: "error", text: "Unable to save question." });
      clearStatus();
    } finally {
      setCreatingQuestion(false);
    }
  };

  const toggleQuestionActive = async (questionId: string, currentState: boolean) => {
    try {
      await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: questionId, isActive: !currentState }),
      });
      if (selectedSetId) await fetchQuestions(selectedSetId);
    } catch {
      setStatusMessage({ type: "error", text: "Unable to update question." });
      clearStatus();
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question permanently?")) return;
    try {
      await fetch(`/api/admin/questions?id=${encodeURIComponent(questionId)}`, { method: "DELETE" });
      if (selectedSetId) await fetchQuestions(selectedSetId);
      setStatusMessage({ type: "success", text: "Question removed." });
      clearStatus();
    } catch {
      setStatusMessage({ type: "error", text: "Unable to delete question." });
      clearStatus();
    }
  };

  const questionsForSet = useMemo(
    () => questions.filter((question) => question.setId === selectedSetId),
    [questions, selectedSetId],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Exam Set Manager
          </h2>
          <p className="text-sm text-slate-500">Create question sets, manage questions, and keep active sets ready for center assignment.</p>
        </div>
        <button
          onClick={fetchSets}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh sets
        </button>
      </div>

      {statusMessage && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${statusMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Create New Exam Set</h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Title</label>
                <input
                  value={newSet.title}
                  onChange={(e) => setNewSet((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  placeholder="Example: Basic IT Proficiency"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Description</label>
                <textarea
                  rows={3}
                  value={newSet.description}
                  onChange={(e) => setNewSet((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  placeholder="Short description for center exam assignment"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Questions", field: "questionCount", value: newSet.questionCount },
                  { label: "Duration (mins)", field: "durationMinutes", value: newSet.durationMinutes },
                  { label: "Max Marks", field: "totalMarks", value: newSet.totalMarks },
                ].map(({ label, field, value }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</label>
                    <input
                      type="number"
                      min={1}
                      value={value}
                      onChange={(e) => setNewSet((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreateSet}
                disabled={creatingSet}
                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creatingSet ? "Creating set..." : "Create Exam Set"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-800">Available Exam Sets</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                {sets.length} sets
              </span>
            </div>

            <div className="mt-5 divide-y divide-slate-200">
              {loadingSets ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400">Loading exam sets…</div>
              ) : sets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400">No exam sets created yet.</div>
              ) : (
                sets.map((set) => (
                  <div
                    key={set._id}
                    className={`w-full rounded-3xl transition ${selectedSetId === set._id ? "bg-blue-50 border border-blue-200 shadow-sm" : "border border-slate-200 hover:border-slate-300"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSetId(set._id)}
                      className="w-full text-left rounded-t-3xl px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">{set.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{set.questionCount} questions · {set.durationMinutes} mins · {set.totalMarks} marks</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${set.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {set.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 rounded-b-3xl">
                      <span className="text-xs text-slate-500">Click to edit this set</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSetId(set._id)}
                        className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        Edit set
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div ref={editSectionRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedSet ? selectedSet.title : "Select an exam set"}</h3>
                <p className="text-sm text-slate-500">Manage questions for the active set and review set details here.</p>
              </div>
              {selectedSet && (
                <button
                  type="button"
                  onClick={() => handleToggleSetActive(selectedSet._id, selectedSet.isActive)}
                  className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase transition ${selectedSet.isActive ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}
                >
                  {selectedSet.isActive ? "Disable set" : "Enable set"}
                </button>
              )}
            </div>

            {selectedSet ? (
              <div className="mt-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Description</p>
                    <p className="mt-2 text-sm text-slate-700">{selectedSet.description || "No description available."}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p>
                    <p className="mt-2 text-sm text-slate-700">{new Date(selectedSet.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Edit selected exam set</p>
                      <p className="text-xs text-slate-500">Update title, description, question count, duration, or marks.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Editing mode</span>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Title</label>
                      <input
                        value={editSet.title}
                        onChange={(e) => setEditSet((prev) => ({ ...prev, title: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Description</label>
                      <textarea
                        rows={3}
                        value={editSet.description}
                        onChange={(e) => setEditSet((prev) => ({ ...prev, description: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Questions</label>
                        <input
                          type="number"
                          min={1}
                          value={editSet.questionCount}
                          onChange={(e) => setEditSet((prev) => ({ ...prev, questionCount: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Duration (mins)</label>
                        <input
                          type="number"
                          min={1}
                          value={editSet.durationMinutes}
                          onChange={(e) => setEditSet((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Max Marks</label>
                        <input
                          type="number"
                          min={1}
                          value={editSet.totalMarks}
                          onChange={(e) => setEditSet((prev) => ({ ...prev, totalMarks: e.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleUpdateSet}
                      disabled={updatingSet}
                      className="mt-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingSet ? "Saving changes..." : "Save exam set changes"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Choose an exam set from the left panel to add questions.</div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Question Bank</h3>
                <p className="text-sm text-slate-500">Add new questions for the selected set and manage the existing items.</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <CheckCircle className="w-3.5 h-3.5" /> {questionsForSet.length} questions
              </span>
            </div>

            {selectedSet ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Question</label>
                    <textarea
                      rows={3}
                      value={questionForm.questionText}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, questionText: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                      placeholder="Type the full question text here"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {questionForm.options.map((option, index) => (
                      <div key={index}>
                        <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Option {index + 1}</label>
                        <input
                          value={option}
                          onChange={(e) => setQuestionForm((prev) => ({
                            ...prev,
                            options: prev.options.map((opt, optIndex) => (optIndex === index ? e.target.value : opt)),
                          }))}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Correct Option</label>
                      <input
                        value={questionForm.correctOption}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, correctOption: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        placeholder="Exact option text"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Marks</label>
                      <input
                        type="number"
                        min={1}
                        value={questionForm.marks}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, marks: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleQuestionSubmit}
                        disabled={creatingQuestion}
                        className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {creatingQuestion ? "Saving…" : "Add Question"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Tip</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">Type the full answer option text exactly as it appears in the choices, then enter that exact value in the correct option field.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Select a set to start adding questions.</div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Questions in Set</h3>
            <div className="mt-4 space-y-4">
              {loadingQuestions ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400">Loading questions…</div>
              ) : !selectedSet ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400">Select an exam set to see questions.</div>
              ) : questionsForSet.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400">No questions added yet.</div>
              ) : (
                questionsForSet.map((question) => (
                  <div key={question._id} className="rounded-3xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{question.questionText}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {question.options.map((option) => (
                            <div key={option} className={`rounded-2xl px-3 py-2 text-sm ${option === question.correctOption ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-slate-50 text-slate-700 border border-slate-200"}`}>
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{question.marks} marks</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleQuestionActive(question._id, question.isActive)}
                            className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${question.isActive ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {question.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(question._id)}
                            className="rounded-2xl px-3 py-2 bg-red-100 text-red-600 text-xs font-semibold transition hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
