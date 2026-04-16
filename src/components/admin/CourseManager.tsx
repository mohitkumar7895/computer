"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Trash2, Edit2, Check, X, BookOpen, Layers } from "lucide-react";

interface Course {
  _id: string;
  name: string;
  shortName: string;
  durationMonths: number;
  zone: string;
  status: "active" | "inactive";
}

export default function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [duration, setDuration] = useState("");
  const [zone, setZone] = useState("Software Zone");
  const [customZone, setCustomZone] = useState("");

  const zones = ["Software Zone", "Hardware Zone", "Vocational Zone", "Others"];

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/courses");
      const data = await res.json();
      setCourses(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  const handleAddCourse = async () => {
    if (!name || !shortName || !duration || (zone === "Others" && !customZone)) return;

    try {
      const finalZone = zone === "Others" ? customZone : zone;
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shortName, durationMonths: Number(duration), zone: finalZone }),
      });
      if (res.ok) {
        setIsAdding(false);
        setName(""); setShortName(""); setDuration(""); setZone("Software Zone"); setCustomZone("");
        void fetchCourses();
      }
    } catch { /* ignore */ }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) void fetchCourses();
    } catch { /* ignore */ }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await fetch(`/api/admin/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      void fetchCourses();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Course Management
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-sm"
        >
          {isAdding ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          {isAdding ? "Cancel" : "Add New Course"}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Course Name</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" 
                placeholder="e.g. Diploma in Computer Application"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Short Name</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" 
                placeholder="e.g. DCA"
                value={shortName} onChange={e => setShortName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Months)</label>
              <input 
                type="number"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" 
                placeholder="e.g. 12"
                value={duration} onChange={e => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zone</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  value={zone} onChange={e => setZone(e.target.value)}
                >
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              {zone === "Others" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custom Zone Name</label>
                  <input 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" 
                    placeholder="Enter zone name"
                    value={customZone} onChange={e => setCustomZone(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleAddCourse}
            className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
          >
            Create Course
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Short Name</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Zone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">Loading courses...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">No courses defined yet.</td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-700">{c.name}</td>
                    <td className="px-6 py-4 text-slate-500">{c.shortName}</td>
                    <td className="px-6 py-4 text-slate-500">{c.durationMonths} Months</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                        <Layers className="w-3 h-3" />
                        {c.zone}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleUpdateStatus(c._id, c.status)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                          c.status === "active" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" 
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {c.status === "active" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {c.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteCourse(c._id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
