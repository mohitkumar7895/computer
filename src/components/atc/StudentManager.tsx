"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Users, PlusCircle, CheckCircle, FileText, User, BookOpen, MapPin, CreditCard, Heart } from "lucide-react";

interface Student {
  _id: string;
  registrationNo: string;
  name: string;
  fatherName: string;
  mobile: string;
  course: string;
  status: string;
  createdAt: string;
  photo?: string;
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
                      <th className="px-6 py-4">Admission Date</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/50 transition cursor-default group">
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 group-hover:bg-white transition-colors">
                            {s.registrationNo}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {s.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
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
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-500 font-medium">{new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tighter shadow-sm shadow-emerald-50">
                            {s.status}
                          </span>
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
                    <option value="">Select</option><option>Unmarried</option><option>Married</option>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Session *</label>
                  <input required name="session" className={inputCls} placeholder="e.g. 2024-25" />
                </div>
                <div>
                  <label className={labelCls}>Class Roll No (Optional)</label>
                  <input name="classRollNo" className={inputCls} placeholder="e.g. 101" />
                </div>
                <div>
                  <label className={labelCls}>Admission Fees *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input required name="admissionFees" className={inputCls + " pl-8 text-green-700 font-bold"} placeholder="Amount" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Course *</label>
                  <select required name="course" className={inputCls} disabled={availableCourses.length === 0}>
                    <option value="">{availableCourses.length > 0 ? "Select Course" : "No courses available"}</option>
                    {availableCourses.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  {availableCourses.length === 0 && (
                    <p className="mt-2 text-[11px] text-slate-500">No active courses are available for your center. Contact admin to assign courses or zones.</p>
                  )}
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
                  { label: "Student Photo", name: "photo", color: "bg-emerald-50 text-emerald-700" },
                  { label: "Student Signature", name: "studentSignature", color: "bg-purple-50 text-purple-700" },
                  { label: "Qualification Proof", name: "qualificationDoc", color: "bg-blue-50 text-blue-700" },
                  { label: "Aadhar Card PDF/JPG", name: "aadharDoc", color: "bg-orange-50 text-orange-700" },
                  { label: "Other ID Proof", name: "idProof", color: "bg-slate-100 text-slate-700" },
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
    </div>
  );
}
