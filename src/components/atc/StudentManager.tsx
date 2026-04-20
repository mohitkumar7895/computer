"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Users, PlusCircle, CheckCircle, FileText, User, BookOpen, MapPin, CreditCard, Heart, RefreshCw, ShieldCheck } from "lucide-react";

interface Student {
  _id: string;
  registrationNo: string;
  name: string;
  fatherName: string;
  mobile: string;
  course: string;
  status: string;
  createdAt: string;
  admissionDate: string;
  photo?: string;
  examMode?: string;
  offlineExamStatus?: "not_appeared" | "appeared" | "published";
  offlineExamMarks?: string;
  offlineExamResult?: "Pass" | "Fail" | "Waiting";
  offlineExamCopy?: string;
}

interface Course {
  _id: string;
  name: string;
  shortName: string;
}

export default function StudentManager() {
  const [tab, setTab] = useState<"list" | "add">("list");
  const [students, setStudents] = useState<Student[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sameAddress, setSameAddress] = useState(false);
  const [currentAddr, setCurrentAddr] = useState("");
  const [disability, setDisability] = useState("No");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [requestExamStudent, setRequestExamStudent] = useState<Student | null>(null);
  const [examReqForm, setExamReqForm] = useState({ examMode: "online", preferredDate: "", preferredCenter: "" });
  const [editForm, setEditForm] = useState({ name: "", fatherName: "", mobile: "", course: "", courseType: "Regular", admissionDate: "" });
  const [updating, setUpdating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showResultModal, setShowResultModal] = useState<Student | null>(null);
  const [resultForm, setResultForm] = useState({ 
    marks: "", 
    grade: "A", 
    session: "2024-25",
    examStatus: "appeared" as const
  });
  const [resultSubmitting, setResultSubmitting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/atc/students");
      if(res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch {
      console.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/atc/courses");
      if (res.ok) {
        const data = await res.json();
        setAvailableCourses(data);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (tab === "list") void fetchStudents();
    if (tab === "add") void fetchCourses();
  }, [tab]);

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      if (sameAddress) {
        form.set("permanentAddress", currentAddr);
      }
      
      const res = await fetch("/api/atc/students", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add student");
      setMsg({ type: "success", text: "Student admitted successfully! Reg. No: " + data.student.registrationNo });
      (e.target as HTMLFormElement).reset();
      setSameAddress(false);
      setCurrentAddr("");
      setDisability("No");
      setTimeout(() => setTab("list"), 2000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/atc/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent._id, ...editForm }),
      });
      if (res.ok) {
        setMsg({ type: "success", text: "Student updated successfully" });
        setSelectedStudent(null);
        void fetchStudents();
      }
    } catch {
      setMsg({ type: "error", text: "Update failed" });
    } finally {
      setUpdating(false);
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
            preferredDate: examReqForm.preferredDate,
            preferredCenter: examReqForm.preferredCenter
          } : undefined
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Exam request submitted successfully" });
        setRequestExamStudent(null);
      } else {
        setMsg({ type: "error", text: data.message || "Request failed" });
      }
    } catch {
      setMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setRequesting(false);
    }
  };

  const handleResultSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!showResultModal) return;
    setResultSubmitting(true);
    try {
      const res = await fetch("/api/atc/exams/offline-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: showResultModal._id,
          offlineExamStatus: "review_pending",
          totalScore: resultForm.marks,
          offlineExamResult: parseInt(resultForm.marks) >= 33 ? "Pass" : "Fail",
          grade: resultForm.grade,
          session: resultForm.session
        })
      });
      if (res.ok) {
        setMsg({ type: "success", text: "Result submitted for Admin review" });
        setShowResultModal(null);
        void fetchStudents();
      } else {
        const data = await res.json();
        setMsg({ type: "error", text: data.message || "Submission failed" });
      }
    } catch {
      setMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setResultSubmitting(false);
    }
  };


  const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition placeholder:text-slate-400";
  const labelCls = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";
  const sectionCls = "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5";

  return (
    <div className="bg-slate-50/30 rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-white">
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-3 text-sm font-bold transition-all relative ${tab === "list" ? "text-green-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> All Students</span>
          {tab === "list" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setTab("add")}
          className={`px-4 py-3 text-sm font-bold transition-all relative ${tab === "add" ? "text-green-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <span className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> New Admission</span>
          {tab === "add" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
        </button>
      </div>

      <div className="p-6">
        {msg && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-bold border animate-in fade-in slide-in-from-top-2 ${msg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {msg.text}
          </div>
        )}

        {tab === "list" && (
          <div className="animate-in fade-in duration-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <span className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading student records...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Users className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-800 font-bold mb-1">No Admission Records</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Start by admitting students to your center from the &apos;New Admission&apos; tab.</p>
                <button onClick={() => setTab("add")} className="px-6 py-3 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-100">Open Admission Form</button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Reg No / ID</th>
                      <th className="px-6 py-4">Student Identity</th>
                      <th className="px-6 py-4">Opted Course</th>
                      <th className="px-6 py-4">Exam Mode</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/50 transition cursor-default group">
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 group-hover:bg-white transition-colors">
                            {s.registrationNo || "PENDING"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {s.photo ? (
                              <img src={s.photo} alt={s.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200"><User className="w-4 h-4 text-slate-400" /></div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 leading-none mb-1">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">S/o: {s.fatherName} • {s.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-emerald-700">{s.course}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{s.admissionDate ? new Date(s.admissionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                        </td>
                         <td className="px-6 py-5">
                           <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit shadow-sm ${
                                s.examMode === 'online' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                              }`}>
                                 {s.examMode || 'online'}
                              </span>
                              {s.examMode === 'offline' && s.offlineExamStatus !== 'not_appeared' && (
                                <span className={`text-[8px] font-black uppercase text-center w-fit px-1.5 py-0.5 rounded ${
                                  s.offlineExamStatus === 'published' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                                }`}>
                                   {s.offlineExamStatus}
                                </span>
                              )}
                           </div>
                         </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                             s.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : 
                             s.status === "rejected" ? "bg-red-50 text-red-700 border border-red-200" :
                             "bg-amber-50 text-amber-600 border border-amber-200"
                           }`}>
                             {s.status === "approved" ? "Approved" : s.status === "rejected" ? "Rejected" : "Pending Admission"}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end gap-2">
                             {!s.registrationNo ? (
                                <button 
                                onClick={() => {
                                  setSelectedStudent(s);
                                  setEditForm({
                                    name: s.name,
                                    fatherName: s.fatherName,
                                    mobile: s.mobile,
                                    course: s.course,
                                    courseType: (s as any).courseType || "Regular",
                                    admissionDate: s.admissionDate || ""
                                  });
                                }}
                                className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-2"
                              >
                                 Edit Admission
                              </button>
                             ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-black uppercase text-slate-300 italic">Registered</span>
                                  <button 
                                    onClick={() => {
                                      if (!s.offlineExamStatus || s.offlineExamStatus === 'not_appeared') {
                                        // Allow direct entry or request
                                        setShowResultModal(s);
                                        setResultForm({ 
                                          marks: "", 
                                          status: "appeared", 
                                          resultStatus: "Waiting",
                                          grade: "A",
                                          session: s.session || "2024-25"
                                        });
                                      } else {
                                        setShowResultModal(s);
                                        setResultForm({ 
                                          marks: s.offlineExamMarks || "",
                                          status: s.offlineExamStatus as any,
                                          resultStatus: (s as any).offlineExamResult || "Waiting",
                                          grade: (s as any).grade || "A",
                                          session: s.session || "2024-25"
                                        });
                                      }
                                    }}
                                    className="text-[10px] font-black uppercase underline underline-offset-4 decoration-2 text-emerald-600 hover:text-emerald-800"
                                  >
                                    {(s.offlineExamStatus === 'review_pending' || s.offlineExamStatus === 'published') ? 'View/Edit Result' : 'Enter Result'}
                                  </button>
                                  {(s.offlineExamStatus === 'not_appeared' || !s.offlineExamStatus) && (
                                    <button 
                                      onClick={() => {
                                        setRequesting(false);
                                        setRequestExamStudent(s);
                                        setExamReqForm({ ...examReqForm, examMode: s.examMode || 'online' });
                                      }}
                                      className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800"
                                    >
                                      Request Schedule
                                    </button>
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
            )}
          </div>
        )}

        {tab === "add" && (
          <form onSubmit={handleAddSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Personal Information */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-blue-500 pl-3">
                <User className="w-4 h-4 text-blue-500" /> Student Identity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className={labelCls}>Full Name (as per ID) *</label>
                  <input required name="name" className={inputCls} placeholder="Student's Legal Name" />
                </div>
                <div>
                  <label className={labelCls}>Father's Name *</label>
                  <input required name="fatherName" className={inputCls} placeholder="Father's Name" />
                </div>
                <div>
                  <label className={labelCls}>Mother's Name *</label>
                  <input required name="motherName" className={inputCls} placeholder="Mother's Name" />
                </div>
                <div><label className={labelCls}>Date of Birth *</label><input required type="date" name="dob" className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Gender *</label>
                  <select required name="gender" className={inputCls}>
                    <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div><label className={labelCls}>Category *</label>
                  <select required name="category" className={inputCls}>
                    <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-2">
                <div><label className={labelCls}>Nationality</label><input name="nationality" defaultValue="Indian" className={inputCls} /></div>
                <div><label className={labelCls}>Religion</label>
                  <select name="religion" className={inputCls}>
                    <option value="">Select</option><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Jain</option><option>Buddhism</option><option>Other</option>
                  </select>
                </div>
                <div><label className={labelCls}>Marital Status</label>
                  <select name="maritalStatus" className={inputCls}>
                    <option value="">Select</option>
                    <option>Married</option>
                    <option>Unmarried</option>
                    <option>Others</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Physically Disability *</label>
                  <select name="disability" className={inputCls} value={disability} onChange={e => setDisability(e.target.value)}>
                    <option>No</option><option>Yes</option>
                  </select>
                </div>
                {disability === "Yes" && (
                  <div className="md:col-span-4 animate-in zoom-in-95 duration-200">
                    <label className={labelCls}>Disability Details *</label>
                    <input required={disability === "Yes"} name="disabilityDetails" className={inputCls} placeholder="Please describe provide details" />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Admission Details */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-green-500 pl-3">
                <CreditCard className="w-4 h-4 text-green-500" /> Admission Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className={labelCls}>Session *</label>
                  <input required name="session" className={inputCls} placeholder="e.g. 2024-25" />
                </div>
                <div>
                  <label className={labelCls}>Course *</label>
                  <select required name="course" className={inputCls} disabled={availableCourses.length === 0} onChange={() => void fetchCourses()}>
                    <option value="">{availableCourses.length > 0 ? "Select Course" : "Select Course"}</option>
                    {availableCourses.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className={labelCls}>Preference Mode *</label>
                   <select required name="courseType" className={inputCls}>
                      <option value="Regular">Regular</option>
                      <option value="ODL">ODL (Open Distance Learning)</option>
                      <option value="OL">OL (Online Learning)</option>
                   </select>
                </div>
                <div>
                  <label className={labelCls}>Exam Mode *</label>
                  <select required name="examMode" className={inputCls}>
                    <option value="online">Online Mode</option>
                    <option value="offline">Offline Mode (Center Based)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Admission Fees *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input required name="admissionFees" className={inputCls + " pl-8 text-green-700 font-bold"} placeholder="Amount" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Admission Date *</label>
                  <input required type="date" name="admissionDate" className={inputCls} defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
            </div>

            {/* 3. Contact information */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-amber-500 pl-3">
                <MapPin className="w-4 h-4 text-amber-500" /> Contact & Residence
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelCls}>Student Mobile *</label><input required name="mobile" className={inputCls} placeholder="10-digit primary number" maxLength={10} /></div>
                <div><label className={labelCls}>Parents Mobile</label><input name="parentsMobile" className={inputCls} placeholder="Emergency contact" maxLength={10} /></div>
                <div className="md:col-span-2"><label className={labelCls}>Email Address</label><input type="email" name="email" className={inputCls} placeholder="Student's email ID" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                <div>
                  <label className={labelCls}>Current Address *</label>
                  <textarea 
                    required 
                    name="currentAddress" 
                    rows={3} 
                    className={inputCls} 
                    placeholder="Complete block, post, city address" 
                    value={currentAddr}
                    onChange={(e) => setCurrentAddr(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls}>Permanent Address *</label>
                    <label className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-green-100 transition border border-green-100">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3 rounded border-green-300 text-green-600 focus:ring-green-500"
                        checked={sameAddress}
                        onChange={(e) => setSameAddress(e.target.checked)}
                      />
                      SAME AS CURRENT
                    </label>
                  </div>
                  <textarea 
                    required={!sameAddress}
                    disabled={sameAddress}
                    name="permanentAddress" 
                    rows={3} 
                    className={`${inputCls} ${sameAddress ? "bg-slate-50/50 text-slate-400 border-dashed" : ""}`}
                    placeholder={sameAddress ? "Mailing address is same as current" : "Official residence address"}
                    value={sameAddress ? currentAddr : undefined}
                  />
                </div>
              </div>
            </div>

            {/* 4. Credentials & Docs */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-purple-500 pl-3">
                <FileText className="w-4 h-4 text-purple-500" /> Credentials & Documentation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div><label className={labelCls}>Highest Qualification *</label><input required name="highestQualification" className={inputCls} placeholder="e.g. SSC, HSC, Graduate" /></div>
                <div><label className={labelCls}>Aadhar Number</label><input name="aadharNo" className={inputCls} placeholder="12-digit UID" maxLength={12} /></div>
                <div><label className={labelCls}>Referred By</label><input name="referredBy" className={inputCls} placeholder="Staff or Partner name" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                 {[
                  { label: "Student Photo (jpg) *", name: "photo", color: "bg-emerald-50 text-emerald-700" },
                  { label: "Student Signature (jpg) *", name: "studentSignature", color: "bg-purple-50 text-purple-700" },
                  { label: "Qualification Proof (pdf) *", name: "qualificationDoc", color: "bg-blue-50 text-blue-700" },
                  { label: "Aadhar Card PDF *", name: "aadharDoc", color: "bg-orange-50 text-orange-700" },
                  { label: "Other Documents (pdf)", name: "otherDocs", color: "bg-slate-100 text-slate-700" },
                 ].map(doc => (
                  <div key={doc.name} className="group relative p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter group-hover:text-blue-500">{doc.label}</label>
                    <input type="file" name={doc.name} accept="image/*,application/pdf" 
                      className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:cursor-pointer transition-all"
                    />
                  </div>
                 ))}
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button disabled={loading} type="submit" className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-green-600 text-white rounded-2xl text-sm font-black hover:bg-green-700 transition shadow-xl shadow-green-100 active:scale-95 disabled:opacity-75">
                {loading ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"/> : <CheckCircle className="w-5 h-5" />}
                {loading ? "PROCESSING..." : "PROCESS ADMISSION"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Edit Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                 </div>
                 Edit Student Record
              </h3>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className={labelCls}>Student Name</label>
                    <input 
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className={inputCls}
                      required
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className={labelCls}>Father Name</label>
                    <input 
                      value={editForm.fatherName}
                      onChange={e => setEditForm({...editForm, fatherName: e.target.value})}
                      className={inputCls}
                      required
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className={labelCls}>Mobile No</label>
                       <input 
                         value={editForm.mobile}
                         onChange={e => setEditForm({...editForm, mobile: e.target.value})}
                         className={inputCls}
                         required
                         maxLength={10}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className={labelCls}>Preference Mode</label>
                       <select 
                         value={editForm.courseType}
                         onChange={e => setEditForm({...editForm, courseType: e.target.value})}
                         className={inputCls}
                         required
                       >
                          <option value="Regular">Regular</option>
                          <option value="ODL">ODL</option>
                          <option value="OL">OL</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className={labelCls}>Course</label>
                    <select 
                      value={editForm.course}
                      onChange={e => setEditForm({...editForm, course: e.target.value})}
                      className={inputCls}
                      required
                    >
                       {availableCourses.map(c => (
                         <option key={c._id} value={c.name}>{c.name}</option>
                       ))}
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className={labelCls}>Admission Date</label>
                     <input 
                       type="date"
                       value={editForm.admissionDate}
                       onChange={e => setEditForm({...editForm, admissionDate: e.target.value})}
                       className={inputCls}
                       required
                     />
                  </div>
               </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={() => setSelectedStudent(null)}
                   className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={updating}
                   className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
                 >
                   {updating ? "UPDATING..." : "SAVE CHANGES"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam Request Modal */}
      {requestExamStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                 </div>
                 Request Examination
              </h3>
              <button onClick={() => setRequestExamStudent(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRequestExam} className="p-8 space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs font-bold text-blue-800 leading-tight">
                  Student: {requestExamStudent.name}<br/>
                  Course: {requestExamStudent.course}
                </p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className={labelCls}>Exam Mode</label>
                    <select 
                      value={examReqForm.examMode}
                      onChange={e => setExamReqForm({...examReqForm, examMode: e.target.value})}
                      className={inputCls}
                      required
                    >
                       <option value="online">Online Exam</option>
                       <option value="offline">Offline Exam (Center Based)</option>
                    </select>
                 </div>

                 {examReqForm.examMode === 'offline' && (
                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5">
                         <label className={labelCls}>Preferred Date</label>
                         <input 
                           type="date"
                           value={examReqForm.preferredDate}
                           onChange={e => setExamReqForm({...examReqForm, preferredDate: e.target.value})}
                           className={inputCls}
                           required
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className={labelCls}>Preferred Center / Location</label>
                         <input 
                           value={examReqForm.preferredCenter}
                           onChange={e => setExamReqForm({...examReqForm, preferredCenter: e.target.value})}
                           className={inputCls}
                           placeholder="Enter center name or location"
                           required
                         />
                      </div>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={() => setRequestExamStudent(null)}
                   className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={requesting}
                   className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 disabled:opacity-50"
                 >
                   {requesting ? "SUBMITTING..." : "SUBMIT REQUEST"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Submission Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                    <BookOpen className="w-4 h-4" />
                 </div>
                 Submit Exam Result
              </h3>
              <button onClick={() => setShowResultModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResultSubmit} className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-200">
                <div className="pb-3 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tight">
                  <span>Student</span>
                  <span className="text-slate-800">{showResultModal.name}</span>
                </div>
                <div className="pt-3 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tight">
                  <span>Registration No</span>
                  <span className="text-slate-800">{showResultModal.registrationNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={labelCls}>Marks Obtained *</label>
                  <input 
                    type="number"
                    value={resultForm.marks}
                    onChange={e => setResultForm({...resultForm, marks: e.target.value})}
                    className={inputCls}
                    placeholder="Out of 100"
                    required
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Grade *</label>
                  <select 
                    value={resultForm.grade}
                    onChange={e => setResultForm({...resultForm, grade: e.target.value})}
                    className={inputCls}
                    required
                  >
                    <option>A+</option><option>A</option><option>B</option><option>C</option><option>D</option><option>F</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Academic Session *</label>
                <input 
                  value={resultForm.session}
                  onChange={e => setResultForm({...resultForm, session: e.target.value})}
                  className={inputCls}
                  placeholder="e.g. 2024-25"
                  required
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 border border-blue-100">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-[10px] font-bold text-blue-800 leading-tight">
                  By submitting, you confirm that the result is accurate. It will be sent to the Head Office for final approval and document generation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={() => setShowResultModal(null)}
                   className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={resultSubmitting}
                   className="py-4 bg-black text-white rounded-2xl font-black uppercase text-xs hover:bg-slate-800 transition shadow-xl disabled:opacity-50"
                 >
                   {resultSubmitting ? "SUBMITTING..." : "CONFIRM & SEND"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
