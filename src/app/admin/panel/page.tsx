"use client";

import { useEffect, useState, useCallback, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, Clock, Users, FileText, PlusCircle,
  LogOut, ShieldCheck, ChevronDown, ChevronUp, Eye, RefreshCw, Settings, QrCode, Upload, Menu,
} from "lucide-react";
import AdminAtcForm from "@/components/admin/AdminAtcForm";
import CourseManager from "@/components/admin/CourseManager";
import { BookOpen } from "lucide-react";

interface Application {
  _id: string; trainingPartnerName: string; trainingPartnerAddress: string;
  email: string; mobile: string; district: string; state: string;
  chiefName: string; designation: string; status: "pending" | "approved" | "rejected";
  submittedByAdmin: boolean; processFee: string; yearOfEstablishment: string;
  paymentMode: string; statusOfInstitution: string; educationQualification: string;
  professionalExperience: string; dob: string; createdAt: string;
  tpCode?: string; photo?: string; paymentScreenshot?: string;
  instituteDocument?: string;
  infrastructure?: string;
  postalAddressOffice?: string;
  zones?: string[];
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

type Tab = "applications" | "create" | "courses" | "centers" | "settings";

export default function AdminPanelPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state
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

  // Signature Settings
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [sigLoading, setSigLoading] = useState(false);
  const [sigSaving, setSigSaving] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications");
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = (await res.json()) as { applications: Application[] };
      setApplications(data.applications ?? []);
    } catch {
      showToast("error", "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      const res = await fetch(`/api/admin/applications/${editingCenter._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

  const fetchQr = useCallback(async () => {
    setQrLoading(true);
    setSigLoading(true);
    try {
      const qRes = await fetch("/api/admin/settings?key=qr_code");
      const qData = (await qRes.json()) as { value: string | null };
      setQrPreview(qData.value ?? null);

      const sRes = await fetch("/api/admin/settings?key=auth_signature");
      const sData = (await sRes.json()) as { value: string | null };
      setSigPreview(sData.value ?? null);
    } catch { /* ignore */ } finally {
      setQrLoading(false);
      setSigLoading(false);
    }
  }, []);

  useEffect(() => { void fetchApplications(); }, [fetchApplications]);
  useEffect(() => { if (tab === "settings") void fetchQr(); }, [tab, fetchQr]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id + action);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { message: string; tpCode?: string; defaultPassword?: string };
      if (!res.ok) { showToast("error", data.message); return; }
      if (action === "approve" && data.tpCode) {
        showToast("success", `✅ Approved! TP Code: ${data.tpCode} | Default PW: ${data.defaultPassword}`);
      } else {
        showToast(action === "approve" ? "success" : "error", data.message);
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

  const openApplicationForCreateEdit = (application: Application) => {
    setToastMsg(null);
    setPrefillApplication(application);
    setTab("create");
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
        <tr><th>PIN</th><td>${application.pin}</td></tr>
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
        <tr><th>Application Fee</th><td>${FEE_LABEL[application.processFee] ?? `₹${application.processFee}`}</td></tr>
      </tbody></table>
      <h2>Infrastructure</h2>
      <table><thead><tr><th>Particulars</th><th>Rooms</th><th>Seats</th><th>Area</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.print();window.onafterprint=()=>window.close();</script>
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
    if (!qrPreview) return;
    setQrSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    setQrPreview(null);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    if (!sigPreview) return;
    setSigSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    setSigPreview(null);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "auth_signature", value: "" }),
    });
    showToast("success", "Signature removed.");
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const filtered = applications.filter((a) => filterStatus === "all" || a.status === filterStatus);
  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const statusBadge = (status: Application["status"]) => {
    const map = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
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
    applications: "ATC Applications",
    create: "Create ATC Application",
    courses: "Course Management",
    centers: "Manage Centers",
    settings: "Panel Settings",
  };

  const tabDesc: Record<Tab, string> = {
    applications: "Review and manage all submitted ATC applications",
    create: "Manually create an ATC application as admin",
    courses: "Define and manage courses by zones",
    centers: "View and manage status of approved ATCs",
    settings: "System configurations and assets",
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">Admin Panel</p>
                <p className="text-blue-300 text-xs text-nowrap">ATC Management</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <XCircle className="w-5 h-5 text-blue-200" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {([
              { id: "applications" as Tab, icon: FileText, label: "Applications", badge: counts.pending },
              { id: "create" as Tab, icon: PlusCircle, label: "Create ATC" },
              { id: "courses" as Tab, icon: BookOpen, label: "Courses" },
              { id: "centers" as Tab, icon: ShieldCheck, label: "Manage Centers" },
              { id: "settings" as Tab, icon: Settings, label: "Settings" },
            ]).map((item) => (
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
            {/* ── APPLICATIONS TAB ── */}
            {tab === "applications" && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total", count: counts.all, icon: Users, color: "blue" },
                    { label: "Pending", count: counts.pending, icon: Clock, color: "amber" },
                    { label: "Approved", count: counts.approved, icon: CheckCircle, color: "green" },
                    { label: "Rejected", count: counts.rejected, icon: XCircle, color: "red" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-50`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-slate-800">{stat.count}</p>
                        <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filter + Refresh */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${filterStatus === s ? "bg-blue-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
                    </button>
                  ))}
                  <button onClick={fetchApplications} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-100 transition">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                {/* List */}
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No {filterStatus !== "all" ? filterStatus : ""} applications found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((app) => (
                      <div key={app._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4 px-5 py-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-800 text-sm truncate">{app.trainingPartnerName}</p>
                              {app.submittedByAdmin && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold border border-purple-200">Admin Created</span>
                              )}
                              {statusBadge(app.status)}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{app.email} · {app.mobile} · {app.district}, {app.state}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                                {FEE_LABEL[app.processFee] ?? `₹${app.processFee}`}
                              </span>
                              {app.tpCode && (
                                <span className="px-3 py-1 bg-green-600 text-white rounded-lg font-black text-[11px] tracking-wider shadow-sm flex items-center gap-1.5">
                                  <ShieldCheck className="w-3 h-3" />
                                  ID: {app.tpCode}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {app.status === "pending" && (
                              <>
                                <button onClick={() => handleAction(app._id, "approve")} disabled={actionLoading !== null}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-500 transition disabled:opacity-50">
                                  {actionLoading === app._id + "approve" ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  Approve
                                </button>
                                <button onClick={() => handleAction(app._id, "reject")} disabled={actionLoading !== null}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition disabled:opacity-50">
                                  {actionLoading === app._id + "reject" ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                  Reject
                                </button>
                              </>
                            )}
                            <button type="button" onClick={() => openApplicationForCreateEdit(app)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                              Edit
                            </button>
                            <button type="button" onClick={() => printApplication(app)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                              Print
                            </button>
                            <button onClick={() => setExpandedId(expandedId === app._id ? null : app._id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                              <Eye className="w-3.5 h-3.5" />
                              {expandedId === app._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {expandedId === app._id && (
                          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                              {[
                                { label: "Postal Address", value: app.postalAddressOffice },
                                { label: "Zones", value: app.zones?.join(", ") },
                                { label: "Chief Name", value: app.chiefName },
                                { label: "TP Code", value: app.tpCode },
                                { label: "Designation", value: app.designation },
                                { label: "Education", value: app.educationQualification },
                                { label: "Experience", value: app.professionalExperience },
                                { label: "Date of Birth", value: app.dob },
                                { label: "Affiliation Fee", value: FEE_LABEL[app.processFee] ?? `₹${app.processFee}` },
                                { label: "Year Est.", value: app.yearOfEstablishment },
                                { label: "Institution Type", value: app.statusOfInstitution },
                                { label: "Payment Mode", value: app.paymentMode === "gpay" ? "Google Pay" : "Online" },
                                { label: "Submitted", value: new Date(app.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                              ].map((item) => (
                                <div key={item.label} className="bg-white rounded-xl px-3 py-2.5 border border-slate-200 shadow-sm">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.label}</p>
                                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{item.value || "—"}</p>
                                </div>
                              ))}
                            </div>

                            {/* Images Row */}
                            <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-4">
                              {app.photo && (
                                <div className="space-y-1.5 min-w-0">
                                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate">Applicant Photo</p>
                                  <div className="relative aspect-[3/4] w-full sm:w-32 sm:h-40 rounded-xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm hover:border-blue-300 transition group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={app.photo} alt="Photo" className="w-full h-full object-cover" />
                                    <a href={app.photo} target="_blank" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-[10px] font-bold">Full View</a>
                                  </div>
                                </div>
                              )}
                              {app.paymentScreenshot && (
                                <div className="space-y-1.5 min-w-0">
                                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight flex items-center gap-1 truncate">
                                    Verification <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                                  </p>
                                  <div className="relative aspect-[3/4] w-full sm:w-32 sm:h-40 rounded-xl border-2 border-green-200 overflow-hidden bg-white shadow-sm hover:border-green-400 transition group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={app.paymentScreenshot} alt="Transaction SS" className="w-full h-full object-contain p-1" />
                                    <a href={app.paymentScreenshot} target="_blank" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-[10px] font-bold">Check Screen</a>
                                  </div>
                                </div>
                              )}
                              {app.instituteDocument && (
                                <div className="space-y-1.5 min-w-0">
                                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight flex items-center gap-1 truncate">
                                    Institute Document
                                  </p>
                                  <div className="relative aspect-[3/4] w-full sm:w-32 sm:h-40 rounded-xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm hover:border-blue-400 transition group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <embed src={app.instituteDocument} className="w-full h-full object-cover p-1" />
                                    <a href={app.instituteDocument} target="_blank" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-[10px] font-bold">View Doc</a>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Infrastructure Section */}
                            {app.infrastructure && (
                              <div className="mt-6 border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4 text-emerald-600" /> Infrastructure Details
                                  </p>
                                  <span className="sm:hidden text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">Scroll →</span>
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                                  <table className="w-full text-[11px] sm:text-xs text-left min-w-[400px]">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                      <tr>
                                        <th className="px-4 py-2.5 font-bold text-slate-600 uppercase tracking-tight">Particulars</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-tight">Rooms</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-tight">Seats</th>
                                        <th className="px-4 py-3 font-bold text-slate-600 uppercase tracking-tight">Area (Sq.Ft.)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {Object.entries(parseInfra(app.infrastructure) || {}).map(([key, val]) => (
                                        <tr key={key} className="hover:bg-slate-50/50 transition">
                                          <td className="px-4 py-2.5 font-semibold text-slate-700">{key}</td>
                                          <td className="px-4 py-2.5 text-slate-600">{val.rooms}</td>
                                          <td className="px-4 py-2.5 text-slate-600">{val.seats}</td>
                                          <td className="px-4 py-2.5 text-slate-600">{val.area}</td>
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
                    ))}
                  </div>
                )}

                {editingApplication && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Edit Application</h3>
                          <p className="text-sm text-slate-500">Update the full application form and save your changes.</p>
                        </div>
                        <button type="button" onClick={closeApplicationEditor} className="text-slate-500 hover:text-slate-800">Close</button>
                      </div>
                      <div className="p-6">
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
              </>
            )}

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
                    setTab("applications");
                    void fetchApplications();
                  }}
                />
              </div>
            )}

            {/* ── COURSES TAB ── */}
            {tab === "courses" && <CourseManager />}

            {/* ── MANAGE CENTERS TAB ── */}
            {tab === "centers" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300 relative">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4">TP CODE / CENTER NAME</th>
                        <th className="px-6 py-4">LOCATION</th>
                        <th className="px-6 py-4">ZONES</th>
                        <th className="px-6 py-4">ADMISSION STATUS</th>
                        <th className="px-6 py-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.filter(a => a.status === "approved" || a.status === "rejected").length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">No centers found.</td></tr>
                      ) : (
                        applications.filter(a => a.status === "approved" || a.status === "rejected").map((app) => (
                          <tr key={app._id} className="hover:bg-slate-50 transition group">
                            <td className="px-6 py-4">
                              <p className="font-black text-slate-800 leading-none mb-1">{app.tpCode || "NEW-ATC"}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{app.trainingPartnerName}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">{app.district}, {app.state}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {app.zones?.map(z => (
                                  <span key={z} className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[8px] font-black uppercase border border-blue-100">{z}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${app.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                                 {app.status === "approved" ? "ENABLED (ACTIVE)" : "DISABLED (BLOCKED)"}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openCenterEditor(app)}
                                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase hover:bg-slate-200 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  disabled={actionLoading === app._id + "toggle"}
                                  onClick={() => handleAction(app._id, app.status === "approved" ? "reject" : "approve")}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm transition active:scale-95 ${app.status === "approved" ? "bg-red-600 text-white hover:bg-red-700 shadow-red-100" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"}`}
                                >
                                  {actionLoading === app._id + "toggle" ? "..." : (app.status === "approved" ? "Disable Center" : "Enable Center")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {editingCenter && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Edit Center Details</h3>
                          <p className="text-sm text-slate-500">Update center name, location, zones, email and mobile.</p>
                        </div>
                        <button type="button" onClick={closeCenterEditor} className="text-slate-400 hover:text-slate-600">Close</button>
                      </div>
                      <form className="space-y-5 p-6" onSubmit={handleCenterSave}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Center Name</label>
                            <input
                              value={editValues.trainingPartnerName}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, trainingPartnerName: e.target.value }))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">District</label>
                            <input
                              value={editValues.district}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, district: e.target.value }))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">State</label>
                            <input
                              value={editValues.state}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, state: e.target.value }))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Zones</label>
                            <input
                              value={editValues.zones}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, zones: e.target.value }))}
                              placeholder="Comma separated zones"
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Mobile</label>
                            <input
                              value={editValues.mobile}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, "") }))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                              maxLength={10}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Email</label>
                            <input
                              value={editValues.email}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, email: e.target.value }))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={closeCenterEditor}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={editSaving}
                            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {editSaving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {tab === "settings" && (
              <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
