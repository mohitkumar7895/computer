"use client";

import { Fragment, type FormEvent, useMemo, useState, useEffect } from "react";
import {
  Building2, User, Layers, CreditCard, ChevronDown,
  Send, RotateCcw, CheckCircle, MapPin, Phone, Mail,
  BookOpen, Briefcase, Calendar, Camera, ShieldCheck, FileText, X, QrCode
} from "lucide-react";

type InfrastructureRow = { rooms: string; seats: string; area: string };
type FormState = {
  processFee: string; trainingPartnerName: string; trainingPartnerAddress: string;
  postalAddressOffice: string; zones: string[];
  totalName: string; district: string; state: string; pin: string; country: string;
  mobile: string; email: string; statusOfInstitution: string; yearOfEstablishment: string;
  chiefName: string; designation: string; educationQualification: string;
  professionalExperience: string; dob: string; paymentMode: string;
  paidAmount: string; transactionNo: string;
};

const initialFormState: FormState = {
  processFee: "", trainingPartnerName: "", trainingPartnerAddress: "", postalAddressOffice: "", zones: [],
  totalName: "", district: "", state: "", pin: "", country: "INDIA", mobile: "", email: "",
  statusOfInstitution: "", yearOfEstablishment: "", chiefName: "", designation: "",
  educationQualification: "", professionalExperience: "", dob: "", paymentMode: "",
  paidAmount: "", transactionNo: "",
};

const infraFields = ["Staff Room", "Class Room", "Computer Lab", "Reception", "Toilets", "Any Other"] as const;
const emptyInfra: Record<(typeof infraFields)[number], InfrastructureRow> = {
  "Staff Room": { rooms: "N/A", seats: "N/A", area: "N/A" },
  "Class Room": { rooms: "N/A", seats: "N/A", area: "N/A" },
  "Computer Lab": { rooms: "N/A", seats: "N/A", area: "N/A" },
  Reception: { rooms: "N/A", seats: "N/A", area: "N/A" },
  Toilets: { rooms: "N/A", seats: "N/A", area: "N/A" },
  "Any Other": { rooms: "N/A", seats: "N/A", area: "N/A" },
};

const FEE_OPTIONS = [
  { value: "2000", label: "TP FOR 1 YEAR — Rs. 2000 + 18% GST (Total ₹2,360)" },
  { value: "3000", label: "TP FOR 2 YEARS — Rs. 3000 + 18% GST (Total ₹3,540)" },
  { value: "5000", label: "TP FOR 3 YEARS — Rs. 5000 + 18% GST (Total ₹5,900)" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

// Styles from BecomeAtcForm
const inputCls = [
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800",
  "placeholder-slate-400 outline-none transition",
  "focus:border-[#0a0aa1] focus:ring-2 focus:ring-[#0a0aa1]/10",
  "hover:border-slate-300",
].join(" ");

const selectCls = inputCls + " appearance-none cursor-pointer";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
    {children}
  </label>
);

const SectionCard = ({
  icon: Icon, title, subtitle, children, color = "#0a0aa1",
}: { icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode; color?: string }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-slate-100"
      style={{ background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
        style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="px-4 sm:px-5 py-5">{children}</div>
  </div>
);

const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    {children}
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

interface Props {
  onSuccess: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
  applicationId?: string;
  initialData?: Partial<FormState> & {
    photo?: string;
    paymentScreenshot?: string;
    instituteDocument?: string;
    infrastructure?: string;
    status?: string;
  };
}

export default function AdminAtcForm({ onSuccess, onCancel, mode = "create", applicationId, initialData }: Props) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  useEffect(() => {
    if (mode !== "edit" || !initialData) return;
    setForm((current) => ({
      ...current,
      processFee: initialData.processFee ?? current.processFee,
      trainingPartnerName: initialData.trainingPartnerName ?? current.trainingPartnerName,
      trainingPartnerAddress: initialData.trainingPartnerAddress ?? current.trainingPartnerAddress,
      postalAddressOffice: initialData.postalAddressOffice ?? current.postalAddressOffice,
      zones: initialData.zones ?? current.zones,
      totalName: initialData.totalName ?? current.totalName,
      district: initialData.district ?? current.district,
      state: initialData.state ?? current.state,
      pin: initialData.pin ?? current.pin,
      country: initialData.country ?? current.country,
      mobile: initialData.mobile ?? current.mobile,
      email: initialData.email ?? current.email,
      statusOfInstitution: initialData.statusOfInstitution ?? current.statusOfInstitution,
      yearOfEstablishment: initialData.yearOfEstablishment ?? current.yearOfEstablishment,
      chiefName: initialData.chiefName ?? current.chiefName,
      designation: initialData.designation ?? current.designation,
      educationQualification: initialData.educationQualification ?? current.educationQualification,
      professionalExperience: initialData.professionalExperience ?? current.professionalExperience,
      dob: initialData.dob ?? current.dob,
      paymentMode: initialData.paymentMode ?? current.paymentMode,
      paidAmount: initialData.paidAmount ?? current.paidAmount,
      transactionNo: initialData.transactionNo ?? current.transactionNo,
    }));

    setPhotoPreview(initialData.photo ?? null);
    setScreenshotPreview(initialData.paymentScreenshot ?? null);
    setDocPreview(initialData.instituteDocument ?? null);

    try {
      setInfra({
        ...emptyInfra,
        ...(initialData.infrastructure ? JSON.parse(initialData.infrastructure) : {}),
      });
    } catch {
      setInfra(emptyInfra);
    }
  }, [mode, initialData]);

  const [instituteDocument, setInstituteDocument] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [infra, setInfra] = useState<Record<(typeof infraFields)[number], InfrastructureRow>>(emptyInfra);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings?key=qr_code")
      .then(res => res.json())
      .then(data => setQrCode(data.value))
      .catch(() => {});
  }, []);

  const errors = useMemo(() => {
    const r: string[] = [];
    if (!form.processFee) r.push("Please select affiliation process fee.");
    if (!form.trainingPartnerName.trim()) r.push("Training partner name is required.");
    if (!form.trainingPartnerAddress.trim()) r.push("Training partner address is required.");
    if (!form.postalAddressOffice.trim()) r.push("Postal address is required.");
    if (form.zones.length === 0) r.push("Please select at least one zone.");
    if (!form.district.trim()) r.push("District is required.");
    if (!form.state) r.push("State is required.");
    if (!/^\d{6}$/.test(form.pin)) r.push("PIN must be 6 digits.");
    if (!/^\d{10}$/.test(form.mobile)) r.push("Mobile must be 10 digits.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) r.push("Valid email is required.");
    if (!form.statusOfInstitution) r.push("Status of institution is required.");
    if (!form.yearOfEstablishment) r.push("Year of establishment is required.");
    if (!form.chiefName.trim()) r.push("Chief executive name is required.");
    if (!form.designation.trim()) r.push("Designation is required.");
    if (!form.educationQualification.trim()) r.push("Education qualification is required.");
    if (!form.professionalExperience.trim()) r.push("Professional experience is required.");
    if (!form.dob.trim()) r.push("Date of birth is required.");
    if (!form.paymentMode) r.push("Please select payment mode.");
    return r;
  }, [form]);

  const setField = (field: keyof FormState, value: string) =>
    setForm((c) => ({ ...c, [field]: value }));

  const onReset = () => {
    if (mode === "edit" && initialData) {
      setForm((current) => ({
        ...current,
        processFee: initialData.processFee ?? current.processFee,
        trainingPartnerName: initialData.trainingPartnerName ?? current.trainingPartnerName,
        trainingPartnerAddress: initialData.trainingPartnerAddress ?? current.trainingPartnerAddress,
        postalAddressOffice: initialData.postalAddressOffice ?? current.postalAddressOffice,
        zones: initialData.zones ?? current.zones,
        totalName: initialData.totalName ?? current.totalName,
        district: initialData.district ?? current.district,
        state: initialData.state ?? current.state,
        pin: initialData.pin ?? current.pin,
        country: initialData.country ?? current.country,
        mobile: initialData.mobile ?? current.mobile,
        email: initialData.email ?? current.email,
        statusOfInstitution: initialData.statusOfInstitution ?? current.statusOfInstitution,
        yearOfEstablishment: initialData.yearOfEstablishment ?? current.yearOfEstablishment,
        chiefName: initialData.chiefName ?? current.chiefName,
        designation: initialData.designation ?? current.designation,
        educationQualification: initialData.educationQualification ?? current.educationQualification,
        professionalExperience: initialData.professionalExperience ?? current.professionalExperience,
        dob: initialData.dob ?? current.dob,
        paymentMode: initialData.paymentMode ?? current.paymentMode,
        paidAmount: initialData.paidAmount ?? current.paidAmount,
        transactionNo: initialData.transactionNo ?? current.transactionNo,
      }));
      setInfra(initialData.infrastructure ? JSON.parse(initialData.infrastructure) : emptyInfra);
      setPhoto(null);
      setScreenshot(null);
      setInstituteDocument(null);
      setMessage(null);
      setPhotoPreview(initialData.photo ?? null);
      setScreenshotPreview(initialData.paymentScreenshot ?? null);
      setDocPreview(initialData.instituteDocument ?? null);
      return;
    }

    setForm(initialFormState); setInfra(emptyInfra);
    setPhoto(null); setScreenshot(null); setInstituteDocument(null); setMessage(null);
    setPhotoPreview(null); setScreenshotPreview(null); setDocPreview(null);
  };

  const selectedFee = FEE_OPTIONS.find((fee) => fee.value === form.processFee) ?? null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (errors.length) { setMessage({ type: "error", text: errors[0] }); return; }
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          payload.append(key, JSON.stringify(value));
        } else {
          payload.append(key, String(value));
        }
      });
      if (photo) {
        payload.append("photo", photo);
      } else if (photoPreview) {
        payload.append("existingPhoto", photoPreview);
      }
      if (screenshot) {
        payload.append("paymentScreenshot", screenshot);
      } else if (screenshotPreview) {
        payload.append("existingPaymentScreenshot", screenshotPreview);
      }
      if (instituteDocument) {
        payload.append("instituteDocument", instituteDocument);
      } else if (docPreview) {
        payload.append("existingInstituteDocument", docPreview);
      }
      payload.append("infrastructure", JSON.stringify(infra));

      const url = mode === "edit" && applicationId
        ? `/api/admin/applications/${applicationId}`
        : "/api/admin/applications";
      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, { method, body: payload });
      const data = (await response.json()) as { message: string, tpCode?: string, mobile?: string };
      if (!response.ok) { setMessage({ type: "error", text: data.message }); return; }

      const successText = mode === "edit"
        ? "✅ Application updated successfully."
        : data.tpCode
          ? `✅ ATC Approved! Login ID: ${data.tpCode} | Pass: ${data.mobile}`
          : "ATC application created successfully!";

      setMessage({ type: "success", text: successText });
      onReset();
      onSuccess();
    } catch {
      setMessage({ type: "error", text: "Network error while submitting form." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} onReset={onReset} className="space-y-5">
      
      {/* ── SECTION 1: Training Partner Info ─────────────────────── */}
      <SectionCard icon={Building2} title="Information About Training Partner" subtitle="All fields are mandatory">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Applying For</Label>
            <input className={inputCls + " bg-slate-50 cursor-default"} value="Authorized Training Partner" readOnly />
          </div>

          <div>
            <Label>Affiliation Process Fee *</Label>
            <SelectWrapper>
              <select className={selectCls} value={form.processFee} onChange={(e) => setField("processFee", e.target.value)}>
                <option value="">— Select Plan —</option>
                {FEE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </SelectWrapper>
          </div>

          <div className="sm:col-span-2">
            <Label>Training Partner Name *</Label>
            <input className={inputCls} placeholder="Enter full name of the institute" value={form.trainingPartnerName}
              onChange={(e) => setField("trainingPartnerName", e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <Label>Training Partner Address *</Label>
            <input className={inputCls} placeholder="Full address of the institute" value={form.trainingPartnerAddress}
              onChange={(e) => setField("trainingPartnerAddress", e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <Label>Postal Address (Office) *</Label>
            <input className={inputCls} placeholder="Office mailing address" value={form.postalAddressOffice}
              onChange={(e) => setField("postalAddressOffice", e.target.value)} />
          </div>

          <div>
            <Label>Tehsil / Taluka Name *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={inputCls + " pl-9"} placeholder="Tehsil or Taluka name"
                value={form.totalName} onChange={(e) => setField("totalName", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>District *</Label>
            <input className={inputCls} placeholder="Enter district" value={form.district}
              onChange={(e) => setField("district", e.target.value)} />
          </div>

          <div>
            <Label>State *</Label>
            <SelectWrapper>
              <select className={selectCls} value={form.state} onChange={(e) => setField("state", e.target.value)}>
                <option value="">— Select State —</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </SelectWrapper>
          </div>

          <div>
            <Label>PIN Code *</Label>
            <input className={inputCls} placeholder="6-digit PIN code" maxLength={6}
              value={form.pin} onChange={(e) => setField("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </div>

          <div>
            <Label>Country</Label>
            <input className={inputCls + " bg-slate-50 cursor-default"} value="INDIA" readOnly />
          </div>

          <div>
            <Label>Mobile Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={inputCls + " pl-9"} placeholder="10-digit mobile number"
                value={form.mobile} onChange={(e) => setField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </div>
          </div>

          <div>
            <Label>Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" className={inputCls + " pl-9"} placeholder="email@example.com"
                value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Status of Institution *</Label>
            <div className="flex gap-2 flex-wrap pt-1">
              {["Trust", "Society", "Other"].map((s) => (
                <label key={s}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition select-none
                    ${form.statusOfInstitution === s
                      ? "bg-[#0a0aa1] text-white border-[#0a0aa1] shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#0a0aa1]/40"}`}>
                  <input type="radio" name="statusOfInstitution" className="sr-only"
                    checked={form.statusOfInstitution === s} onChange={() => setField("statusOfInstitution", s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Year of Establishment *</Label>
            <SelectWrapper>
              <select className={selectCls} value={form.yearOfEstablishment} onChange={(e) => setField("yearOfEstablishment", e.target.value)}>
                <option value="">— Select Year —</option>
                {Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString()).map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </SelectWrapper>
          </div>

          <div className="sm:col-span-2">
            <Label>Institute Document (Optional)</Label>
            <label className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:border-[#0a0aa1]/40 hover:bg-slate-100 transition">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-500 truncate">
                {instituteDocument ? instituteDocument.name : "Click to upload JPG / PDF"}
              </span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setInstituteDocument(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
      </SectionCard>

      {/* ── SECTION: Zones ──────────────────────────────────────── */}
      <SectionCard icon={Layers} title="Zones (Select one or multiple)" subtitle="Select the zones for this center" color="#f59e0b">
        <div className="flex flex-wrap gap-3 pt-1">
          {["Software Zone", "Hardware Zone", "Vocational Zone", "Other"].map((z) => (
            <label key={z}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition select-none
                ${form.zones.includes(z)
                  ? "bg-[#f59e0b] text-white border-[#f59e0b] shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#f59e0b]/40 shadow-sm"}`}>
              <input 
                type="checkbox" 
                className="sr-only"
                checked={form.zones.includes(z)} 
                onChange={(e) => {
                  const next = e.target.checked 
                    ? [...form.zones, z] 
                    : form.zones.filter(v => v !== z);
                  setForm(c => ({ ...c, zones: next }));
                }} 
              />
              {form.zones.includes(z) ? <CheckCircle className="w-4 h-4" /> : <Layers className="w-4 h-4 opacity-40" />}
              {z}
            </label>
          ))}
        </div>
      </SectionCard>

      {/* ── SECTION 2: Chief Executive ─────────────────────────── */}
      <SectionCard icon={User} title="Information About the Chief Executive / Principal / Director" color="#7c3aed">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={inputCls + " pl-9"} placeholder="Head's full name" value={form.chiefName}
                onChange={(e) => setField("chiefName", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Designation / Position *</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={inputCls + " pl-9"} placeholder="e.g. Director, Principal" value={form.designation}
                onChange={(e) => setField("designation", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Education Qualification *</Label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={inputCls + " pl-9"} placeholder="e.g. M.Sc, B.Ed, MBA" value={form.educationQualification}
                onChange={(e) => setField("educationQualification", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Professional Experience *</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={inputCls + " pl-9"} placeholder="e.g. 5 Years" value={form.professionalExperience}
                onChange={(e) => setField("professionalExperience", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Date of Birth *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" className={inputCls + " pl-9"} value={form.dob}
                onChange={(e) => setField("dob", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Photo (Optional)</Label>
            <label className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:border-[#0a0aa1]/40 hover:bg-slate-100 transition">
              <Camera className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-500 truncate">
                {photo ? photo.name : "Click to choose photo"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
      </SectionCard>

      {/* ── SECTION 3: Infrastructure ──────────────────────────── */}
      <SectionCard icon={Layers} title="Infrastructure Facility" subtitle="Enter N/A if not applicable" color="#059669">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-120">
            <thead>
              <tr>
                {["Particulars", "No. of Rooms", "Seating Capacity", "Total Area (Sq.Ft.)"].map((h, i) => (
                  <th key={h} className={`pb-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 ${i === 0 ? "w-36" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {infraFields.map((item) => (
                <Fragment key={item}>
                  <tr className="border-t border-slate-200">
                    <td className="py-2 pr-3 font-semibold text-slate-600">{item}</td>
                    {(["rooms", "seats", "area"] as const).map((col) => (
                      <td key={col} className="py-2 pr-3">
                        <input
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-slate-400"
                          value={infra[item][col]}
                          onChange={(e) => setInfra((c) => ({ ...c, [item]: { ...c[item], [col]: e.target.value } }))}
                        />
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── SECTION 4: Payment ────────────────────────────────────────────── */}
      <SectionCard icon={CreditCard} title="Action & Payment" subtitle="Manual override for Admin" color="#d97706">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <Label>Payment Mode *</Label>
             <div className="flex flex-wrap gap-3">
              {[
                { value: "gpay", label: "Google Pay (Manual)" },
                { value: "online", label: "Online (Manual)" },
              ].map((opt) => (
                <label key={opt.value}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 cursor-pointer transition select-none
                    ${form.paymentMode === opt.value
                      ? "border-amber-500 bg-amber-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-amber-300"}`}>
                  <input type="radio" name="paymentMode" className="sr-only"
                    checked={form.paymentMode === opt.value} onChange={() => setField("paymentMode", opt.value)} />
                  <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>

            {form.paymentMode === "gpay" && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-4">
                <div className="flex items-center gap-4">
                  {qrCode ? (
                    <div className="shrink-0 p-1.5 bg-white rounded-lg shadow-sm border border-amber-200 cursor-zoom-in group relative"
                      onClick={() => setIsQrModalOpen(true)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="QR" className="w-20 h-20 object-contain transition group-hover:opacity-90" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                         <span className="bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">VIEW</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-white rounded-lg border border-dashed border-amber-300">
                      <QrCode className="w-6 h-6 text-amber-300" />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-amber-600 font-bold uppercase">Total Payable:</p>
                    <p className="text-xl font-black text-amber-900 leading-none">
                      {selectedFee ? selectedFee.label.split("(").pop()?.replace(")", "").replace("Total ", "") : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Paid Amount *</Label>
                    <input className={inputCls} placeholder="₹ Amount" value={form.paidAmount}
                      onChange={(e) => setField("paidAmount", e.target.value.replace(/\D/g, ""))} />
                  </div>
                  <div>
                    <Label>Txn No / UTR *</Label>
                    <input className={inputCls} placeholder="UTR ID" value={form.transactionNo}
                      onChange={(e) => setField("transactionNo", e.target.value)} />
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label>Payment Screenshot (Optional)</Label>
              <input type="file" accept="image/*" className={inputCls} onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
            </div>
          </div>
        </div>
      </SectionCard>


      {/* ── Message Banner ───────────────────────────────────────── */}
      {message && (
        <div className={`flex items-start gap-3 border rounded-2xl px-5 py-4 text-sm font-medium shadow-sm ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${message.type === "success" ? "bg-green-100" : "bg-red-100"}`}>
            {message.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="font-bold text-xs">!</span>}
          </div>
          {message.text}
        </div>
      )}

      {/* ── Submit / Reset ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: loading ? "#9ca3af" : "linear-gradient(135deg, #0a0aa1 0%, #1a1ac0 100%)" }}>
          {loading
            ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Processing...</>
            : <><Send className="w-4 h-4" />{mode === "edit" ? "Save Changes" : "Create & Approve ATC"}</>
          }
        </button>
        <div className="flex flex-col gap-3 sm:flex-row">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
          <button
            type="reset"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>
      
      {/* QR Large Modal */}
      {isQrModalOpen && qrCode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsQrModalOpen(false)}>
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-500 hover:text-red-500 transition">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Scan to Pay</h3>
              <p className="text-sm text-slate-500">Yukti Computer Institute Official Payment QR</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
               {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="Large Payment QR" className="w-full h-auto max-h-[60vh] object-contain mx-auto" />
            </div>
            <button 
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition">
              Close
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
