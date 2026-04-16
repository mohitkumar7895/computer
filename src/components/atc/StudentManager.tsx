"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Users, PlusCircle, CheckCircle, FileText, User } from "lucide-react";

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

export default function StudentManager() {
  const [tab, setTab] = useState<"list" | "add">("list");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sameAddress, setSameAddress] = useState(false);
  const [currentAddr, setCurrentAddr] = useState("");

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

  useEffect(() => {
    if (tab === "list") void fetchStudents();
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
      setTimeout(() => setTab("list"), 2000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition";
  const labelCls = "block text-xs font-bold text-slate-600 mb-1";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 pt-4 border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${tab === "list" ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> All Students</span>
        </button>
        <button
          onClick={() => setTab("add")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${tab === "add" ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <span className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> New Admission</span>
        </button>
      </div>

      <div className="p-6">
        {msg && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {msg.text}
          </div>
        )}

        {tab === "list" && (
          <div>
            {loading ? (
              <div className="flex justify-center p-8"><span className="w-8 h-8 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" /></div>
            ) : students.length === 0 ? (
              <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold mb-4">No students admitted yet</p>
                <button onClick={() => setTab("add")} className="px-5 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-xl hover:bg-green-700 transition">Admit New Student</button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-tight">
                    <tr>
                      <th className="px-4 py-3 font-bold">Registration No</th>
                      <th className="px-4 py-3 font-bold">Student Details</th>
                      <th className="px-4 py-3 font-bold">Course</th>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-800">{s.registrationNo}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {s.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.photo} alt={s.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200"><User className="w-4 h-4 text-slate-400" /></div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800 leading-tight">{s.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">S/D: {s.fatherName} • {s.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-700 bg-blue-50/50">{s.course}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                            <CheckCircle className="w-3 h-3" /> {s.status}
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
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className={labelCls}>Full Name *</label><input required name="name" className={inputCls} placeholder="Student's Name" /></div>
              <div><label className={labelCls}>Father's Name *</label><input required name="fatherName" className={inputCls} placeholder="Father's Name" /></div>
              <div><label className={labelCls}>Mother's Name *</label><input required name="motherName" className={inputCls} placeholder="Mother's Name" /></div>
              
              <div><label className={labelCls}>Date of Birth *</label><input required type="date" name="dob" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Gender *</label>
                <select required name="gender" className={inputCls}>
                  <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div><label className={labelCls}>Student Mobile Number *</label><input required name="mobile" className={inputCls} placeholder="10-digit mobile" maxLength={10} /></div>
              
              <div><label className={labelCls}>Parents Mobile Number (Optional)</label><input name="parentsMobile" className={inputCls} placeholder="10-digit mobile" maxLength={10} /></div>
              <div><label className={labelCls}>Email Address</label><input type="email" name="email" className={inputCls} placeholder="Optional" /></div>
              <div><label className={labelCls}>Aadhar Number</label><input name="aadharNo" className={inputCls} placeholder="12-digit Aadhar" maxLength={12} /></div>
            </div>

            <h4 className="text-sm font-bold text-slate-800 border-b pb-2 pt-4">Academic & Admission</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className={labelCls}>Course *</label><input required name="course" className={inputCls} placeholder="e.g. ADCA, DCA, PGDCA" /></div>
              <div><label className={labelCls}>Highest Qualification *</label><input required name="highestQualification" className={inputCls} placeholder="e.g. 10th, 12th, Graduate" /></div>
              <div><label className={labelCls}>Referred By</label><input name="referredBy" className={inputCls} placeholder="Who referred this student?" /></div>
            </div>

            <h4 className="text-sm font-bold text-slate-800 border-b pb-2 pt-4">Address Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Current Address *</label>
                <textarea 
                  required 
                  name="currentAddress" 
                  rows={3} 
                  className={inputCls} 
                  placeholder="Street, Village, Post, etc." 
                  value={currentAddr}
                  onChange={(e) => setCurrentAddr(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Permanent Address *</label>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                      checked={sameAddress}
                      onChange={(e) => setSameAddress(e.target.checked)}
                    />
                    Same as Current
                  </label>
                </div>
                <textarea 
                  required={!sameAddress}
                  disabled={sameAddress}
                  name="permanentAddress" 
                  rows={3} 
                  className={`${inputCls} ${sameAddress ? "bg-slate-50 text-slate-400" : ""}`}
                  placeholder={sameAddress ? "Same as current" : "Permanent postal address"}
                  value={sameAddress ? currentAddr : undefined}
                />
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-800 border-b pb-2 pt-4">Required Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className={labelCls}>Student Photo (Optional)</label>
                <input type="file" name="photo" accept="image/*" className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" />
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className={labelCls}>Student Signature (Optional)</label>
                <input type="file" name="studentSignature" accept="image/*" className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer" />
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className={labelCls}>Qualification Proof (Optional)</label>
                <input type="file" name="qualificationDoc" accept="image/*,application/pdf" className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className={labelCls}>Aadhar Upload (Optional)</label>
                <input type="file" name="aadharDoc" accept="image/*,application/pdf" className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer" />
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className={labelCls}>ID Proof / Other (Optional)</label>
                <input type="file" name="idProof" accept="image/*,application/pdf" className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button disabled={loading} type="submit" className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition shadow disabled:opacity-75">
                {loading ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> : <PlusCircle className="w-4 h-4" />}
                {loading ? "Submitting..." : "Complete Admission"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
