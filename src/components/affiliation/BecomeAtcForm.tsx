"use client";

import { Fragment, type FormEvent, useMemo, useState, useEffect } from "react";
import {
  Building2, User, Layers, CreditCard, ChevronDown,
  Send, RotateCcw, CheckCircle, MapPin, Phone, Mail,
  BookOpen, Briefcase, Calendar, Camera, Home, QrCode, X, FileText
} from "lucide-react";
import PaymentReceipt, { type ReceiptData, type InfraRow } from "./PaymentReceipt";
import {
  FeeOption,
  DEFAULT_FEE_OPTIONS,
  DISTRICTS_BY_STATE,
  getYearOptions,
  parseFeeOptions,
  SETTINGS_PROCESS_FEE_KEY,
} from "@/utils/atcSettings";

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
const emptyInfra: Record<(typeof infraFields)[number], InfraRow> = {
  "Staff Room": { rooms: "N/A", seats: "N/A", area: "N/A" },
  "Class Room": { rooms: "N/A", seats: "N/A", area: "N/A" },
  "Computer Lab": { rooms: "N/A", seats: "N/A", area: "N/A" },
  Reception: { rooms: "N/A", seats: "N/A", area: "N/A" },
  Toilets: { rooms: "N/A", seats: "N/A", area: "N/A" },
  "Any Other": { rooms: "N/A", seats: "N/A", area: "N/A" },
};

const INDIAN_STATES = Object.keys(DISTRICTS_BY_STATE);

// ── Reusable styled components ─────────────────────────────────────────────
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

export default function BecomeAtcForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [instituteDocument, setInstituteDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [feeOptions, setFeeOptions] = useState<FeeOption[]>(DEFAULT_FEE_OPTIONS);
  const [infra, setInfra] = useState<Record<(typeof infraFields)[number], InfraRow>>(emptyInfra);

  useEffect(() => {
    fetch("/api/admin/settings?key=qr_code")
      .then(res => res.json())
      .then(data => setQrCode(data.value))
      .catch(() => {});

    fetch(`/api/admin/settings?key=${SETTINGS_PROCESS_FEE_KEY}`)
      .then(res => res.json())
      .then(data => setFeeOptions(parseFeeOptions(data.value)))
      .catch(() => setFeeOptions(DEFAULT_FEE_OPTIONS));
  }, []);

  const districtOptions = DISTRICTS_BY_STATE[form.state] ?? [];

  const setStateField = (value: string) => {
    setForm((current) => ({
      ...current,
      state: value,
      district: DISTRICTS_BY_STATE[value]?.includes(current.district) ? current.district : "",
    }));
  };

  const selectedFee = useMemo(() => {
    return feeOptions.find(o => o.value === form.processFee);
  }, [form.processFee, feeOptions]);

  const errors = useMemo(() => {
    const r: string[] = [];
    if (!form.processFee) r.push("Please select affiliation process fee.");
    if (!form.trainingPartnerName.trim()) r.push("Training partner name is required.");
    if (!form.trainingPartnerAddress.trim()) r.push("Training partner address is required.");
    if (!form.totalName.trim()) r.push("Tehsil / Taluka name is required.");
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
    if (form.paymentMode === "gpay") {
      if (!screenshot) r.push("Please upload a payment screenshot for verification.");
      if (!form.paidAmount.trim()) r.push("Please enter the paid amount.");
      if (!form.transactionNo.trim()) r.push("Please enter the transaction / UTR number.");
    }
    return r;
  }, [form, screenshot]);

  const setField = (field: keyof FormState, value: string) =>
    setForm((c) => ({ ...c, [field]: value }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (errors.length) { setError(errors[0]); return; }
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
      if (photo) payload.append("photo", photo);
      if (screenshot) payload.append("paymentScreenshot", screenshot);
      if (instituteDocument) payload.append("instituteDocument", instituteDocument);
      payload.append("infrastructure", JSON.stringify(infra));
      payload.append("zones", JSON.stringify(form.zones));
      const response = await fetch("/api/become-atc", { method: "POST", body: payload });
      const data = (await response.json()) as { message?: string; refNumber?: string };
      if (!response.ok) { setError(data.message ?? "Form submission failed. Try again."); return; }
      setReceiptData({
        refNumber: data.refNumber ?? Date.now().toString().slice(-6),
        submitDate: new Date().toLocaleString("en-IN"),
        ...form,
        infrastructure: infra as Record<string, InfraRow>,
      });
    } catch {
      setError("Network error while submitting form.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setForm(initialFormState); setInfra(emptyInfra);
    setPhoto(null); setScreenshot(null); setInstituteDocument(null); setError(null); setReceiptData(null);
  };

  if (receiptData) {
    return <PaymentReceipt data={receiptData} onBack={onReset} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-xl"
        style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #0a0aa1 60%, #1a1ac0 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
              <CheckCircle className="w-3 h-3 text-green-300" />
              <span className="text-xs text-white/80 font-medium">Authorized Training Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Application Form
            </h1>
            <p className="text-white/70 text-sm mt-1">Apply to become an Authorized Training Center partner with Yukti Computer Institute</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} onReset={onReset} className="space-y-5">

        {/* ── SECTION 1: Training Partner Info ─────────────────────── */}
        <SectionCard icon={Building2} title="Information About Training Partner" subtitle="All fields are mandatory">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Applying For (readonly) */}
            <div>
              <Label>Applying For</Label>
              <input className={inputCls + " bg-slate-50 cursor-default"} value="Authorized Training Partner" readOnly />
            </div>

            {/* Affiliation Process Fee */}
            <div>
              <Label>Affiliation Process Fee *</Label>
              <SelectWrapper>
                <select className={selectCls} value={form.processFee} onChange={(e) => setField("processFee", e.target.value)}>
                  <option value="">— Select Plan —</option>
                  {feeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  {form.processFee && !feeOptions.some((o) => o.value === form.processFee) && (
                    <option value={form.processFee}>{form.processFee}</option>
                  )}
                </select>
              </SelectWrapper>
            </div>

            {/* Training Partner Name */}
            <div className="sm:col-span-2">
              <Label>Training Partner Name *</Label>
              <input className={inputCls} placeholder="Enter full name of the institute" value={form.trainingPartnerName}
                onChange={(e) => setField("trainingPartnerName", e.target.value)} />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <Label>Training Partner Address *</Label>
              <input className={inputCls} placeholder="Full address of the institute" value={form.trainingPartnerAddress}
                onChange={(e) => setField("trainingPartnerAddress", e.target.value)} />
            </div>

            {/* Postal Address Office */}
            <div className="sm:col-span-2">
              <Label>Postal Address (Office) *</Label>
              <input className={inputCls} placeholder="Office mailing address" value={form.postalAddressOffice}
                onChange={(e) => setField("postalAddressOffice", e.target.value)} />
            </div>

            {/* Tehsil */}
            <div>
              <Label>Tehsil / Taluka Name *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={inputCls + " pl-9"} placeholder="Tehsil or Taluka name"
                  value={form.totalName} onChange={(e) => setField("totalName", e.target.value)} />
              </div>
            </div>

            {/* State */}
            <div>
              <Label>State *</Label>
              <SelectWrapper>
                <select className={selectCls} value={form.state} onChange={(e) => setStateField(e.target.value)}>
                  <option value="">— Select State —</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </SelectWrapper>
            </div>

            {/* District */}
            <div>
              <Label>District *</Label>
              <SelectWrapper>
                <select
                  className={selectCls}
                  value={form.district}
                  onChange={(e) => setField("district", e.target.value)}
                  disabled={!form.state || districtOptions.length === 0}
                >
                  <option value="">
                    {form.state
                      ? districtOptions.length
                        ? "— Select District —"
                        : "No districts available"
                      : "Select state first"}
                  </option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </SelectWrapper>
            </div>

            {/* PIN */}
            <div>
              <Label>PIN Code *</Label>
              <input className={inputCls} placeholder="6-digit PIN code" maxLength={6}
                value={form.pin} onChange={(e) => setField("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} />
            </div>

            {/* Country (readonly) */}
            <div>
              <Label>Country</Label>
              <input className={inputCls + " bg-slate-50 cursor-default"} value="INDIA" readOnly />
            </div>

            {/* Mobile */}
            <div>
              <Label>Mobile Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={inputCls + " pl-9"} placeholder="10-digit mobile number"
                  value={form.mobile} onChange={(e) => setField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label>Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" className={inputCls + " pl-9"} placeholder="email@example.com"
                  value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </div>
            </div>

            {/* Status of Institution */}
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
                  {getYearOptions(50).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </SelectWrapper>
            </div>

            {/* Institute Document */}
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
        <SectionCard icon={Layers} title="Zones (Select one or multiple)" subtitle="Select the zones you wish to operate in" color="#f59e0b">
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
          <div className="flex justify-end mb-1 sm:hidden">
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold animate-pulse">Drag right →</span>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr>
                  {["Particulars", "No. of Rooms", "Seating Capacity", "Total Area (Sq.Ft.)"].map((h, i) => (
                    <th key={h}
                      className={`pb-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 ${i === 0 ? "w-36" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {infraFields.map((item, rowIdx) => (
                  <Fragment key={item}>
                    <tr className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                          {item}
                        </span>
                      </td>
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

        {/* ── SECTION 4: Payment Mode ────────────────────────────── */}
        <SectionCard icon={CreditCard} title="Payment Mode" subtitle="Select how you want to pay" color="#d97706">
          <div className="flex flex-wrap gap-3">
            {[
              { value: "gpay", label: "Google Pay / UPI QR", icon: "💳" },
              { value: "online", label: "Online Payment", icon: "🌐" },
            ].map((opt) => (
              <label key={opt.value}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition select-none
                  ${form.paymentMode === opt.value
                    ? "border-amber-500 bg-amber-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-amber-300"}`}>
                <input type="radio" name="paymentMode" className="sr-only"
                  checked={form.paymentMode === opt.value} onChange={() => setField("paymentMode", opt.value)} />
                <span className="text-lg">{opt.icon}</span>
                <span className={`text-sm font-semibold ${form.paymentMode === opt.value ? "text-amber-700" : "text-slate-700"}`}>
                  {opt.label}
                </span>
                {form.paymentMode === opt.value && <CheckCircle className="w-4 h-4 text-amber-500 ml-auto" />}
              </label>
            ))}
          </div>

          {/* Payment Instructions & QR */}
          {form.paymentMode === "gpay" && (
            <div className="mt-6 p-4 sm:p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
                {qrCode ? (
                  <div className="shrink-0 space-y-2">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Scan to Pay</p>
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-amber-200 cursor-zoom-in group relative"
                      onClick={() => setIsQrModalOpen(true)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="Payment QR" className="w-32 h-32 sm:w-40 sm:h-40 object-contain mx-auto transition group-hover:opacity-90" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full font-bold">CLICK TO ENLARGE</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center bg-white rounded-xl border border-dashed border-amber-300">
                    <QrCode className="w-10 h-10 text-amber-300" />
                  </div>
                )}
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight mb-0.5">Total Amount Payable:</p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-900 leading-none">
                      {selectedFee ? selectedFee.label.split("(").pop()?.replace(")", "").replace("Total ", "") : "—"}
                    </p>
                    {selectedFee && <p className="text-[10px] text-amber-500 font-medium mt-1">Plan: {selectedFee.label.split("—")[0].trim()}</p>}
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-[10px] text-amber-700">1</div>
                      Scan QR & Pay Amount
                    </div>
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 pt-1">
                      <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-[10px] text-amber-700">2</div>
                      Upload Screenshot Below
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">Paid Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-sm">₹</span>
                    <input 
                      className="w-full pl-7 pr-4 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                      placeholder="Enter amount paid"
                      value={form.paidAmount}
                      onChange={(e) => setField("paidAmount", e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">Transaction No / UTR *</label>
                  <input 
                    className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition"
                    placeholder="Enter 12-digit UTR or Txn ID"
                    value={form.transactionNo}
                    onChange={(e) => setField("transactionNo", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Screenshot Upload */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <Label>Upload Payment Screenshot {form.paymentMode === "gpay" && "*"}</Label>
            <p className="text-[10px] text-slate-500 mb-3 italic">Please upload a screenshot of your successful transaction for verification.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex flex-col items-center justify-center gap-2 w-full p-6 rounded-2xl border-2 border-dashed transition cursor-pointer
                ${screenshot ? "border-green-400 bg-green-50" : "border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50"}`}>
                <Camera className={`w-8 h-8 ${screenshot ? "text-green-500" : "text-slate-400"}`} />
                <div className="text-center">
                  <span className={`text-sm font-bold block ${screenshot ? "text-green-700" : "text-slate-600"}`}>
                    {screenshot ? "Change Screenshot" : "Choose File"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {screenshot ? screenshot.name : "JPEG, PNG, WebP or PDF"}
                  </span>
                </div>
                <input type="file" accept="image/*,application/pdf" className="hidden" 
                  onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
              </label>

              {screenshot && screenshot.type.startsWith("image/") && (
                <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden p-2 flex flex-col items-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Preview</p>
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(screenshot)} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <button type="button" onClick={() => setScreenshot(null)} className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-700 uppercase">Remove File</button>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Error Banner ───────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-medium shadow-sm">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-red-600 font-bold text-xs">!</span>
            </div>
            {error}
          </div>
        )}

        {/* ── Submit / Reset ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: loading ? "#9ca3af" : "linear-gradient(135deg, #0a0aa1 0%, #1a1ac0 100%)" }}>
            {loading
              ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Submitting...</>
              : <><Send className="w-4 h-4" />Submit Application</>
            }
          </button>
          <button
            type="reset"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <a href="/" className="ml-auto flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition">
            <Home className="w-4 h-4" /> Home
          </a>
        </div>
      </form>

      {/* QR Large Modal */}
      {isQrModalOpen && qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsQrModalOpen(false)}>
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}>
            <button 
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
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
