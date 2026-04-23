"use client";

import { useRef, useState, useEffect, type FormEvent } from "react";
import { Users, PlusCircle, CheckCircle, FileText, User, BookOpen, MapPin, CreditCard, Heart, RefreshCw, ShieldCheck, Download, XCircle, Search } from "lucide-react";
import StudentIdCard from "@/components/common/StudentIdCard";

interface Student {
  _id: string;
  registrationNo: string;
  name: string;
  fatherName: string;
  motherName?: string;
  dob?: string;
  gender?: string;
  email?: string;
  currentAddress?: string;
  permanentAddress?: string;
  highestQualification?: string;
  parentsMobile?: string;
  nationality?: string;
  religion?: string;
  maritalStatus?: string;
  disabilityDetails?: string;
  aadharNo?: string;
  category?: string;
  disability?: boolean;
  referredBy?: string;
  mobile: string;
  course: string;
  status: string;
  createdAt: string;
  admissionDate: string;
  photo?: string;
  examMode?: string;
  offlineExamStatus?: "not_appeared" | "appeared" | "review_pending" | "published";
  offlineExamMarks?: string;
  offlineExamResult?: "Pass" | "Fail" | "Waiting";
  offlineExamCopy?: string;
  session?: string;
  aadharDoc?: string;
  studentSignature?: string;
  totalFee?: number;
  paidAmount?: number;
  duesAmount?: number;
  admissionFees?: string;
  marksheet10th?: string;
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
  const [selectedQual, setSelectedQual] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentFilter, setStudentFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastRegNo, setLastRegNo] = useState("");
  const [lookupRegNo, setLookupRegNo] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [requestExamStudent, setRequestExamStudent] = useState<Student | null>(null);
  const [examReqForm, setExamReqForm] = useState({ examMode: "online", preferredDate: "", preferredCenter: "" });
  const [editForm, setEditForm] = useState({ 
    name: "", fatherName: "", motherName: "", dob: "", gender: "", 
    mobile: "", parentsMobile: "", email: "", course: "", courseType: "Regular", session: "",
    admissionDate: "", currentAddress: "", permanentAddress: "", 
    highestQualification: "", qualificationDetail: "", aadharNo: "",
    category: "", nationality: "Indian", religion: "", maritalStatus: "", disability: false,
    disabilityDetails: "", referredBy: ""
  });
  const [updating, setUpdating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showResultModal, setShowResultModal] = useState<Student | null>(null);
  const [viewIdCard, setViewIdCard] = useState<Student | null>(null);
  const [resultForm, setResultForm] = useState({ 
    marks: "", 
    grade: "A", 
    session: "2024-25",
    examStatus: "appeared" as const
  });
  const [resultSubmitting, setResultSubmitting] = useState(false);
  
  // Local validation states for modals
  const [modalInvalidFields, setModalInvalidFields] = useState<Set<string>>(new Set());

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

  const handleLookup = async () => {
    if (!lookupRegNo.trim()) return;
    setIsFetching(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/atc/students/fetch?regNo=${encodeURIComponent(lookupRegNo.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.message || "Student not found" });
        return;
      }
      
      const s = data.student;
      if (formRef.current) {
        // Auto-fill fields
        const fields = [
          'name', 'fatherName', 'motherName', 'dob', 'gender', 'category', 
          'nationality', 'religion', 'maritalStatus', 'mobile', 'parentsMobile', 
          'email', 'currentAddress', 'permanentAddress', 'highestQualification', 
          'qualificationDetail', 'aadharNo', 'session', 'course', 'courseType', 
          'examMode', 'admissionFees'
        ];
        
        fields.forEach(field => {
          const input = formRef.current?.elements.namedItem(field) as HTMLInputElement | HTMLSelectElement;
          if (input && s[field] !== undefined) {
             input.value = s[field];
          }
        });

        // Handle specific states
        if (s.currentAddress) setCurrentAddr(s.currentAddress);
        if (s.disability) setDisability(s.disability ? "Yes" : "No");
        if (s.highestQualification) setSelectedQual(s.highestQualification);
        
        setMsg({ type: "success", text: "Student details fetched and auto-filled!" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error while fetching student data" });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (tab === "list") void fetchStudents();
    if (tab === "add") void fetchCourses();
  }, [tab]);

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const requiredInputs = formEl.querySelectorAll("[required]");
    const invalid = new Set<string>();
    requiredInputs.forEach((input: any) => {
      if (!input.value || (input.type === 'file' && input.files.length === 0)) {
        invalid.add(input.name);
      }
    });

    if (invalid.size > 0) {
      setInvalidFields(invalid);
      setMsg({ type: "error", text: "Please fill all required fields highlighted in red." });
      setLoading(false);
      return;
    }
    setInvalidFields(new Set());
    
    setLoading(true);
    try {
      const form = new FormData(formEl);
      if (sameAddress) form.set("permanentAddress", currentAddr);

      // Auto-compress photo and signature
      const compressImage = async (file: File): Promise<File | Blob> => {
        if (!file.type.startsWith("image/")) return file;
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_SIZE = 800;
              let width = img.width; let height = img.height;
              if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
              else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
              canvas.width = width; canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => {
                if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));
                else resolve(file);
              }, "image/jpeg", 0.7);
            };
          };
        });
      };

      // Extract all media files to upload separately to avoid Vercel 4.5MB limit
      const docFields = ["photo", "studentSignature", "marksheet10th", "marksheet12th", "graduationDoc", "highestQualDoc", "aadharDoc", "otherDocs"];
      const filesToUpload: { field: string, file: File | Blob }[] = [];
      
      for (const field of docFields) {
        const file = form.get(field);
        if (file instanceof File && file.size > 0) {
          // File Size Validation
          const isImage = file.type.startsWith("image/");
          const isPdf = file.type === "application/pdf";
          const sizeKb = file.size / 1024;

          if (isImage && sizeKb > 100) {
            setMsg({ type: "error", text: `${field}: Image size must be under 100KB. Currently ${Math.round(sizeKb)}KB.` });
            setLoading(false);
            return;
          }
          if (isPdf && sizeKb > 500) {
            setMsg({ type: "error", text: `${field}: PDF size must be under 500KB. Currently ${Math.round(sizeKb)}KB.` });
            setLoading(false);
            return;
          }

          const processedFile = await compressImage(file);
          filesToUpload.push({ field, file: processedFile });
          form.delete(field); // Remove from main request
        }
      }

      setMsg({ type: "success", text: "Creating student record..." });
      const res = await fetch("/api/atc/students", { method: "POST", body: form });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text.slice(0, 100) || "Server returned an invalid response");
      }

      if (!res.ok) {
        const errText = JSON.stringify(data);
        throw new Error(errText);
      }

      const studentId = data.student._id;

      // Upload files sequentially
      for (let i = 0; i < filesToUpload.length; i++) {
        const { field, file } = filesToUpload[i];
        setMsg({ type: "success", text: `Uploading document ${i + 1} of ${filesToUpload.length}...` });
        
        const mediaForm = new FormData();
        mediaForm.append("studentId", studentId);
        mediaForm.append("fieldName", field);
        mediaForm.append("file", file);

        const mediaRes = await fetch("/api/atc/students/media", { method: "POST", body: mediaForm });
        if (!mediaRes.ok) {
           console.warn(`Failed to upload ${field}`);
        }
      }

      setLastRegNo(data.student.registrationNo);
      setShowSuccessModal(true);
      setMsg({ type: "success", text: "Student admitted successfully!" });
      (e.target as HTMLFormElement).reset();
      setSameAddress(false);
      setCurrentAddr("");
      setDisability("No");
      setTimeout(() => setTab("list"), 2000);
    } catch (err: any) {
      console.error("Submission Error:", err);
      let errorMsg = err.message;
      try {
         const errorData = JSON.parse(err.message);
         if (errorData.message) errorMsg = errorData.message + (errorData.details ? " (" + errorData.details + ")" : "");
      } catch { /* not json */ }
      
      setMsg({ type: "error", text: "Submission Failed: " + errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    // Check validation
    const formEl = e.currentTarget as HTMLFormElement;
    const requiredInputs = formEl.querySelectorAll("[required]");
    const invalid = new Set<string>();
    requiredInputs.forEach((input: any) => {
      if (!input.value) invalid.add(input.name || input.id);
    });

    if (invalid.size > 0) {
      setModalInvalidFields(invalid);
      return;
    }
    setModalInvalidFields(new Set());

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
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMsg({ type: "error", text: errorData.message || "Update failed. Please try again." });
      }
    } catch {
      setMsg({ type: "error", text: "Update failed due to network error" });
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestExam = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestExamStudent) return;

    // Check validation
    const formEl = e.currentTarget as HTMLFormElement;
    const requiredInputs = formEl.querySelectorAll("[required]");
    const invalid = new Set<string>();
    requiredInputs.forEach((input: any) => {
      if (!input.value) invalid.add(input.name || input.id);
    });

    if (invalid.size > 0) {
      setModalInvalidFields(invalid);
      return;
    }
    setModalInvalidFields(new Set());

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

    // Check validation
    const formEl = e.currentTarget as HTMLFormElement;
    const requiredInputs = formEl.querySelectorAll("[required]");
    const invalid = new Set<string>();
    requiredInputs.forEach((input: any) => {
      if (!input.value) invalid.add(input.name || input.id);
    });

    if (invalid.size > 0) {
      setModalInvalidFields(invalid);
      return;
    }
    setModalInvalidFields(new Set());

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


  const inputCls = (name?: string) => `w-full px-4 py-2.5 bg-white border ${invalidFields.has(name || "") ? "border-red-700 ring-4 ring-red-50" : "border-slate-200"} rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition placeholder:text-slate-400`;
  const labelCls = (name?: string) => `block text-[11px] font-bold ${invalidFields.has(name || "") ? "text-red-700" : "text-slate-500"} uppercase tracking-wider mb-1.5`;
  const sectionCls = "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5";
  const basicLabelCls = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";
  const basicInputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition placeholder:text-slate-400";

  // Modal Input Styles with validation
  const modalInputCls = (name?: string) => `w-full px-4 py-2.5 bg-white border ${modalInvalidFields.has(name || "") ? "border-red-700 ring-4 ring-red-50" : "border-slate-200"} rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition placeholder:text-slate-400`;

  const filteredStudents = students.filter(s => {
    if (studentFilter === "all") return true;
    if (studentFilter === "approved") return s.status === "approved" || s.status === "active";
    return s.status === studentFilter;
  });

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
            {/* Status Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStudentFilter(s)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    studentFilter === s
                      ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100 scale-105"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {s} Students
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <span className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading student records...</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Bulk Action Bar */}
                {selectedStudents.length > 0 && (
                  <div className="bg-green-700 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4 text-white text-xs font-bold">
                       <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedStudents.length}</div>
                       <span className="uppercase tracking-widest">Students Selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={() => void fetchStudents()} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">Refresh</button>
                       <button onClick={() => setSelectedStudents([])} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">Cancel</button>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-4">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                          checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudents(filteredStudents.map(s => s._id));
                            else setSelectedStudents([]);
                          }}
                        />
                      </th>
                      <th className="px-6 py-4">Reg No / ID</th>
                      <th className="px-6 py-4">Student Identity</th>
                      <th className="px-6 py-4">Opted Course</th>
                      <th className="px-6 py-4">Admission Fee</th>
                      <th className="px-6 py-4">Paid</th>
                      <th className="px-6 py-4 text-center">Dues</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-20 text-center bg-white/50">
                           <div className="flex flex-col items-center justify-center gap-2">
                              <Users className="w-10 h-10 text-slate-200" />
                              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No Records Found</p>
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Selected filter: {studentFilter} students</p>
                           </div>
                        </td>
                      </tr>
                    ) : filteredStudents.map((s) => (
                      <tr key={s._id} className={`hover:bg-slate-50/50 transition cursor-default group ${selectedStudents.includes(s._id) ? 'bg-green-50/30' : ''}`}>
                        <td className="px-6 py-5">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                            checked={selectedStudents.includes(s._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudents(prev => [...prev, s._id]);
                              else setSelectedStudents(prev => prev.filter(id => id !== s._id));
                            }}
                          />
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 group-hover:bg-white transition-colors">
                            {s.registrationNo || "PENDING"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {s.photo ? (
                              s.photo.startsWith("data:application/pdf") ? (
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm"><FileText className="w-4 h-4 text-blue-600" /></div>
                              ) : (
                                <img src={s.photo} alt={s.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm" />
                              )
                            ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm"><User className="w-4 h-4 text-slate-400" /></div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 leading-none mb-1">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">S/o: {s.fatherName} • {s.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-emerald-700 leading-tight">{s.course}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] text-slate-400 font-bold uppercase">{s.admissionDate ? new Date(s.admissionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                               <span className={`px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-black uppercase tracking-tighter border border-slate-200 ${s.examMode === 'offline' ? 'text-orange-600 border-orange-100' : 'text-blue-600 border-blue-100'}`}>
                                  {s.examMode || 'online'}
                               </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-black text-slate-700">₹{s.totalFee || s.admissionFees || 0}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-black text-emerald-600">₹{s.paidAmount || 0}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`font-black ${((s.totalFee || Number(s.admissionFees) || 0) - (s.paidAmount || 0)) > 0 ? "text-red-600" : "text-emerald-700"}`}>
                            ₹{(s.totalFee || Number(s.admissionFees) || 0) - (s.paidAmount || 0)}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                             (s.status === "approved" || s.status === "active") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : 
                             s.status === "rejected" ? "bg-red-50 text-red-700 border border-red-200" :
                             "bg-amber-50 text-amber-600 border border-amber-200"
                           }`}>
                             {(s.status === "approved" || s.status === "active") ? "Approved" : s.status === "rejected" ? "Rejected" : "Pending Admission"}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end gap-2">
                             {(s.status !== "active" && s.status !== "approved") ? (
                                <div className="flex flex-col items-end gap-2">
                                  <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Verification Pending</span>
                                  <button 
                                    onClick={() => {
                                      setSelectedStudent(s);
                                      setEditForm({
                                        name: s.name,
                                        fatherName: s.fatherName,
                                        motherName: s.motherName || "",
                                        dob: s.dob || "",
                                        gender: s.gender || "",
                                        mobile: s.mobile,
                                        parentsMobile: s.parentsMobile || "",
                                        email: s.email || "",
                                        course: s.course,
                                        courseType: (s as any).courseType || "Regular",
                                        session: s.session || "",
                                        admissionDate: s.admissionDate || "",
                                        currentAddress: s.currentAddress || "",
                                        permanentAddress: s.permanentAddress || "",
                                        highestQualification: s.highestQualification || "",
                                        qualificationDetail: (s as any).qualificationDetail || "",
                                        aadharNo: s.aadharNo || "",
                                        category: s.category || "General",
                                        nationality: s.nationality || "Indian",
                                        religion: s.religion || "",
                                        maritalStatus: s.maritalStatus || "",
                                        disability: !!s.disability,
                                        disabilityDetails: s.disabilityDetails || "",
                                        referredBy: s.referredBy || ""
                                      });
                                    }}
                                    className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-2"
                                  >
                                    Edit Record
                                  </button>
                                </div>
                             ) : (
                                <div className="flex flex-col items-end gap-1">
                                   <div className="flex flex-col items-end gap-1 w-full">
                                     <button 
                                       onClick={() => {
                                         setSelectedStudent(s);
                                         setEditForm({
                                           name: s.name,
                                           fatherName: s.fatherName,
                                           motherName: s.motherName || "",
                                           dob: s.dob || "",
                                           gender: s.gender || "",
                                           mobile: s.mobile,
                                           parentsMobile: s.parentsMobile || "",
                                           email: s.email || "",
                                           course: s.course,
                                           courseType: (s as any).courseType || "Regular",
                                           session: s.session || "",
                                           admissionDate: s.admissionDate || "",
                                           currentAddress: s.currentAddress || "",
                                           permanentAddress: s.permanentAddress || "",
                                           highestQualification: s.highestQualification || "",
                                           qualificationDetail: (s as any).qualificationDetail || "",
                                           aadharNo: s.aadharNo || "",
                                           category: s.category || "General",
                                           nationality: s.nationality || "Indian",
                                           religion: s.religion || "",
                                           maritalStatus: s.maritalStatus || "",
                                           disability: !!s.disability,
                                           disabilityDetails: s.disabilityDetails || "",
                                           referredBy: s.referredBy || ""
                                         });
                                       }}
                                       className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-2"
                                     >
                                       View Details
                                     </button>

                                   </div>
                                 </div>
                              )}
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

        {tab === "add" && (
          <form ref={formRef} onSubmit={handleAddSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 0. Registration Lookup (Optional) */}
            <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-end gap-4 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
               <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Search className="w-3 h-3" /> Registration Lookup (Existing Student)
                     <span className="text-slate-400 font-bold ml-auto">OPTIONAL</span>
                  </label>
                  <input 
                    type="text" 
                    value={lookupRegNo}
                    onChange={(e) => setLookupRegNo(e.target.value)}
                    onBlur={() => { if(lookupRegNo) handleLookup(); }}
                    className="w-full px-5 py-3.5 bg-white border border-blue-100 rounded-2xl text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition placeholder:text-slate-300" 
                    placeholder="Enter Reg. No. to auto-fill details (e.g. YCE/2024/...)" 
                  />
               </div>
               <button 
                 type="button" 
                 onClick={handleLookup}
                 disabled={isFetching || !lookupRegNo}
                 className="h-[52px] px-8 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-3 whitespace-nowrap shadow-lg shadow-blue-100"
               >
                 {isFetching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <RefreshCw className="w-4 h-4" />}
                 {isFetching ? "Searching..." : "Fetch Details"}
               </button>
            </div>

            {/* 1. Personal Information */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-blue-500 pl-3">
                <User className="w-4 h-4 text-blue-500" /> Student Identity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className={labelCls("name")}>Full Name (as per ID) *</label>
                  <input required name="name" className={inputCls("name")} placeholder="Student's Legal Name" />
                </div>
                <div>
                  <label className={labelCls("fatherName")}>Father's Name *</label>
                  <input required name="fatherName" className={inputCls("fatherName")} placeholder="Father's Name" />
                </div>
                <div>
                  <label className={labelCls("motherName")}>Mother's Name *</label>
                  <input required name="motherName" className={inputCls("motherName")} placeholder="Mother's Name" />
                </div>
                <div><label className={labelCls("dob")}>Date of Birth *</label><input required type="date" name="dob" className={inputCls("dob")} /></div>
                <div>
                  <label className={labelCls("gender")}>Gender *</label>
                  <select required name="gender" className={inputCls("gender")}>
                    <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div><label className={labelCls("category")}>Category *</label>
                  <select required name="category" className={inputCls("category")}>
                    <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-2">
                <div><label className={labelCls("nationality")}>Nationality</label><input name="nationality" defaultValue="Indian" className={inputCls("nationality")} /></div>
                <div><label className={labelCls("religion")}>Religion</label>
                  <select name="religion" className={inputCls("religion")}>
                    <option value="">Select</option><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Jain</option><option>Buddhism</option><option>Other</option>
                  </select>
                </div>
                <div><label className={labelCls("maritalStatus")}>Marital Status</label>
                  <select name="maritalStatus" className={inputCls("maritalStatus")}>
                    <option value="">Select</option>
                    <option>Married</option>
                    <option>Unmarried</option>
                    <option>Others</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls("disability")}>Physically Disability *</label>
                  <select name="disability" className={inputCls("disability")} value={disability} onChange={e => setDisability(e.target.value)}>
                    <option>No</option><option>Yes</option>
                  </select>
                </div>
                {disability === "Yes" && (
                  <div className="md:col-span-4 animate-in zoom-in-95 duration-200">
                    <label className={labelCls("disabilityDetails")}>Disability Details *</label>
                    <input required={disability === "Yes"} name="disabilityDetails" className={inputCls("disabilityDetails")} placeholder="Please describe provide details" />
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
                  <label className={labelCls("session")}>Session *</label>
                  <input required name="session" className={inputCls("session")} placeholder="e.g. 2024-25" />
                </div>
                <div>
                  <label className={labelCls("course")}>Course *</label>
                  <select required name="course" className={inputCls("course")} disabled={availableCourses.length === 0} onChange={() => void fetchCourses()}>
                    <option value="">{availableCourses.length > 0 ? "Select Course" : "Select Course"}</option>
                    {availableCourses.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className={labelCls("courseType")}>Preference Mode *</label>
                   <select required name="courseType" className={inputCls("courseType")}>
                      <option value="Regular">Regular</option>
                      <option value="ODL (Open Distance Learning)">ODL (Open Distance Learning)</option>
                      <option value="OL (Online Learning)">OL (Online Learning)</option>
                   </select>
                </div>
                <div>
                  <label className={labelCls("examMode")}>Exam Mode *</label>
                  <select required name="examMode" className={inputCls("examMode")}>
                    <option value="online">Online Mode</option>
                    <option value="offline">Offline Mode (Center Based)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls("totalFee")}>Admission Fee (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input required type="number" name="admissionFees" className={inputCls("totalFee") + " pl-8 font-bold"} placeholder="Admission Fee" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls("admissionDate")}>Admission Date *</label>
                  <input required type="date" name="admissionDate" className={inputCls("admissionDate")} defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
            </div>

            {/* 3. Contact information */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-amber-500 pl-3">
                <MapPin className="w-4 h-4 text-amber-500" /> Contact & Residence
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelCls("mobile")}>Student Mobile *</label><input required name="mobile" className={inputCls("mobile")} placeholder="10-digit primary number" maxLength={10} /></div>
                <div><label className={labelCls("parentsMobile")}>Parents Mobile</label><input name="parentsMobile" className={inputCls("parentsMobile")} placeholder="Emergency contact" maxLength={10} /></div>
                <div className="md:col-span-2"><label className={labelCls("email")}>Email Address</label><input type="email" name="email" className={inputCls("email")} placeholder="Student's email ID" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                <div>
                  <label className={labelCls("currentAddress")}>Current Address *</label>
                  <textarea 
                    required 
                    name="currentAddress" 
                    rows={3} 
                    className={inputCls("currentAddress")} 
                    placeholder="Complete block, post, city address" 
                    value={currentAddr}
                    onChange={(e) => setCurrentAddr(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls("permanentAddress")}>Permanent Address *</label>
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
                    className={`${inputCls("permanentAddress")} ${sameAddress ? "bg-slate-50/50 text-slate-400 border-dashed" : ""}`}
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
                <div>
                  <label className={labelCls("highestQualification")}>Highest Qualification *</label>
                  <select 
                    required 
                    name="highestQualification" 
                    className={inputCls("highestQualification")}
                    value={selectedQual}
                    onChange={(e) => setSelectedQual(e.target.value)}
                  >
                    <option value="">Select Qualification</option>
                    <option value="Matriculation">Matriculation</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Graduation">Graduation</option>
                    <option value="Post Graduation">Post Graduation</option>
                    <option value="PhD / Above">PhD / Above</option>
                  </select>
                </div>
                {selectedQual && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className={labelCls("qualificationDetail")}>Percentage / University / Year *</label>
                    <input 
                      required 
                      name="qualificationDetail" 
                      className={inputCls("qualificationDetail")} 
                      placeholder={`Enter ${selectedQual} details...`} 
                    />
                  </div>
                )}
                <div><label className={labelCls("aadharNo")}>Aadhar Number</label><input name="aadharNo" className={inputCls("aadharNo")} placeholder="12-digit UID" maxLength={12} /></div>
                <div><label className={labelCls("referredBy")}>Referred By</label><input name="referredBy" className={inputCls("referredBy")} placeholder="Staff or Partner name" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {[
                    { label: "Student Photo (jpg) *", name: "photo", required: true },
                    { label: "Student Signature (jpg) *", name: "studentSignature", required: true },
                    { label: "10th Marksheet (Compulsory) *", name: "marksheet10th", required: true },
                    { label: "12th Marksheet (jpg/pdf)", name: "marksheet12th", required: false },
                    { label: "Graduation (jpg/pdf)", name: "graduationDoc", required: false },
                    { label: "Highest Qualification (jpg/pdf)", name: "highestQualDoc", required: false },
                    { label: "Aadhar Card PDF *", name: "aadharDoc", required: true },
                    { label: "Additional Docs / Admission Form (pdf)", name: "otherDocs", required: false },
                  ].map(doc => (
                    <div key={doc.name} className={`group relative p-3 rounded-2xl border transition-all ${invalidFields.has(doc.name) ? "border-red-700 bg-red-50/50 ring-4 ring-red-50" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200"}`}>
                      <label className={`block text-[10px] font-black uppercase mb-2 tracking-tighter ${invalidFields.has(doc.name) ? "text-red-700" : "text-slate-400 group-hover:text-blue-500"}`}>
                        {doc.label}
                      </label>
                      <input 
                        type="file" 
                        name={doc.name} 
                        required={doc.required}
                        accept="image/*,application/pdf" 
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
            <div className={`p-8 border-b border-slate-100 flex items-center justify-between ${selectedStudent.status === 'active' || selectedStudent.status === 'approved' ? 'bg-emerald-50/50' : 'bg-slate-50/50'}`}>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedStudent.status === 'active' || selectedStudent.status === 'approved' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                    <User className="w-4 h-4 text-white" />
                 </div>
                 {selectedStudent.status === 'active' || selectedStudent.status === 'approved' ? 'Student Full Profile' : 'Edit Student Record'}
              </h3>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto">
              {(selectedStudent.status === 'active' || selectedStudent.status === 'approved') ? (
                <div className="p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  {/* Identity Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                      {selectedStudent.photo ? (
                        <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl mb-3" />
                      ) : (
                        <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center border-4 border-white shadow-xl mb-3">
                          <User className="w-10 h-10 text-slate-200" />
                        </div>
                      )}
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mb-1">REG REGISTERED</p>
                      <p className="text-xs font-black text-slate-900 tracking-tighter">{selectedStudent.registrationNo}</p>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-x-8 gap-y-6 pt-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
                          <p className="text-sm font-black text-slate-800 uppercase">{selectedStudent.name}</p>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Father Name</label>
                          <p className="text-sm font-black text-slate-800 uppercase">{selectedStudent.fatherName}</p>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mother Name</label>
                          <p className="text-sm font-black text-slate-800 uppercase">{selectedStudent.motherName}</p>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date of Birth</label>
                          <p className="text-sm font-black text-slate-800">
                            {selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : "N/A"}
                          </p>
                       </div>
                    </div>
                  </div>

                  {/* Personal & Social Details */}
                  <div className="p-6 bg-blue-50/30 rounded-[2rem] border border-blue-100/50 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Gender</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.gender}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Category</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.category}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Religion</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.religion || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Aadhar No</label>
                      <p className="text-[11px] font-black text-slate-800">{selectedStudent.aadharNo || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Nationality</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.nationality || 'Indian'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Marital Status</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.maritalStatus || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Disability</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.disability ? `YES (${selectedStudent.disabilityDetails})` : 'NO'}</p>
                    </div>
                  </div>

                  {/* Contact & Academics */}
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Course</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.course}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Academic Session</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.session}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Student Mobile</label>
                      <p className="text-[11px] font-black text-slate-800">{selectedStudent.mobile}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Parents Mobile</label>
                      <p className="text-[11px] font-black text-slate-800">{selectedStudent.parentsMobile || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Admission Date</label>
                      <p className="text-[11px] font-black text-slate-800">{selectedStudent.admissionDate}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Qualification</label>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{selectedStudent.highestQualification || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-white rounded-3xl border border-slate-100">
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">Current Address</label>
                      <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{selectedStudent.currentAddress}</p>
                    </div>
                    <div className="p-5 bg-white rounded-3xl border border-slate-100">
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">Permanent Address</label>
                      <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{selectedStudent.permanentAddress}</p>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                       <FileText className="w-3.5 h-3.5 text-emerald-600" /> Student Documentation
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {[
                         { label: 'Aadhar Card', exists: !!selectedStudent.aadharDoc },
                         { label: '10th Marksheet', exists: !!(selectedStudent as any).marksheet10th },
                         { label: 'Student Photo', exists: !!selectedStudent.photo },
                         { label: 'Signature', exists: !!selectedStudent.studentSignature },
                       ].map(doc => (
                         <div key={doc.label} className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase">{doc.label}</span>
                            {doc.exists ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="pt-4">
                     <button 
                        onClick={() => setSelectedStudent(null)}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-black transition shadow-xl"
                     >
                        Close Profile
                     </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="p-8 space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Identity */}
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Student Full Name *</label>
                       <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className={modalInputCls("edit_name")} required />
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Father's Name *</label>
                       <input value={editForm.fatherName} onChange={e => setEditForm({...editForm, fatherName: e.target.value})} className={modalInputCls("edit_father")} required />
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Mother's Name *</label>
                       <input value={editForm.motherName} onChange={e => setEditForm({...editForm, motherName: e.target.value})} className={modalInputCls("edit_mother")} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className={basicLabelCls}>Date of Birth *</label>
                         <input type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} className={modalInputCls("edit_dob")} required />
                      </div>
                      <div className="space-y-1.5">
                         <label className={basicLabelCls}>Gender *</label>
                         <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className={modalInputCls("edit_gender")} required>
                            <option>Male</option><option>Female</option><option>Other</option>
                         </select>
                      </div>
                    </div>

                    {/* Contact & Social */}
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Mobile No *</label>
                       <input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} className={modalInputCls("edit_mobile")} required maxLength={10} />
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Email Address</label>
                       <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className={modalInputCls("edit_email")} />
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Aadhar Number</label>
                       <input value={editForm.aadharNo} onChange={e => setEditForm({...editForm, aadharNo: e.target.value})} className={modalInputCls("edit_aadhar")} maxLength={12} />
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Category</label>
                       <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className={modalInputCls("edit_category")}>
                          <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Parents Mobile</label>
                       <input value={editForm.parentsMobile || ''} onChange={e => setEditForm({...editForm, parentsMobile: e.target.value})} className={modalInputCls("edit_parents_mobile")} maxLength={10} />
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Nationality</label>
                       <input value={editForm.nationality || 'Indian'} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className={modalInputCls("edit_nationality")} />
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Marital Status</label>
                       <select value={editForm.maritalStatus || 'Single'} onChange={e => setEditForm({...editForm, maritalStatus: e.target.value})} className={modalInputCls("edit_marital")}>
                          <option>Single</option><option>Married</option><option>Widowed</option><option>Divorced</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Religion</label>
                       <input value={editForm.religion || ''} onChange={e => setEditForm({...editForm, religion: e.target.value})} className={modalInputCls("edit_religion")} />
                    </div>
                    <div className="space-y-1.5 col-span-2 grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className={basicLabelCls}>Disability?</label>
                          <select value={editForm.disability ? "Yes" : "No"} onChange={e => setEditForm({...editForm, disability: e.target.value === "Yes"})} className={modalInputCls("edit_disability")}>
                             <option value="No">No</option><option value="Yes">Yes</option>
                          </select>
                       </div>
                       {editForm.disability && (
                         <div className="space-y-1.5">
                            <label className={basicLabelCls}>Disability Details</label>
                            <input value={editForm.disabilityDetails || ''} onChange={e => setEditForm({...editForm, disabilityDetails: e.target.value})} className={modalInputCls("edit_disability_details")} />
                         </div>
                       )}
                    </div>

                    {/* Academic */}
                    <div className="space-y-1.5">
                       <label className={basicLabelCls}>Course *</label>
                       <select value={editForm.course} onChange={e => setEditForm({...editForm, course: e.target.value})} className={modalInputCls("edit_course")} required>
                          {availableCourses.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className={basicLabelCls}>Session *</label>
                         <input value={editForm.session} onChange={e => setEditForm({...editForm, session: e.target.value})} className={modalInputCls("edit_session")} required />
                      </div>
                      <div className="space-y-1.5">
                         <label className={basicLabelCls}>Admission Date *</label>
                         <input type="date" value={editForm.admissionDate} onChange={e => setEditForm({...editForm, admissionDate: e.target.value})} className={modalInputCls("edit_date")} required />
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="md:col-span-2 space-y-1.5">
                       <label className={basicLabelCls}>Current Address *</label>
                       <textarea value={editForm.currentAddress} onChange={e => setEditForm({...editForm, currentAddress: e.target.value})} className={modalInputCls("edit_curr_addr")} rows={2} required />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                       <label className={basicLabelCls}>Permanent Address *</label>
                       <textarea value={editForm.permanentAddress} onChange={e => setEditForm({...editForm, permanentAddress: e.target.value})} className={modalInputCls("edit_perm_addr")} rows={2} required />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                     <button type="button" onClick={() => setSelectedStudent(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition">Cancel</button>
                     <button type="submit" disabled={updating} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition shadow-xl disabled:opacity-50">
                        {updating ? "UPDATING..." : "SAVE CHANGES"}
                     </button>
                  </div>
                </form>
              )}
            </div>
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
                 Exam Request Schedule
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
                    <label className={basicLabelCls}>Exam Mode</label>
                    <select 
                      value={examReqForm.examMode}
                      onChange={e => setExamReqForm({...examReqForm, examMode: e.target.value})}
                      className={basicInputCls}
                      required
                    >
                       <option value="online">Online Exam</option>
                       <option value="offline">Offline Exam (Center Based)</option>
                    </select>
                 </div>

                 {examReqForm.examMode === 'offline' && (
                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5">
                         <label className={basicLabelCls}>Preferred Date</label>
                         <input 
                           type="date"
                           value={examReqForm.preferredDate}
                           onChange={e => setExamReqForm({...examReqForm, preferredDate: e.target.value})}
                          className={basicInputCls}
                           required
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className={basicLabelCls}>Preferred Center / Location</label>
                         <input 
                           value={examReqForm.preferredCenter}
                           onChange={e => setExamReqForm({...examReqForm, preferredCenter: e.target.value})}
                          className={basicInputCls}
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
                  <label className={basicLabelCls}>Marks Obtained *</label>
                  <input 
                    type="number"
                    value={resultForm.marks}
                    onChange={e => setResultForm({...resultForm, marks: e.target.value})}
                    className={basicInputCls}
                    placeholder="Out of 100"
                    required
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={basicLabelCls}>Grade *</label>
                  <select 
                    value={resultForm.grade}
                    onChange={e => setResultForm({...resultForm, grade: e.target.value})}
                    className={basicInputCls}
                    required
                  >
                    <option>A+</option><option>A</option><option>B</option><option>C</option><option>D</option><option>F</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={basicLabelCls}>Academic Session *</label>
                <input 
                  value={resultForm.session}
                  onChange={e => setResultForm({...resultForm, session: e.target.value})}
                  className={basicInputCls}
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
        {/* ID CARD VIEW MODAL */}
        {viewIdCard && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <div className="relative group">
                <div className="absolute -top-12 right-0 flex gap-4">
                   <button 
                     onClick={() => window.print()}
                     className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition border border-white/20 flex items-center gap-2 px-4 shadow-lg"
                   >
                      <Download className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Print ID</span>
                   </button>
                   <button 
                     onClick={() => setViewIdCard(null)} 
                     className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition border border-white/20 shadow-lg"
                   >
                     <XCircle className="w-5 h-5" />
                   </button>
                </div>
                <div id="student-id-card-container" className="animate-in zoom-in-95 duration-300">
                   <StudentIdCard 
                     student={{
                       ...viewIdCard,
                       registrationNo: viewIdCard.registrationNo || "PENDING",
                       dob: (viewIdCard as any).dob || "N/A"
                     }} 
                   />
                </div>
             </div>
          </div>
        )}

        <style jsx global>{`
          @media print {
            @page { margin: 0; size: auto; }
            body * { visibility: hidden !important; }
            #student-id-card-container, #student-id-card-container * {
              visibility: visible !important;
            }
            #student-id-card-container {
              position: fixed !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) scale(1.3) !important;
              width: 100% !important;
              display: flex !important;
              justify-content: center !important;
            }
          }
        `}</style>
      {/* SUCCESS POPUP MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300 text-center p-10 relative">
             <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
             <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle className="w-10 h-10 text-green-600" />
             </div>
             <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Registration Success</h3>
             <p className="text-slate-500 text-sm mb-6 leading-relaxed">Registration form submitted Successfully! <br /> Student Registration Number is: <b>{lastRegNo}</b></p>
             <button 
               onClick={() => {
                 setShowSuccessModal(false);
                 setTab("list");
               }}
               className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
             >
               Awesome, Continue
             </button>
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
