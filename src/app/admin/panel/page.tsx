"use client";

import { useEffect, useState, useCallback, Fragment, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";
import {
  CheckCircle, XCircle, Clock, Users, FileText, PlusCircle,
  LogOut, ShieldCheck, ChevronDown, ChevronUp, Eye, RefreshCw, Settings, QrCode, Upload, Menu, Layers, Monitor,
  Trash2, Lock, Edit2, AlertTriangle, ShieldAlert, ClipboardCheck, MapPin, BookOpen, User, Building2, RotateCcw, CreditCard, Download, EyeOff, Hash, Save, Printer,
  Layout, Type, Mail
} from "lucide-react";
import AdminAtcForm from "@/components/admin/AdminAtcForm";
import CourseManager from "@/components/admin/CourseManager";
import ExamSetManager from "@/components/admin/ExamSetManager";
import ExamRequestManager from "@/components/admin/ExamRequestManager";
import StudentIdCard from "@/components/common/StudentIdCard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toPng } from "html-to-image";
import {
  DEFAULT_FEE_OPTIONS,
  FeeOption,
  getFeeLabel,
  parseFeeOptions,
  SETTINGS_PROCESS_FEE_KEY,
  INDIAN_STATES,
  DISTRICTS_BY_STATE,
} from "@/utils/atcSettings";
import dynamic from "next/dynamic";
import StudyMaterialManager from "@/components/admin/StudyMaterialManager";

const FeeManager = dynamic(() => import("@/components/common/FeeManager"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Fee Manager...</div>,
  ssr: false 
});

interface Application {
  _id: string; trainingPartnerName: string; trainingPartnerAddress: string;
  email: string; mobile: string; district: string; state: string; pin?: string;
  chiefName: string; designation: string; status: "pending" | "approved" | "rejected";
  submittedByAdmin: boolean; processFee: string; yearOfEstablishment: string;
  paymentMode: string; statusOfInstitution: string; educationQualification: string;
  professionalExperience: string; dob: string; createdAt: string;
  tpCode?: string; photo?: string; paymentScreenshot?: string;
  signature?: string; logo?: string; aadharDoc?: string; marksheetDoc?: string; otherDocs?: string;
  instituteDocument?: string;
  infrastructure?: string;
  postalAddressOffice?: string;
  zones?: string[];
  userStatus?: "active" | "disabled";
}

interface Student {
  _id: string;
  name: string;
  registrationNo: string;
  tpCode: string;
  course: string;
  mobile: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  email?: string;
  currentAddress: string;
  permanentAddress: string;
  courseType?: string;
  session: string;
  category: string;
  religion?: string;
  disability: boolean;
  disabilityDetails?: string;
  admissionFees: string;
  admissionDate?: string;
  highestQualification: string;
  status: "pending" | "approved" | "rejected" | "active" | "pending_atc" | "pending_admin";
  isDirectAdmission?: boolean;
  createdAt: string;
  photo?: string;
  qualificationDoc?: string;
  aadharDoc?: string;
  studentSignature?: string;
  otherDocs?: string;
  password?: string;
  userStatus?: "active" | "disabled";
  totalFee?: number;
  paidAmount?: number;
  duesAmount?: number;
}


// Helper to parse infrastructure
const parseInfra = (infraStr: string | undefined): Record<string, { rooms: string; seats: string; area: string }> => {
  try {
    return JSON.parse(infraStr || "{}") as Record<string, { rooms: string; seats: string; area: string }>;
  } catch {
    return {};
  }
};

const FEE_LABEL: Record<string, string> = {
  "2000": "TP 1 YEAR — ₹2,360",
  "3000": "TP 2 YEARS — ₹3,540",
  "5000": "TP 3 YEARS — ₹5,900",
};

const FormValue = ({ label, value, highlight = false, full = false }: any) => (
  <div className={`${full ? 'col-span-2' : ''} border-b border-slate-100 pb-1`}>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className={`text-[11px] font-black uppercase ${highlight ? 'text-blue-700' : 'text-slate-900'}`}>{value || "---"}</p>
  </div>
);

type Tab = "dashboard" | "create" | "courses" | "questionSets" | "centers" | "examRequests" | "materials" | "settings" | "students" | "resultReview" | "registration" | "fees" | "backgrounds";

const PrintField = ({ label, value }: any) => (
  <div>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
    <p className="text-[11px] font-black text-slate-900 uppercase">{value || "---"}</p>
  </div>
);

export default function AdminPanelPage() {
  usePageTitle("admin");
  const router = useRouter();
  const { loading: authLoading, user: authUser, logout: authLogout, sessionReady } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected" | "disabled">("all");
  const [centerFilter, setCenterFilter] = useState<"all" | "pending" | "approved" | "rejected" | "disabled">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["settings"]);

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);
  }; // New state
  const [editingCenter, setEditingCenter] = useState<Application | null>(null);
  const [editValues, setEditValues] = useState({
    trainingPartnerName: "",
    district: "",
    state: "",
    zones: "",
    mobile: "",
    email: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [prefillApplication, setPrefillApplication] = useState<Application | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // QR Settings
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSaving, setQrSaving] = useState(false);
  const [bgLoading, setBgLoading] = useState(true);
  const [bgs, setBgs] = useState({ id_front: "", id_back: "", certificate: "", marksheet: "", admit_card: "" });
  const [bgSaving, setBgSaving] = useState<string | null>(null);

  // Signature Settings
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [sigLoading, setSigLoading] = useState(false);
  const [sigSaving, setSigSaving] = useState(false);

  const [feePlans, setFeePlans] = useState<FeeOption[]>(DEFAULT_FEE_OPTIONS);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeSaveMsg, setFeeSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentFilter, setStudentFilter] = useState<"all" | "pending" | "approved" | "rejected" | "disabled">("all");
  const [studentActionId, setStudentActionId] = useState<string | null>(null);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [viewIdCard, setViewIdCard] = useState<any>(null);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  
  // Result Review
  const [pendingResults, setPendingResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [releaseForm, setReleaseForm] = useState({ marksheet: true, certificate: true });

  // Application Filters
  const [appSearch, setAppSearch] = useState("");
  const [appStateFilter, setAppStateFilter] = useState("");
  const [appDistrictFilter, setAppDistrictFilter] = useState("");

  const [studentEditValues, setStudentEditValues] = useState<any>({});
  const [passData, setPassData] = useState({ old: "", new: "", confirm: "" });
  const [passSaving, setPassSaving] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showStudentPass, setShowStudentPass] = useState(false);

  // ID Format States
  const [centerFormat, setCenterFormat] = useState({ prefix: "ATC-", counter: 1, padding: 4 });
  const [studentFormat, setStudentFormat] = useState({ prefix: "ATC-ST-", counter: 1, padding: 4 });
  const [idFormatSaving, setIdFormatSaving] = useState(false);
  const [brandName, setBrandName] = useState("Brand Name");
  const [brandMobile, setBrandMobile] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandAddress, setBrandAddress] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandSaving, setBrandSaving] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const feeLabel = (value: string) => getFeeLabel(feePlans, value, FEE_LABEL);

  const fetchApplications = useCallback(async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/applications");
      if (res.status === 401) {
        await authLogout();
        return;
      }
      const data = (await res.json()) as { applications: Application[] };
      setApplications(data.applications ?? []);
    } catch {
      showToast("error", "Failed to load applications.");
    } finally {
      setLoading(false);
    }

    apiFetch("/api/admin/settings/backgrounds")
      .then((res) => res.json())
      .then((data) => {
        setBgs(data);
        setBgLoading(false);
      })
      .catch(() => setBgLoading(false));
  }, [authLogout, sessionReady, authLoading, authUser]);

  const openCenterEditor = (app: Application) => {
    setToastMsg(null);
    setEditingCenter(app);
    setEditValues({
      trainingPartnerName: app.trainingPartnerName,
      district: app.district,
      state: app.state,
      zones: (app.zones ?? []).join(", "),
      mobile: app.mobile,
      email: app.email,
    });
  };

  const closeCenterEditor = () => {
    setEditingCenter(null);
    setEditSaving(false);
  };

  const handleCenterSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCenter) return;

    const trainingPartnerName = editValues.trainingPartnerName.trim();
    const district = editValues.district.trim();
    const state = editValues.state.trim();
    const zones = editValues.zones.split(",").map((zone) => zone.trim()).filter(Boolean);
    const mobile = editValues.mobile.trim();
    const email = editValues.email.trim();

    if (!trainingPartnerName) { showToast("error", "Center name is required."); return; }
    if (!district) { showToast("error", "District is required."); return; }
    if (!state) { showToast("error", "State is required."); return; }
    if (!/^[0-9]{10}$/.test(mobile)) { showToast("error", "Mobile number must be 10 digits."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("error", "Enter a valid email address."); return; }

    setEditSaving(true);
    try {
      const res = await apiFetch(`/api/admin/applications/${editingCenter._id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          update: {
            trainingPartnerName,
            district,
            state,
            zones,
            mobile,
            email,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) { showToast("error", data.message || "Failed to update center."); return; }

      showToast("success", data.message || "Center updated successfully.");
      closeCenterEditor();
      await fetchApplications();
    } catch {
      showToast("error", "Unable to save center changes. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const fetchSettings = useCallback(async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setQrLoading(true);
    setSigLoading(true);
    try {
      const qRes = await apiFetch("/api/admin/settings?key=qr_code");
      const qData = (await qRes.json()) as { value: string | null };
      setQrPreview(qData.value ?? null);

      const sRes = await apiFetch("/api/admin/settings?key=auth_signature");
      const sData = (await sRes.json()) as { value: string | null };
      setSigPreview(sData.value ?? null);

      const fRes = await apiFetch(`/api/admin/settings?key=${SETTINGS_PROCESS_FEE_KEY}`);
      const fData = (await fRes.json()) as { value: string | null };
      setFeePlans(parseFeeOptions(fData.value));

      const cfRes = await apiFetch("/api/admin/settings?key=reg_format_center");
      const cfData = await cfRes.json();
      if (cfData.value) setCenterFormat(JSON.parse(cfData.value));

      const sfRes = await apiFetch("/api/admin/settings?key=reg_format_student");
      const sfData = await sfRes.json();
      if (sfData.value) setStudentFormat(JSON.parse(sfData.value));

      const bRes = await apiFetch("/api/admin/settings?key=brand_name");
      const bData = (await bRes.json()) as { value: string | null };
      if (bData.value) setBrandName(bData.value);

      const bmRes = await apiFetch("/api/admin/settings?key=brand_mobile");
      const bmData = (await bmRes.json()) as { value: string | null };
      if (bmData.value) setBrandMobile(bmData.value);

      const beRes = await apiFetch("/api/admin/settings?key=brand_email");
      const beData = (await beRes.json()) as { value: string | null };
      if (beData.value) setBrandEmail(beData.value);

      const baRes = await apiFetch("/api/admin/settings?key=brand_address");
      const baData = (await baRes.json()) as { value: string | null };
      if (baData.value) setBrandAddress(baData.value);

      const buRes = await apiFetch("/api/admin/settings?key=brand_url");
      const buData = (await buRes.json()) as { value: string | null };
      if (buData.value) setBrandUrl(buData.value);

      const blRes = await apiFetch("/api/admin/settings?key=brand_logo");
      const blData = (await blRes.json()) as { value: string | null };
      if (blData.value) setBrandLogo(blData.value);
    } catch { /* ignore */ } finally {
      setQrLoading(false);
      setSigLoading(false);
    }
  }, [sessionReady, authLoading, authUser]);

  const fetchStudents = useCallback(async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setStudentLoading(true);
    try {
      const res = await apiFetch("/api/admin/students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      showToast("error", "Failed to load students.");
    } finally {
      setStudentLoading(false);
    }
  }, [sessionReady, authLoading, authUser]);

  const fetchPendingResults = useCallback(async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setResultsLoading(true);
    try {
      const res = await apiFetch("/api/admin/exams/pending-results");
      if (res.ok) {
        const data = await res.json();
        setPendingResults(data);
      }
    } catch { showToast("error", "Failed to fetch pending results"); }
    finally { setResultsLoading(false); }
  }, [sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (sessionReady && !authLoading && authUser) void fetchApplications(); 
  }, [fetchApplications, sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (tab === "settings" && sessionReady && !authLoading && authUser) void fetchSettings(); 
  }, [tab, fetchSettings, sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (tab === "dashboard" && sessionReady && !authLoading && authUser) {
      void fetchApplications();
      void fetchStudents();
    }
  }, [tab, fetchApplications, fetchStudents, sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (tab === "students" && sessionReady && !authLoading && authUser) void fetchStudents(); 
  }, [tab, fetchStudents, sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (tab === "resultReview" && sessionReady && !authLoading && authUser) void fetchPendingResults(); 
  }, [tab, fetchPendingResults, sessionReady, authLoading, authUser]);



  const handleStudentAction = async (id: string, action: "approved" | "rejected" | "toggleStatus") => {
    setStudentActionId(id + action);
    try {

      const res = await apiFetch(`/api/admin/students/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.message); return; }
      showToast("success", data.message || "Action completed");
      await fetchStudents();
    } catch {
      showToast("error", "Action failed.");
    } finally {
      setStudentActionId(null);
    }
  };

  const handleBrandSave = async () => {
    if (!authUser || !brandName.trim()) return showToast("error", "Brand name cannot be empty.");
    setBrandSaving(true);
    try {
      const h = { 
        "Content-Type": "application/json",
      };
      
      // Save Name
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_name", value: brandName.trim() }),
      });
      // Save Mobile
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_mobile", value: brandMobile.trim() }),
      });
      // Save URL
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_url", value: brandUrl.trim() }),
      });
      // Save Email
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_email", value: brandEmail.trim() }),
      });
      // Save Address
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_address", value: brandAddress.trim() }),
      });
      
      showToast("success", "Global Brand settings updated!");
    } catch {
      showToast("error", "Failed to save brand settings.");
    } finally {
      setBrandSaving(false);
    }
  };

  const handleBrandLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setBrandLogo(base64);
      try {
        await apiFetch("/api/admin/settings", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: "brand_logo", value: base64 }),
        });
        showToast("success", "Brand Logo updated globally!");
      } catch {
        showToast("error", "Failed to save logo.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPassword = async (id: string) => {
    const newPass = prompt("Enter new password for student:");
    if (!newPass || !authUser) return;
    try {
      const res = await apiFetch(`/api/admin/students/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "resetPassword", newPassword: newPass }),
      });
      if (!res.ok) throw new Error("Reset failed");
      showToast("success", "Password reset successfully");
    } catch {
      showToast("error", "Failed to reset password");
    }
  };

  const handleBulkAction = async (type: "students" | "centers", action: string) => {
    const ids = type === "students" ? selectedStudents : selectedApps;
    if (ids.length === 0 || !authUser) return;
    if (!confirm(`Are you sure you want to ${action} ${ids.length} items?`)) return;

    try {
      const res = await apiFetch(`/api/admin/${type === "students" ? "students" : "applications"}/bulk`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("success", data.message);
      setSelectedStudents([]);
      setSelectedApps([]);
      if (type === "students") await fetchStudents(); else await fetchApplications();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject" | "toggleStatus") => {
    if (!sessionReady || authLoading || !authUser) return;
    setActionLoading(id + action);
    try {
      const res = await apiFetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { message: string; tpCode?: string; defaultPassword?: string };
      if (!res.ok) { showToast("error", data.message); return; }
      if (action === "approve" && data.tpCode) {
        showToast("success", `✅ Approved! TP Code: ${data.tpCode} | Default PW: ${data.defaultPassword}`);
      } else {
        showToast(action === "reject" ? "error" : "success", data.message);
      }
      await fetchApplications();
    } catch {
      showToast("error", "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const openApplicationEditor = (application: Application) => {
    setToastMsg(null);
    setEditingApplication(application);
  };

  const openApplicationForCreateEdit = async (application: Application) => {
    if (!sessionReady || authLoading || !authUser) return;
    setToastMsg(null);
    setActionLoading(application._id + "fetching");
    try {
      const res = await apiFetch(`/api/admin/applications/${application._id}`, {
      });
      if (!res.ok) throw new Error("Failed to fetch full application details.");
      const data = await res.json();
      setPrefillApplication(data.application);
      setTab("create");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const closeApplicationEditor = () => {
    setEditingApplication(null);
  };

  const printApplication = (application: Application) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const formattedZones = (application.zones ?? []).join(", ");
    const infra = parseInfra(application.infrastructure || "{}");

    const rows = Object.entries(infra).map(([key, val]) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${key}</td>
        <td style="padding:8px;border:1px solid #ddd;">${val.rooms}</td>
        <td style="padding:8px;border:1px solid #ddd;">${val.seats}</td>
        <td style="padding:8px;border:1px solid #ddd;">${val.area}</td>
      </tr>`).join("");

    printWindow.document.write(`
      <html><head><title>Print Application</title>
      <style>body{font-family:Arial,sans-serif;margin:20px;color:#111}h1{font-size:22px;margin-bottom:10px}h2{font-size:16px;margin:20px 0 8px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f8fafc;font-weight:700}</style>
      </head><body>
      <h1>Application Form - ${application.trainingPartnerName}</h1>
      <p><strong>TP Code:</strong> ${application.tpCode || "N/A"}</p>
      <p><strong>Status:</strong> ${application.status}</p>
      <h2>Basic Information</h2>
      <table><tbody>
        <tr><th>Training Partner Name</th><td>${application.trainingPartnerName}</td></tr>
        <tr><th>Training Partner Address</th><td>${application.trainingPartnerAddress}</td></tr>
        <tr><th>Postal Address</th><td>${application.postalAddressOffice || "—"}</td></tr>
        <tr><th>Zones</th><td>${formattedZones || "—"}</td></tr>
        <tr><th>District</th><td>${application.district}</td></tr>
        <tr><th>State</th><td>${application.state}</td></tr>
        <tr><th>PIN</th><td>${application.pin ?? "—"}</td></tr>
        <tr><th>Mobile</th><td>${application.mobile}</td></tr>
        <tr><th>Email</th><td>${application.email}</td></tr>
      </tbody></table>
      <h2>Institution Details</h2>
      <table><tbody>
        <tr><th>Type</th><td>${application.statusOfInstitution}</td></tr>
        <tr><th>Establishment Year</th><td>${application.yearOfEstablishment}</td></tr>
        <tr><th>Chief Name</th><td>${application.chiefName}</td></tr>
        <tr><th>Designation</th><td>${application.designation}</td></tr>
        <tr><th>Education</th><td>${application.educationQualification}</td></tr>
        <tr><th>Experience</th><td>${application.professionalExperience}</td></tr>
        <tr><th>Date of Birth</th><td>${application.dob}</td></tr>
        <tr><th>Payment Mode</th><td>${application.paymentMode === "gpay" ? "Google Pay" : "Online"}</td></tr>
        <tr><th>Application Fee</th><td>${feeLabel(application.processFee)}</td></tr>
      </tbody></table>
      <h2>Infrastructure</h2>
      <table><thead><tr><th>Particulars</th><th>Rooms</th><th>Seats</th><th>Area</th></tr></thead><tbody>${rows}</tbody></table>
      
      ${application.paymentScreenshot ? `
        <h2>Payment Proof</h2>
        <div style="text-align:center; margin-top:20px; border:1px solid #ddd; padding:10px; border-radius:8px;">
          <img src="${application.paymentScreenshot}" style="max-width:100%; max-height:500px; object-contain:contain;" />
        </div>
      ` : ""}

      <script>window.onload=()=>{ window.print(); window.onafterprint=()=>window.close(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleQrUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleQrSave = async () => {
    if (!qrPreview || !authUser) return;
    setQrSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: "qr_code", value: qrPreview }),
      });
      const data = (await res.json()) as { message: string };
      if (!res.ok) { showToast("error", data.message); return; }
      showToast("success", "QR Code saved successfully! It will appear on all payment receipts.");
    } catch {
      showToast("error", "Failed to save QR code.");
    } finally {
      setQrSaving(false);
    }
  };

  const handleQrRemove = async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setQrPreview(null);
    await apiFetch("/api/admin/settings", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "qr_code", value: "" }),
    });
    showToast("success", "QR code removed.");
  };

  const handleSigUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSigPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSigSave = async () => {
    if (!sigPreview || !authUser) return;
    setSigSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: "auth_signature", value: sigPreview }),
      });
      const data = (await res.json()) as { message: string };
      if (!res.ok) { showToast("error", data.message); return; }
      showToast("success", "Signature saved successfully! It will appear on issued certificates / documents.");
    } catch {
      showToast("error", "Failed to save signature.");
    } finally {
      setSigSaving(false);
    }
  };

  const handleSigRemove = async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setSigPreview(null);
    await apiFetch("/api/admin/settings", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "auth_signature", value: "" }),
    });
    showToast("success", "Signature removed.");
  };

  const handleBgUpload = async (e: ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    setBgSaving(key);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await apiFetch("/api/admin/settings/backgrounds", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key, value: base64 })
        });
        const data = await res.json();
        if (res.ok) {
          setBgs(prev => ({ ...prev, [key]: base64 }));
          showToast("success", `${key.replace('_', ' ').toUpperCase()} background updated.`);
        } else {
          showToast("error", data.message || "Upload failed");
        }
      } catch (err) { showToast("error", "Failed to save background"); }
      finally { setBgSaving(null); }
    };
    reader.readAsDataURL(file);
  };

  const handleBgRemove = async (key: string) => {
    if (!confirm("Are you sure?") || !authUser) return;
    setBgSaving(key);
    try {
      const res = await apiFetch("/api/admin/settings/backgrounds?key=" + key, { 
        method: "DELETE",
      });
      if (res.ok) {
        setBgs(prev => ({ ...prev, [key]: "" }));
        showToast("success", "Background removed.");
      }
    } catch (err) { showToast("error", "Failed to remove background"); }
    finally { setBgSaving(null); }
  };

  const updateFeePlan = (index: number, field: keyof FeeOption, value: string) => {
    setFeePlans((prev) => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const addFeePlan = () => {
    setFeePlans((prev) => [...prev, { value: "", label: "" }]);
  };

  const removeFeePlan = (index: number) => {
    setFeePlans((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFeePlansSave = async () => {
    const validPlans = feePlans
      .map((plan) => ({ value: plan.value.trim(), label: plan.label.trim() }))
      .filter((plan) => plan.value && plan.label);

    if (validPlans.length === 0 || !authUser) {
      setFeeSaveMsg({ type: "error", text: "Please add at least one valid fee plan." });
      return;
    }

    setFeeSaving(true);
    setFeeSaveMsg(null);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: SETTINGS_PROCESS_FEE_KEY, value: JSON.stringify(validPlans) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeeSaveMsg({ type: "error", text: data.message || "Failed to save fee plans." });
        return;
      }

      setFeePlans(validPlans);
      setFeeSaveMsg({ type: "success", text: "Affiliation fee plans saved successfully." });
      showToast("success", "Affiliation fee plans saved successfully.");
    } catch {
      setFeeSaveMsg({ type: "error", text: "Unable to save fee plans." });
    } finally {
      setFeeSaving(false);
    }
  };



  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!passData.old || !passData.new || !authUser) { showToast("error", "All password fields are required."); return; }
    if (passData.new !== passData.confirm) { showToast("error", "New passwords do not match."); return; }
    if (passData.new.length < 6) { showToast("error", "Password must be at least 6 characters."); return; }
    
    setPassSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings/password", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword: passData.old, newPassword: passData.new }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.message || "Failed to change password."); return; }
      showToast("success", "Password changed successfully!");
      setPassData({ old: "", new: "", confirm: "" });
    } catch { showToast("error", "Error changing password."); }
    finally { setPassSaving(false); }
  };

  const handleResultApproval = async (examId: string, status: "published" | "appeared") => {
    if (!sessionReady || authLoading || !authUser) return;
    try {
      const res = await apiFetch("/api/admin/exams/approve-result", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ examId, status, marksheet: true, certificate: true })
      });
      if (res.ok) {
        alert("Result Submitted Successfully");
        setShowReleaseModal(false);
        void fetchPendingResults();
      }
    } catch { showToast("error", "Action failed"); }
  };

  const handleLogout = async () => {
    await authLogout();
  };

  const districts = appStateFilter ? DISTRICTS_BY_STATE[appStateFilter] || [] : [];

  const filtered = applications.filter((app) => {
    // Status Filter
    if (filterStatus !== "all") {
      if (filterStatus === "disabled" && !(app.status === "approved" && app.userStatus === "disabled")) return false;
      if (filterStatus === "approved" && !(app.status === "approved" && app.userStatus === "active")) return false;
      if (filterStatus !== "disabled" && filterStatus !== "approved" && app.status !== filterStatus) return false;
    }
    
    // Search Filter
    if (appSearch) {
      const s = appSearch.toLowerCase();
      const match = app.trainingPartnerName.toLowerCase().includes(s) || 
                  app.email.toLowerCase().includes(s) || 
                  app.mobile.includes(s) ||
                  (app.tpCode && app.tpCode.toLowerCase().includes(s));
      if (!match) return false;
    }

    // Location Filter
    if (appStateFilter && app.state !== appStateFilter) return false;
    if (appDistrictFilter && app.district !== appDistrictFilter) return false;

    return true;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved" && a.userStatus === "active").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    disabled: applications.filter((a) => a.status === "approved" && a.userStatus === "disabled").length,
  };

  const filteredCenters = applications.filter((a) => {
    if (centerFilter === "all") return true;
    if (centerFilter === "disabled") return a.userStatus === "disabled";
    return a.status === centerFilter;
  });
  const centerCounts = counts; // They follow the same logic as dashboard counts for applications

  const filteredStudents = students.filter((s) => {
    if (studentFilter === "all") return true;
    if (studentFilter === "disabled") return s.userStatus === "disabled";
    if (studentFilter === "approved") return s.status === "approved" || s.status === "active";
    if (studentFilter === "pending") return s.status === "pending" || s.status === "pending_admin";
    return s.status === studentFilter;
  });
  const studentCounts = {
    all: students.length,
    pending: students.filter((s) => s.status === "pending" || s.status === "pending_admin").length,
    approved: students.filter((s) => s.status === "approved" || s.status === "active").length,
    rejected: students.filter((s) => s.status === "rejected").length,
    disabled: students.filter((s) => s.userStatus === "disabled").length,
  };

  const statusBadge = (status: Application["status"]) => {
    const map = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-900/10 text-red-900 border-red-800",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status]}`}>
        {status === "pending" && <Clock className="w-3 h-3" />}
        {status === "approved" && <CheckCircle className="w-3 h-3" />}
        {status === "rejected" && <XCircle className="w-3 h-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const tabLabel: Record<Tab, string> = {
    dashboard: "Admin Dashboard",
    create: "Create ATC Application",
    courses: "Course Management",
    questionSets: "Exam Sets",
    centers: "Manage Centers",
    examRequests: "Exam Requests",
    materials: "Study Materials",
    settings: "Panel Settings",
    registration: "Registration Settings",
    students: "Manage Students",
    resultReview: "Certificate Authorize",
    fees: "Fee Management",
    backgrounds: "Background Templates",
  };

  const tabDesc: Record<Tab, string> = {
    dashboard: "Comprehensive overview of ATC applications and system metrics",
    create: "Manually create an ATC application as admin",
    courses: "Define and manage courses by zones",
    questionSets: "Build question sets and populate the exam bank",
    centers: "View and manage status of approved ATC centers",
    examRequests: "Manage online/offline exam requests and results",
    materials: "Upload and manage course study resources",
    settings: "General Configurations",
    registration: "ID Generation Logic",
    students: "Review and approve student registrations from all centers",
    resultReview: "Authorize ATC submitted results and release marksheet/certificate after review",
    fees: "Collect or return fees, view transaction history, and generate receipts for students",
    backgrounds: "Upload backgrounds for ID Cards, Certificates, and Marksheets",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <title>Admin Panel | {brandName}</title>
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 sm:max-w-md px-5 py-4 rounded-2xl shadow-2xl text-sm font-semibold transition-all ${toastMsg.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toastMsg.text}
        </div>
      )}

      <div className="flex min-h-screen relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#0a0a2e] to-[#0a0aa1] text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm leading-tight truncate">{brandName}</p>
                <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest">Admin Panel</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <XCircle className="w-5 h-5 text-blue-200" />
            </button>
          </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {[
                { id: "dashboard" as Tab, icon: Monitor, label: "Dashboard", badge: counts.pending },
                { id: "centers" as Tab, icon: ShieldCheck, label: "Manage Centers" },
                { id: "students" as Tab, icon: Users, label: "Manage Students" },
                { id: "examRequests" as Tab, icon: Layers, label: "Exam Requests" },
                { id: "questionSets" as Tab, icon: BookOpen, label: "Exam Sets" },
                { id: "materials" as Tab, icon: FileText, label: "Study Materials" },
                { id: "fees" as Tab, icon: CreditCard, label: "Fee Management" },
                { id: "courses" as Tab, icon: BookOpen, label: "Courses" },
                { id: "resultReview" as Tab, icon: ClipboardCheck, label: "Certificate Authorize", badge: pendingResults.length },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === item.id ? "bg-white/20 text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.badge ? (
                    <span className="ml-auto bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                  ) : null}
                </button>
              ))}

              {/* Collapsable Settings Menu */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleMenu("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "settings" || tab === "registration" ? "text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                  <ChevronDown className={`ml-auto w-3.5 h-3.5 transition-transform ${expandedMenus.includes("settings") ? "rotate-180" : ""}`} />
                </button>
                
                {expandedMenus.includes("settings") && (
                  <div className="pl-6 space-y-1 animate-in slide-in-from-top duration-200">
                     <button
                       onClick={() => { setTab("settings"); setIsSidebarOpen(false); }}
                       className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition ${tab === "settings" ? "bg-white/10 text-white" : "text-blue-200 hover:text-white"}`}
                     >
                       <Monitor className="w-3.5 h-3.5" />
                       General
                     </button>
                     <button
                       onClick={() => { setTab("registration"); setIsSidebarOpen(false); }}
                       className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition ${tab === "registration" ? "bg-white/10 text-white" : "text-blue-200 hover:text-white"}`}
                     >
                       <Hash className="w-3.5 h-3.5" />
                       Registration
                     </button>
                     <button
                       onClick={() => { setTab("backgrounds"); setIsSidebarOpen(false); }}
                       className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition ${tab === "backgrounds" ? "bg-white/10 text-white" : "text-blue-200 hover:text-white"}`}
                     >
                       <Layers className="w-3.5 h-3.5" />
                       Add Background
                     </button>
                  </div>
                )}
              </div>
            </nav>

          <div className="px-4 py-6 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-3 lg:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition">
                <Menu className="w-6 h-6 text-slate-700" />
              </button>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-700" />
                <span className="font-bold text-slate-800 text-sm">Admin</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-slate-800">{tabLabel[tab]}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{tabDesc[tab]}</p>
            </div>
            {/* Mobile context - show current tab title */}
            <div className="lg:hidden flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
               <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{tabLabel[tab]}</span>
            </div>
            <button onClick={handleLogout} className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </header>

          <div className="flex-1 p-6">
            {/* ── DASHBOARD TAB ── */}
            {tab === "dashboard" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Center Stats */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 bg-[#0a0aa1] rounded-full" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">ATC Center Metrics</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Total Centers", count: counts.all, icon: Building2, color: "blue" },
                      { label: "Pending ATC", count: counts.pending, icon: Clock, color: "amber" },
                      { label: "Approved ATC", count: counts.approved, icon: ShieldCheck, color: "green" },
                      { label: "Rejected ATC", count: counts.rejected, icon: XCircle, color: "red" },
                      { label: "Disabled ATC", count: counts.disabled, icon: ShieldAlert, color: "slate" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color === 'red' ? 'bg-red-900/10' : `bg-${stat.color}-50`} group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`w-6 h-6 ${stat.color === 'red' ? 'text-red-900' : `text-${stat.color}-600`}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-black tracking-tighter ${stat.color === 'red' ? 'text-red-900' : 'text-slate-800'}`}>{stat.count}</p>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${stat.color === 'red' ? 'text-red-900/60' : 'text-slate-400'}`}>{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Student Stats */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Student Registration Metrics</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Total Students", count: studentCounts.all, icon: Users, color: "blue" },
                      { label: "Pending Review", count: studentCounts.pending, icon: Clock, color: "amber" },
                      { label: "Approved Students", count: studentCounts.approved, icon: CheckCircle, color: "green" },
                      { label: "Rejected Students", count: studentCounts.rejected, icon: XCircle, color: "red" },
                      { label: "Disabled Students", count: studentCounts.disabled, icon: ShieldAlert, color: "slate" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color === 'red' ? 'bg-red-900/10' : `bg-${stat.color}-50`} group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`w-6 h-6 ${stat.color === 'red' ? 'text-red-900' : `text-${stat.color}-600`}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-black tracking-tighter ${stat.color === 'red' ? 'text-red-900' : 'text-slate-800'}`}>{stat.count}</p>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${stat.color === 'red' ? 'text-red-900/60' : 'text-slate-400'}`}>{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "fees" && <FeeManager role="admin" />}

            {/* ── CREATE TAB ── */}
            {tab === "create" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Application Form For Authorized Training Center</h3>
                <AdminAtcForm
                  mode={prefillApplication ? "edit" : "create"}
                  applicationId={prefillApplication?._id}
                  initialData={prefillApplication ?? undefined}
                  onCancel={() => setPrefillApplication(null)}
                  onSuccess={() => {
                    setPrefillApplication(null);
                    setTab("centers");
                    void fetchApplications();
                  }}
                />
              </div>
            )}

            {/* ── COURSES TAB ── */}
            {tab === "courses" && <CourseManager />}

            {/* ── EXAM SETS TAB ── */}
            {tab === "questionSets" && <ExamSetManager role="admin" />}

            {/* ── MANAGE CENTERS TAB ── */}
            {tab === "centers" && (
              <div className="space-y-4 animate-in fade-in duration-300">


                 {/* Tab Selection & Bulk Row */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                       <div className="flex items-center gap-2 mr-4 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-[#0a0aa1] focus:ring-[#0a0aa1]"
                            checked={filtered.length > 0 && selectedApps.length === filtered.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedApps(filtered.map(a => a._id));
                              else setSelectedApps([]);
                            }}
                          />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select All</span>
                       </div>
                       {(["all", "pending", "approved", "rejected", "disabled"] as const).map((s) => (
                         <button key={s} onClick={() => setFilterStatus(s)}
                           className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterStatus === s ? "bg-[#0a0aa1] text-white border-[#0a0aa1] shadow-lg shadow-blue-100" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                           {s} ({counts[s]})
                         </button>
                       ))}
                    </div>
                    <button 
                      onClick={() => {
                        setPrefillApplication(null);
                        setTab("create");
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                    >
                      <PlusCircle className="w-4 h-4" /> New Center
                    </button>
                 </div>

                 {/* Application Bulk Actions Bar */}
                 {selectedApps.length > 0 && (
                   <div className="bg-[#0a0aa1] px-6 py-4 rounded-3xl flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-2xl shadow-blue-200">
                     <div className="flex items-center gap-4 text-white">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">{selectedApps.length}</div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">Centers Selected</p>
                          <p className="text-[10px] text-blue-200 font-bold">Perform bulk actions on selection</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                         {applications.filter(a => selectedApps.includes(a._id) && a.status === "pending").length > 0 && (
                           <>
                             <button onClick={() => handleBulkAction("centers", "approve")} className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Approve Select</button>
                             <button onClick={() => handleBulkAction("centers", "reject")} className="px-5 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-500/20">Reject Select</button>
                           </>
                         )}
                         {applications.filter(a => selectedApps.includes(a._id) && a.status === "approved").length > 0 && (
                           <>
                             <button onClick={() => handleBulkAction("centers", "enable")} className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Enable Select</button>
                             <button onClick={() => handleBulkAction("centers", "disable")} className="px-5 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-500/20">Disable Select</button>
                           </>
                         )}
                         <button onClick={() => setSelectedApps([])} className="px-5 py-2 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition">Cancel</button>
                     </div>
                   </div>
                 )}

                {/* List of Applications (The Nice Card Style from Dashboard) */}
                {loading ? (
                  <div className="flex items-center justify-center py-24 bg-white rounded-3xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold uppercase tracking-wider">No {filterStatus !== "all" ? filterStatus : ""} centers found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtered.map((app) => (
                      <div key={app._id} className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 px-6 py-5">
                          <div className="shrink-0 flex items-center pr-2">
                             <input 
                               type="checkbox" 
                               className="w-5 h-5 rounded border-slate-300 text-[#0a0aa1] focus:ring-[#0a0aa1] cursor-pointer"
                               checked={selectedApps.includes(app._id)}
                               onChange={(e) => {
                                 if (e.target.checked) setSelectedApps(prev => [...prev, app._id]);
                                 else setSelectedApps(prev => prev.filter(id => id !== app._id));
                               }}
                             />
                          </div>
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                            {app.logo ? <img src={app.logo} alt="" className="w-10 h-10 object-contain" /> : <ShieldCheck className="w-7 h-7 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="font-black text-slate-800 text-lg tracking-tight uppercase">{app.trainingPartnerName}</h4>
                              {app.submittedByAdmin && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-black uppercase border border-purple-200">Admin Created</span>
                              )}
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${app.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : app.status === "pending" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                                {app.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight flex flex-wrap gap-x-4">
                              <span>{app.email}</span>
                              <span>{app.mobile}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {app.district}, {app.state}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 uppercase tracking-wider">
                                {feeLabel(app.processFee)}
                              </span>
                              {app.tpCode && (
                                <span className="px-3 py-1 bg-slate-800 text-white rounded-lg font-black text-[11px] tracking-widest shadow-sm">
                                  ID: {app.tpCode}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                            {app.status !== "approved" && (
                                <button onClick={() => handleAction(app._id, "approve")} disabled={actionLoading !== null}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 transition shadow-lg shadow-emerald-100 disabled:opacity-50">
                                  Approve
                                </button>
                            )}
                            {app.status !== "rejected" && app.status !== "approved" && (
                                <button onClick={() => handleAction(app._id, "reject")} disabled={actionLoading !== null}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-red-500 transition shadow-lg shadow-red-100 disabled:opacity-50">
                                  Reject
                                </button>
                            )}
                            {app.status === "approved" && (
                              <button
                                disabled={actionLoading === app._id + "toggleStatus"}
                                onClick={() => handleAction(app._id, "toggleStatus")}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition active:scale-95 ${app.userStatus === "active" ? "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"}`}
                              >
                                {app.userStatus === "active" ? "Disable Center" : "Enable Center"}
                              </button>
                            )}
                            <button type="button" onClick={() => openApplicationForCreateEdit(app)}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition">
                              Edit
                            </button>
                            <button type="button" onClick={() => printApplication(app)}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition">
                              Print
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                {editingApplication && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-white/20">
                      <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-slate-50/50">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase">Edit ATC Application</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Modify center details and credentials</p>
                        </div>
                        <button type="button" onClick={closeApplicationEditor} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition shadow-sm">
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <AdminAtcForm
                          mode="edit"
                          applicationId={editingApplication._id}
                          initialData={editingApplication}
                          onCancel={closeApplicationEditor}
                          onSuccess={async () => {
                            closeApplicationEditor();
                            await fetchApplications();
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── EXAM REQUESTS TAB ── */}
            {tab === "examRequests" && <ExamRequestManager role="admin" />}

            {/* ── STUDY MATERIALS TAB ── */}
            {tab === "materials" && <StudyMaterialManager role="admin" />}

            {/* ── RESULT REVIEW TAB ── */}
            {tab === "resultReview" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Result Approval Queue</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Review and authorize student exam results submitted by centers</p>
                  </div>
                  <button onClick={fetchPendingResults} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${resultsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {selectedResults.length > 0 && (
                   <div className="bg-amber-600 px-6 py-3 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-lg shadow-amber-100">
                      <div className="flex items-center gap-4 text-white text-xs font-bold">
                         <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedResults.length}</div>
                         <span className="uppercase tracking-widest">Results Selected</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={async () => {
                             if (!confirm(`Approve and generate documents for ${selectedResults.length} students?`)) return;
                             setResultsLoading(true);
                             try {
                               for (const id of selectedResults) {
                                 await apiFetch("/api/admin/exams/approve-result", {
                                   method: "POST",
                                   headers: { 
                                     "Content-Type": "application/json",
                                   },
                                   body: JSON.stringify({ examId: id, status: "published" }),
                                 });
                               }
                               setSelectedResults([]);
                               await fetchPendingResults();
                             } catch { showToast("error", "Bulk approval failed"); }
                             finally { setResultsLoading(false); }
                           }} 
                           className="px-5 py-2 rounded-xl bg-white text-amber-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition"
                         >
                           Approve Selective
                         </button>
                         <button onClick={() => setSelectedResults([])} className="px-5 py-2 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition">Cancel</button>
                      </div>
                   </div>
                )}

                {resultsLoading ? (
                  <div className="p-20 flex flex-col items-center gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
                    <p className="text-sm font-black text-slate-400 uppercase">Fetching pending reviews...</p>
                  </div>
                ) : pendingResults.length === 0 ? (
                  <div className="p-20 flex flex-col items-center gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                      <CheckCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Clean Queue</h3>
                      <p className="text-slate-400 text-sm">All submitted results have been processed.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center px-6 py-2 bg-slate-50/50 rounded-xl border border-slate-100">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            checked={pendingResults.length > 0 && selectedResults.length === pendingResults.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedResults(pendingResults.map(r => r._id));
                              else setSelectedResults([]);
                            }}
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition">Select All Pending Results</span>
                       </label>
                    </div>
                    {pendingResults.map((res) => (
                      <div key={res._id} className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-amber-200 transition-all group ${selectedResults.includes(res._id) ? 'bg-amber-50/20 border-amber-200' : ''}`}>
                         <div className="shrink-0 flex items-center pr-2">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              checked={selectedResults.includes(res._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedResults(prev => [...prev, res._id]);
                                else setSelectedResults(prev => prev.filter(id => id !== res._id));
                              }}
                            />
                         </div>
                         <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                            {res.studentId?.photo ? <img src={res.studentId.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-8 h-8 m-4 text-slate-300" />}
                         </div>
                         <div className="flex-grow space-y-1">
                            <div className="flex items-center gap-3">
                               <h4 className="font-bold text-slate-800 text-lg">{res.studentId?.name || "Unknown Student"}</h4>
                               <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase border border-blue-100">{res.studentId?.registrationNo}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-400 uppercase tracking-tight">
                               <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {res.atcId?.trainingPartnerName} ({res.atcId?.tpCode})</span>
                               <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {res.studentId?.course}</span>
                               <span className="flex items-center gap-1.5 font-black text-amber-600 italic">Score: {res.totalScore} / 100 • Grade: {res.grade || '—'}</span>
                               {res.offlineExamCopy && (
                                 <button 
                                   onClick={() => {
                                     const win = window.open();
                                     const html = `<html><body style="margin:0"><embed src="${res.offlineExamCopy}" width="100%" height="100%" type="application/pdf"></body></html>`;
                                     win?.document.write(html);
                                   }}
                                   className="text-blue-600 font-black hover:underline"
                                 >
                                   View Exam Copy
                                 </button>
                               )}
                            </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                              onClick={() => handleResultApproval(res._id, "appeared")}
                              className="flex-grow md:flex-none px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-red-50 hover:text-red-600 transition"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleResultApproval(res._id, "published")}
                              className="flex-grow md:flex-none px-8 py-3 bg-amber-500 text-white rounded-xl text-xs font-black uppercase hover:bg-amber-600 transition shadow-lg shadow-amber-100"
                            >
                              Approve & Generate
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* ── SETTINGS TAB ── */}
            {tab === "settings" && (
              <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Global Brand Identity */}
                <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                      <Layout className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Global Brand Identity</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">Set the primary branding for your institution. This reflects on certificates, ID cards, and all portal titles.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Institution Brand Name</label>
                         <div className="relative group">
                            <input 
                              type="text" 
                              value={brandName}
                              onChange={(e) => setBrandName(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300"
                              placeholder="e.g. Yukti Computer Education"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition">
                              <Type className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Mobile Number</label>
                         <div className="relative group">
                            <input 
                              type="text" 
                              value={brandMobile}
                              onChange={(e) => setBrandMobile(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300"
                              placeholder="e.g. +91 9876543210"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition">
                              <Building2 className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Official Email Address</label>
                         <div className="relative group">
                            <input 
                              type="email" 
                              value={brandEmail}
                              onChange={(e) => setBrandEmail(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300"
                              placeholder="e.g. info@institution.com"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition">
                              <Mail className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Physical Address</label>
                         <div className="relative group">
                            <textarea 
                              value={brandAddress}
                              onChange={(e) => setBrandAddress(e.target.value)}
                              rows={2}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300 resize-none"
                              placeholder="e.g. 123, Main Street, City, State"
                            />
                            <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-40 transition">
                              <MapPin className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Website URL</label>
                         <div className="relative group">
                            <input 
                              type="text" 
                              value={brandUrl}
                              onChange={(e) => setBrandUrl(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300"
                              placeholder="e.g. www.yukti.in"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition">
                              <Monitor className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <button 
                        onClick={handleBrandSave}
                        disabled={brandSaving}
                        className="w-full group relative flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {brandSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 group-hover:scale-125 transition" />
                        )}
                        {brandSaving ? "Updating Identity..." : "Save Identity Settings"}
                      </button>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">Institution Logo (PNG/SVG)</label>
                        <div className="relative aspect-square max-w-[240px] mx-auto bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group hover:border-indigo-300 transition">
                            {brandLogo ? (
                                <div className="relative w-full h-full p-8">
                                    <img src={brandLogo} alt="Logo" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition">
                                            Change Logo
                                            <input type="file" accept="image/*" className="hidden" onChange={handleBrandLogoUpload} />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center gap-3 cursor-pointer p-10 text-center">
                                    <Upload className="w-10 h-10 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Global Logo</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleBrandLogoUpload} />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-tight">Recommended: Square logo with transparent background</p>
                    </div>
                  </div>
                </div>

                {/* QR Code Setting */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Payment QR Code</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Upload your Google Pay / UPI QR code. It will automatically appear on all applicant payment receipts.</p>
                    </div>
                  </div>

                  {/* QR Preview */}
                  {qrLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                    </div>
                  ) : qrPreview ? (
                    <div className="flex flex-col items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrPreview} alt="Payment QR Code" className="w-48 h-48 object-contain border-2 border-slate-200 rounded-xl shadow-sm" />
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> QR Code is set and active
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <QrCode className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No QR code uploaded yet</p>
                    </div>
                  )}

                  {/* Upload */}
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 cursor-pointer hover:bg-blue-100 transition">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">Click to upload QR image</span>
                      <span className="text-xs text-blue-500">PNG, JPG, WebP supported</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                    </label>

                    <div className="flex gap-3">
                      <button
                        onClick={handleQrSave}
                        disabled={!qrPreview || qrSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {qrSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {qrSaving ? "Saving..." : "Save QR Code"}
                      </button>
                      {qrPreview && (
                        <button
                          onClick={handleQrRemove}
                          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                    <strong>Tip:</strong> Upload your Google Pay UPI QR code image. Applicants will see this QR when they submit the Become ATC form, on their payment receipt.
                  </div>
                </div>



                {/* Affiliation Fee Plans */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Affiliation Fee Plans</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Manage the plan options shown to centers during application.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {feePlans.map((plan, index) => (
                      <div key={`${plan.value}-${index}`} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 sm:col-span-3">
                          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Amount</label>
                          <input
                            type="text"
                            value={plan.value}
                            onChange={(e) => updateFeePlan(index, "value", e.target.value.replace(/\D/g, ""))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            placeholder="2000"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-8">
                          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Label</label>
                          <input
                            type="text"
                            value={plan.label}
                            onChange={(e) => updateFeePlan(index, "label", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            placeholder="TP FOR 1 YEAR — Rs. 2000 + 18% GST (Total ₹2,360)"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => removeFeePlan(index)}
                            className="rounded-2xl border border-red-200 bg-white px-3 py-3 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addFeePlan}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Plan
                    </button>

                    {feeSaveMsg && (
                      <div className={`rounded-2xl px-4 py-3 text-sm ${feeSaveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {feeSaveMsg.text}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleFeePlansSave}
                        disabled={feeSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {feeSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {feeSaving ? "Saving..." : "Save Fee Plans"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
                    Tip: Add plan amount and the full display label. The selected plan will be shown to applicants and in receipts automatically.
                  </div>
                </div>

                {/* Signature Setting */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Authorized Signature</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Upload your authorized signature image (with transparent background). Used for certificates / documents.</p>
                    </div>
                  </div>

                  {/* Sig Preview */}
                  {sigLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="w-8 h-8 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    </div>
                  ) : sigPreview ? (
                    <div className="flex flex-col items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sigPreview} alt="Signature Preview" className="w-48 h-24 object-contain border-2 border-slate-200 rounded-xl shadow-sm bg-slate-50" />
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Signature is set and active
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <FileText className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No signature uploaded yet</p>
                    </div>
                  )}

                  {/* Upload */}
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 cursor-pointer hover:bg-purple-100 transition">
                      <Upload className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-700">Click to upload Signature image</span>
                      <span className="text-xs text-purple-500">PNG with transparent background recommended</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSigUpload} />
                    </label>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSigSave}
                        disabled={!sigPreview || sigSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {sigSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {sigSaving ? "Saving..." : "Save Signature"}
                      </button>
                      {sigPreview && (
                        <button
                          onClick={handleSigRemove}
                          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-xs text-purple-800">
                    <strong>Tip:</strong> Upload a clear image of your signature with a transparent background (.png format) for best results when overlaid onto certificates or official documents.
                  </div>
                </div>

                {/* Account Settings - Password Change */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Security & Password</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Change your admin login password to maintain account security.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Current Password</label>
                      <div className="relative">
                        <input 
                          type={showOldPass ? "text" : "password"} 
                          value={passData.old} 
                          onChange={e => setPassData(p => ({ ...p, old: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-red-100 transition" 
                          placeholder="Current" 
                        />
                        <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">New Password</label>
                      <div className="relative">
                        <input 
                          type={showNewPass ? "text" : "password"} 
                          value={passData.new} 
                          onChange={e => setPassData(p => ({ ...p, new: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-red-100 transition" 
                          placeholder="6+ characters" 
                        />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={passData.confirm} 
                        onChange={e => setPassData(p => ({ ...p, confirm: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-100 transition" 
                        placeholder="Repeat new password" 
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                       <button
                         type="submit"
                         disabled={passSaving}
                         className="px-8 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                       >
                         {passSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                         Update Admin Password
                       </button>
                    </div>
                  </form>

                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-800">
                    <strong>Warning:</strong> Changing your password will not log out other active sessions but will be required for next login. Keep it secure.
                  </div>
                </div>
              </div>
            )}

            {/* ── REGISTRATION SETTINGS TAB ── */}
            {tab === "registration" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Registration ID Formats */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase tracking-tight">Registration ID Formats</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Define how Center Codes and Student Roll Numbers are generated.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Center Format Card */}
                    <div className="space-y-4 p-5 rounded-3xl border border-slate-100 bg-slate-50/50">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Center ID Format</label>
                          <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-[8px] font-black uppercase">Preview</span>
                       </div>
                       
                       <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Prefix (Text before number)</label>
                            <input 
                              type="text" 
                              value={centerFormat.prefix} 
                              onChange={(e) => setCenterFormat(prev => ({ ...prev, prefix: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                              placeholder="e.g. ATC-"
                            />
                            <p className="text-[8px] text-slate-400 mt-1 italic">Tip: Use <strong>{`{YEAR}`}</strong> in prefix for automatic current year.</p>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Internal Counter (Current Value)</label>
                            <input 
                              type="number" 
                              value={centerFormat.counter} 
                              onChange={(e) => setCenterFormat(prev => ({ ...prev, counter: parseInt(e.target.value) || 1 }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                              placeholder="1"
                            />
                          </div>
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Generated Sample</p>
                             <p className="text-xl font-black text-blue-700 tracking-tighter">
                               {centerFormat.prefix.replace("{YEAR}", new Date().getFullYear().toString())}{String(centerFormat.counter).padStart(centerFormat.padding, "0")}
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Student Format Card */}
                    <div className="space-y-4 p-5 rounded-3xl border border-slate-100 bg-slate-50/50">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Student ID Format</label>
                          <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-[8px] font-black uppercase">Preview</span>
                       </div>
                       
                       <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Prefix (Text before number)</label>
                            <input 
                              type="text" 
                              value={studentFormat.prefix} 
                              onChange={(e) => setStudentFormat(prev => ({ ...prev, prefix: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-100 outline-none"
                              placeholder="e.g. ATC-ST-26-"
                            />
                            <p className="text-[8px] text-slate-400 mt-1 italic">Tip: Use <strong>{`{YEAR}`}</strong> in prefix for automatic current year.</p>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Internal Counter (Current Value)</label>
                            <input 
                              type="number" 
                              value={studentFormat.counter} 
                              onChange={(e) => setStudentFormat(prev => ({ ...prev, counter: parseInt(e.target.value) || 1 }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-100 outline-none"
                              placeholder="1"
                            />
                          </div>
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Generated Sample</p>
                             <p className="text-xl font-black text-purple-700 tracking-tighter">
                               {studentFormat.prefix.replace("{YEAR}", new Date().getFullYear().toString())}{String(studentFormat.counter).padStart(studentFormat.padding, "0")}
                             </p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      onClick={async () => {
                        setIdFormatSaving(true);
                        try {
                          await apiFetch("/api/admin/settings", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ key: "reg_format_center", value: JSON.stringify(centerFormat) }),
                          });
                          await apiFetch("/api/admin/settings", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ key: "reg_format_student", value: JSON.stringify(studentFormat) }),
                          });
                          showToast("success", "ID Formats updated successfully!");
                        } catch {
                          showToast("error", "Failed to save ID formats.");
                        } finally {
                          setIdFormatSaving(false);
                        }
                      }}
                      disabled={idFormatSaving}
                      className="px-8 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {idFormatSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {idFormatSaving ? "Saving..." : "Save ID Formats"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── BACKGROUND TEMPLATES TAB ── */}
            {tab === "backgrounds" && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    <Layers className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Background Templates (A4 Size)</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Upload high-quality A4 size background images for documents</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {[
                    { id: "id_front", label: "ID Front" },
                    { id: "id_back", label: "ID Back" },
                    { id: "certificate", label: "Certificate" },
                    { id: "marksheet", label: "Marksheet" },
                    { id: "admit_card", label: "Admit Card" },
                  ].map((item) => (
                    <div key={item.id} className="space-y-3">
                      <div className="relative aspect-[3.5/2] bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden group shadow-sm transition hover:border-purple-200">
                        {(bgs as any)[item.id] ? (
                          <>
                            <img src={(bgs as any)[item.id]} alt={item.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button onClick={() => handleBgRemove(item.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter leading-tight">{item.label}</p>
                          </div>
                        )}
                        {bgSaving === item.id && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="block">
                        <span className="sr-only">Upload {item.label}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleBgUpload(e, item.id)}
                          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition cursor-pointer"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 flex items-start gap-4">
                   <AlertTriangle className="w-5 h-5 text-purple-600 shrink-0" />
                   <div className="text-xs font-bold text-purple-800 uppercase tracking-wider space-y-1">
                      <p>Important: Upload only high-resolution JPG or PNG files.</p>
                      <p className="opacity-70">These backgrounds will be used for automated document generation for all centers.</p>
                   </div>
                </div>
              </div>
            )}

            {/* ── MANAGE STUDENTS TAB ── */}
            {tab === "students" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Student Filter Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  {(["all", "pending", "active", "rejected", "disabled"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStudentFilter(s as any)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        studentFilter === s
                          ? "bg-[#0a0aa1] text-white border-[#0a0aa1] shadow-lg shadow-blue-100 scale-105"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {s === "active" ? "Approved" : s} ({studentCounts[s === "active" ? "approved" : s] || 0})
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Bulk Actions Bar */}
                  {selectedStudents.length > 0 && (
                    <div className="bg-[#0a0aa1] px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-4 text-white text-xs font-bold">
                        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedStudents.length}</div>
                        <span className="uppercase tracking-widest">Students Selected</span>
                      </div>
                      <div className="flex items-center gap-3">
                         {students.filter(s => selectedStudents.includes(s._id) && s.status === "pending").length > 0 && (
                           <>
                             <button onClick={() => handleBulkAction("students", "approve")} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Approve Select</button>
                             <button onClick={() => handleBulkAction("students", "reject")} className="px-4 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase hover:bg-rose-600 transition shadow-lg shadow-rose-500/20">Reject Select</button>
                           </>
                         )}
                         {students.filter(s => selectedStudents.includes(s._id) && s.status === "active").length > 0 && (
                           <>
                             <button onClick={() => handleBulkAction("students", "enable")} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Enable Select</button>
                             <button onClick={() => handleBulkAction("students", "disable")} className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase hover:bg-amber-600 transition shadow-lg shadow-amber-500/20">Disable Select</button>
                           </>
                         )}
                         <button onClick={() => setSelectedStudents([])} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4 w-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-[#0a0aa1] focus:ring-[#0a0aa1]"
                            checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudents(filteredStudents.map(s => s._id));
                              else setSelectedStudents([]);
                            }}
                          />
                        </th>
                        <th className="px-6 py-4">REG NO / ID</th>
                        <th className="px-6 py-4">STUDENT IDENTITY</th>
                        <th className="px-6 py-4">CENTER</th>
                        <th className="px-6 py-4">COURSE</th>
                        <th className="px-6 py-4">FEE SUMMARY</th>
                        <th className="px-6 py-4 text-center">STATUS</th>
                        <th className="px-6 py-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentLoading ? (
                        <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">Loading students...</td></tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">No {studentFilter !== "all" ? studentFilter : ""} students found.</td></tr>
                      ) : (
                        filteredStudents.map((s) => (
                          <Fragment key={s._id}>
                            <tr className="hover:bg-slate-50 transition group">
                              <td className="px-6 py-4">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-300 text-[#0a0aa1] focus:ring-[#0a0aa1]"
                                  checked={selectedStudents.includes(s._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedStudents(prev => [...prev, s._id]);
                                    else setSelectedStudents(prev => prev.filter(id => id !== s._id));
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4">
                                 <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-200">
                                     {(s.registrationNo && !s.registrationNo.startsWith("PENDING-")) ? s.registrationNo : "PENDING"}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {s.photo ? (
                                    <img src={s.photo} alt={s.name} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200"><User className="w-5 h-5 text-slate-300" /></div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <p className="font-black text-slate-800 leading-none">{s.name}</p>
                                      {s.isDirectAdmission && (
                                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[8px] font-black uppercase border border-blue-200">Front</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                       S/o: {s.fatherName} • {s.mobile}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[11px] font-black uppercase text-slate-500">{s.tpCode}</td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-emerald-700">{s.course}</span>
                                    <span className="text-[9px] font-bold text-slate-400 capitalize">{s.session}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Fee: <span className="text-slate-700 font-black">₹{s.totalFee || s.admissionFees || 0}</span></p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Paid: <span className="text-emerald-600 font-black">₹{s.paidAmount || 0}</span></p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Remaining Dues: <span className={`${((s.totalFee || Number(s.admissionFees) || 0) - (s.paidAmount || 0)) > 0 ? "text-red-600" : "text-emerald-700"} font-black`}>₹{(s.totalFee || Number(s.admissionFees) || 0) - (s.paidAmount || 0)}</span></p>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                                  s.userStatus === "disabled" ? "bg-red-50 text-red-600 border-red-100" :
                                  (s.status === "active" || s.status === "approved") ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                  s.status === "rejected" ? "bg-red-50 text-red-600 border-red-100" : 
                                  "bg-amber-50 text-amber-600 border-amber-100"
                                }`}>
                                  {s.userStatus === "disabled" ? "Disabled Account" : 
                                   (s.status === "active" || s.status === "approved") ? "Approved" : 
                                   s.status === "pending_admin" ? "Awaiting Final Approval" : s.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <div className="flex flex-col gap-1 items-end">
                                    <div className="flex gap-2">
                                      {(s.status !== "approved" && s.status !== "active" || !s.registrationNo) && (
                                        <button 
                                          onClick={() => handleStudentAction(s._id, "approved")} 
                                          disabled={!!studentActionId}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                                        >
                                          {(!s.registrationNo && (s.status === "active" || s.status === "approved")) ? "Assign ID" : "Approve"}
                                        </button>
                                      )}
                                      {s.status === "pending" && (
                                        <button 
                                          onClick={() => handleStudentAction(s._id, "rejected")} 
                                          disabled={!!studentActionId}
                                          className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase hover:bg-red-700 transition shadow-lg shadow-red-200"
                                        >
                                          Reject
                                        </button>
                                      )}
                                      <button onClick={() => handleStudentAction(s._id, "toggleStatus")} 
                                        className={`px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase transition ${s.userStatus === "disabled" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}`}>
                                        {s.userStatus === "disabled" ? "Enable" : "Disable"}
                                      </button>

                                      <button 
                                          onClick={() => setViewIdCard(s)}
                                          className="p-2 rounded-xl bg-[#0a0aa1] text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                                          title="View ID Card"
                                       >
                                         <CreditCard className="w-3.5 h-3.5" />
                                       </button>

                                       <button 
                                          onClick={() => {
                                            const studentData = { ...s };
                                            if (false) {
                                              studentData.password = "";
                                            }
                                            setEditingStudent(s);
                                            setStudentEditValues(studentData);
                                          }} 
                                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                          title="Edit Details"
                                       >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>

                          </Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        {/* ── STUDENT EDIT MODAL ── */}
        {editingStudent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in duration-300">
               <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Student Command Center</h3>
                  <p className="text-[10px] text-blue-600 uppercase tracking-widest font-black mt-1">Reg No: {editingStudent.registrationNo}</p>
                </div>
                <div className="flex gap-3">
                   <button 
                     type="button" 
                     onClick={() => {
                        window.print();
                     }}
                     className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition no-print"
                   >
                     <Printer className="w-4 h-4" /> Print Profile
                   </button>
                   <button type="button" onClick={() => setEditingStudent(null)} className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition shadow-sm">
                     <XCircle className="w-6 h-6" />
                   </button>
                </div>
              </div>
              <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Printable Profile hidden here, moved to root for better print handling */}



                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await apiFetch(`/api/admin/students/${editingStudent._id}`, {
                      method: "PATCH",
                      headers: { 
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ action: "updateDetails", updateData: studentEditValues }),
                    });
                    if (!res.ok) throw new Error("Update failed");
                    showToast("success", "Student details updated successfully");
                    setEditingStudent(null);
                    await fetchStudents();
                  } catch {
                    showToast("error", "Failed to update student");
                  }
                }}>
                  {[
                    { label: "Full Name", key: "name" },
                    { label: "Father Name", key: "fatherName" },
                    { label: "Mother Name", key: "motherName" },
                    { label: "Email Address", key: "email" },
                    { label: "Mobile Number", key: "mobile" },
                    { label: "Parents/Emergency Mobile", key: "parentsMobile" },
                    { label: "Aadhar Number", key: "aadharNo" },
                    { label: "Course Name", key: "course" },
                    { label: "Date of Birth", key: "dob" },
                    { label: "Gender", key: "gender" },
                    { label: "Category", key: "category" },
                    { label: "Religion", key: "religion" },
                    { label: "Nationality", key: "nationality" },
                    { label: "Session", key: "session" },
                    { label: "Marital Status", key: "maritalStatus" },
                    { label: "Course Type", key: "courseType" },
                    { label: "Highest Qualification", key: "highestQualification" },
                    { label: "Total Fee", key: "admissionFees" },
                    { label: "Admission Date", key: "admissionDate" },
                    { label: "Referred By", key: "referredBy" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">{field.label}</label>
                      <input 
                        type="text" 
                        value={studentEditValues[field.key] || ""} 
                        onChange={(e) => setStudentEditValues((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                      />
                    </div>
                  ))}

                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Student Password</label>
                    <input 
                      type="text" 
                      value={studentEditValues.password || ""} 
                      onChange={(e) => setStudentEditValues((prev: any) => ({ ...prev, password: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                      placeholder="Enter student password"
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Current Address</label>
                        <textarea 
                          value={studentEditValues.currentAddress || ""} 
                          onChange={(e) => setStudentEditValues((prev: any) => ({ ...prev, currentAddress: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition h-24"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Permanent Address</label>
                        <textarea 
                          value={studentEditValues.permanentAddress || ""} 
                          onChange={(e) => setStudentEditValues((prev: any) => ({ ...prev, permanentAddress: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition h-24"
                        />
                     </div>
                  </div>

                  <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                     <p className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                       <FileText className="w-4 h-4 text-blue-600" /> Documents & Uploads
                     </p>
                     <div className="flex flex-wrap gap-4">
                        {[
                          { label: "Photo", key: "photo", val: editingStudent.photo },
                          { label: "Signature", key: "studentSignature", val: editingStudent.studentSignature },
                          { label: "Qualification", key: "qualificationDoc", val: editingStudent.qualificationDoc },
                          { label: "Aadhar", key: "aadharDoc", val: editingStudent.aadharDoc },
                          { label: "Other Docs", key: "otherDocs", val: editingStudent.otherDocs },
                        ].map(d => (
                          <div key={d.label} className="flex flex-col gap-1.5">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{d.label}</p>
                            <label className="w-24 h-32 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative group shadow-sm hover:border-blue-400 transition cursor-pointer">
                              {studentEditValues[d.key]?.includes("data:") || studentEditValues[d.key]?.startsWith("http") ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={studentEditValues[d.key]} alt={d.label} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 p-2">
                                    <Upload className="w-5 h-5" />
                                    <span className="text-[7px] font-black uppercase text-center">Click to Upload</span>
                                </div>
                              )}
                              <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.readAsDataURL(file);
                                  reader.onload = () => {
                                    setStudentEditValues((prev: any) => ({ ...prev, [d.key]: reader.result }));
                                  };
                                }} 
                              />
                              <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
                            </label>
                            {studentEditValues[d.key] && (
                               <a href={studentEditValues[d.key]} target="_blank" className="text-[8px] font-bold text-blue-600 hover:underline uppercase text-center">View Full</a>
                            )}
                          </div>
                        ))}
                     </div>
                   </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <button type="button" onClick={() => setEditingStudent(null)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition">Cancel</button>
                    <button type="submit" className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>
        {/* ID CARD VIEW MODAL */}

        {viewIdCard && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header with Close */}
                <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Identity Preview</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reviewing ID Card for {viewIdCard.name}</p>
                   </div>
                   <button 
                     onClick={() => setViewIdCard(null)} 
                     className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm"
                   >
                     <XCircle className="w-6 h-6" />
                   </button>
                </div>
                
                {/* Preview Area with Scaling for better fit */}
                <div className="p-4 md:p-8 max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50/30">
                   <div className="origin-top transform scale-[0.7] sm:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform">
                      <StudentIdCard 
                        student={{
                          ...viewIdCard,
                          registrationNo: viewIdCard.registrationNo || "PENDING",
                          tpCode: viewIdCard.tpCode || "PENDING",
                          dob: viewIdCard.dob || "N/A",
                          admissionDate: viewIdCard.createdAt ? new Date(viewIdCard.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A",
                          centerName: applications.find(a => a.tpCode === viewIdCard.tpCode)?.trainingPartnerName || "N/A",
                          centerAddress: applications.find(a => a.tpCode === viewIdCard.tpCode)?.trainingPartnerAddress || "N/A",
                          centerMobile: applications.find(a => a.tpCode === viewIdCard.tpCode)?.mobile || "N/A",
                          centerSign: applications.find(a => a.tpCode === viewIdCard.tpCode)?.signature || "",
                        }} 
                        backgrounds={{
                          front: bgs.id_front,
                          back: bgs.id_back
                        }}
                      />
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ── PRINTABLE PROFILE SECTION ── */}
        {editingStudent && (
          <div id="printable-student-profile" className="hidden print:block bg-white text-slate-900 p-0 m-0 w-[210mm] min-h-[297mm]">
              <div className="p-10 flex flex-col min-h-[297mm]">
                  {/* Header Section */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                      <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-slate-900 flex items-center justify-center p-2.5 rounded-2xl">
                              <div className="w-full h-full border border-white/20 rounded-lg flex items-center justify-center font-black text-white text-xl italic">YCE</div>
                          </div>
                          <div>
                              <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-slate-900">Student Academic Record</h1>
                              <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1.5 italic">{brandName} • ISO Certified</p>
                              <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  <span>Admission Report</span>
                                  <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                                  <span>Reg No: {editingStudent.registrationNo}</span>
                              </div>
                          </div>
                      </div>
                      <div className="w-28 h-36 bg-slate-50 border-2 border-slate-900 p-0.5">
                          {studentEditValues.photo ? (
                              <img src={studentEditValues.photo} className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 text-[6px] font-black uppercase text-center p-2 border border-dashed border-slate-200">
                                  Photo Not Provided
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                      {/* Left Column */}
                      <div className="space-y-6">
                          <section>
                              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-100 pb-1 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Personal Information
                              </h2>
                              <div className="space-y-3 px-2">
                                  <PrintField label="Full Name" value={studentEditValues.name} />
                                  <PrintField label="Father's Name" value={studentEditValues.fatherName} />
                                  <PrintField label="Mother's Name" value={studentEditValues.motherName} />
                                  <div className="grid grid-cols-2 gap-4">
                                      <PrintField label="Date of Birth" value={studentEditValues.dob} />
                                      <PrintField label="Gender" value={studentEditValues.gender} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <PrintField label="Category" value={studentEditValues.category} />
                                      <PrintField label="Religion" value={studentEditValues.religion} />
                                  </div>
                              </div>
                          </section>

                          <section>
                              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-100 pb-1 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Contact Details
                              </h2>
                              <div className="space-y-3 px-2">
                                  <PrintField label="Mobile Number" value={studentEditValues.mobile} />
                                  <PrintField label="Emergency Contact" value={studentEditValues.parentsMobile} />
                                  <PrintField label="Email Address" value={studentEditValues.email} />
                              </div>
                          </section>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                          <section>
                              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-100 pb-1 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Academic Details
                              </h2>
                              <div className="space-y-3 px-2">
                                  <PrintField label="Course Enrolled" value={studentEditValues.course} />
                                  <PrintField label="Center Code" value={editingStudent.tpCode} />
                                  <PrintField label="Academic Session" value={studentEditValues.session} />
                                  <PrintField label="Course Type" value={studentEditValues.courseType} />
                                  <PrintField label="Admission Date" value={studentEditValues.admissionDate} />
                                  <PrintField label="Total Fee" value={studentEditValues.admissionFees} />
                              </div>
                          </section>

                          <section>
                              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-100 pb-1 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Residential Info
                              </h2>
                              <div className="space-y-3 px-2">
                                  <PrintField label="Current Address" value={studentEditValues.currentAddress} />
                                  <PrintField label="Permanent Address" value={studentEditValues.permanentAddress} />
                              </div>
                          </section>
                      </div>
                  </div>

                  <div className="mt-auto pt-8">
                      <div className="flex justify-between items-end border-t border-slate-100 pt-6 px-4">
                          <div className="text-center">
                              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1 w-40 mx-auto">Candidate Sign</p>
                              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{studentEditValues.name}</p>
                          </div>
                          <div className="text-center">
                              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1 w-40 mx-auto">Director Sign</p>
                              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{brandName}</p>
                          </div>
                      </div>
                      <div className="mt-6 text-center">
                          <p className="text-[7px] text-slate-300 font-bold uppercase tracking-[0.4em]">This is a computer generated academic dossier. Verified on {new Date().toLocaleDateString()}.</p>
                      </div>
                  </div>
              </div>
          </div>
        )}

        <style jsx global>{`
          @media print {
            @page { margin: 0; size: A4; }
            body * { visibility: hidden !important; }
            
            /* ID CARD PRINT */
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

            /* PROFILE PRINT - ensure it is the ONLY thing visible when printing profile */
            #printable-student-profile, #printable-student-profile * { 
                visibility: visible !important;
            }
            #printable-student-profile {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                z-index: 9999 !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
