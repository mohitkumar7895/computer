"use client";

import { Fragment, type FormEvent, useMemo, useState } from "react";

type InfrastructureRow = { rooms: string; seats: string; area: string };
type FormState = {
  processFee: string; trainingPartnerName: string; trainingPartnerAddress: string;
  totalName: string; district: string; state: string; pin: string; country: string;
  mobile: string; email: string; statusOfInstitution: string; yearOfEstablishment: string;
  chiefName: string; designation: string; educationQualification: string;
  professionalExperience: string; dob: string; paymentMode: string;
};

const initialFormState: FormState = {
  processFee: "", trainingPartnerName: "", trainingPartnerAddress: "", totalName: "",
  district: "", state: "", pin: "", country: "INDIA", mobile: "", email: "",
  statusOfInstitution: "", yearOfEstablishment: "", chiefName: "", designation: "",
  educationQualification: "", professionalExperience: "", dob: "", paymentMode: "",
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
  { value: "2000", label: "TP FOR 1 YEARS [Rs. 2000 + 18% GST]" },
  { value: "3000", label: "TP FOR 2 YEARS [Rs. 3000 + 18% GST]" },
  { value: "5000", label: "TP FOR 3 YEARS [Rs. 5000 + 18% GST]" },
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

interface Props { onSuccess: () => void; }

export default function AdminAtcForm({ onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [infra, setInfra] = useState(emptyInfra);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const setField = (field: keyof FormState, value: string) =>
    setForm((c) => ({ ...c, [field]: value }));

  const errors = useMemo(() => {
    const r: string[] = [];
    if (!form.processFee) r.push("Affiliation process fee is required.");
    if (!form.trainingPartnerName.trim()) r.push("Training partner name is required.");
    if (!form.trainingPartnerAddress.trim()) r.push("Training partner address is required.");
    if (!form.district.trim()) r.push("District is required.");
    if (!form.state) r.push("State is required.");
    if (!/^\d{6}$/.test(form.pin)) r.push("PIN must be 6 digits.");
    if (!/^\d{10}$/.test(form.mobile)) r.push("Mobile must be 10 digits.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) r.push("Valid email is required.");
    if (!form.statusOfInstitution.trim()) r.push("Status of institution is required.");
    if (!form.yearOfEstablishment.trim()) r.push("Year of establishment is required.");
    if (!form.chiefName.trim()) r.push("Chief name is required.");
    if (!form.designation.trim()) r.push("Designation is required.");
    if (!form.educationQualification.trim()) r.push("Education qualification is required.");
    if (!form.professionalExperience.trim()) r.push("Professional experience is required.");
    if (!form.dob.trim()) r.push("Date of birth is required.");
    if (!form.paymentMode) r.push("Payment mode is required.");
    return r;
  }, [form]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (errors.length) { setMessage({ type: "error", text: errors[0] }); return; }
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      if (photo) payload.append("photo", photo);
      if (screenshot) payload.append("paymentScreenshot", screenshot);
      payload.append("infrastructure", JSON.stringify(infra));
      const res = await fetch("/api/admin/applications", { method: "POST", body: payload });
      const data = (await res.json()) as { message: string };
      if (!res.ok) { setMessage({ type: "error", text: data.message }); return; }
      setMessage({ type: "success", text: "ATC application created successfully!" });
      setForm(initialFormState); setInfra(emptyInfra); setPhoto(null); setScreenshot(null);
      onSuccess();
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const fc = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition";
  const lc = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <form onSubmit={onSubmit} onReset={() => { setForm(initialFormState); setInfra(emptyInfra); setPhoto(null); setScreenshot(null); setMessage(null); }} className="space-y-6">

      {/* Section 1 */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
          Information About Training Partner
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={lc}>Affiliation Process Fee *</label>
            <select className={fc} value={form.processFee} onChange={(e) => setField("processFee", e.target.value)}>
              <option value="">Select</option>
              {FEE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lc}>Training Partner Name *</label>
            <input className={fc} value={form.trainingPartnerName} onChange={(e) => setField("trainingPartnerName", e.target.value)} placeholder="Full institute name" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={lc}>Training Partner Address *</label>
            <input className={fc} value={form.trainingPartnerAddress} onChange={(e) => setField("trainingPartnerAddress", e.target.value)} placeholder="Full address" />
          </div>
          <div>
            <label className={lc}>Tehsil Name</label>
            <input className={fc} value={form.totalName} onChange={(e) => setField("totalName", e.target.value)} placeholder="Tehsil / Taluka" />
          </div>
          <div>
            <label className={lc}>District *</label>
            <input className={fc} value={form.district} onChange={(e) => setField("district", e.target.value)} placeholder="District" />
          </div>
          <div>
            <label className={lc}>State *</label>
            <select className={fc} value={form.state} onChange={(e) => setField("state", e.target.value)}>
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lc}>PIN *</label>
            <input className={fc} value={form.pin} maxLength={6} onChange={(e) => setField("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit PIN" />
          </div>
          <div>
            <label className={lc}>Country</label>
            <input className={fc} value={form.country} readOnly />
          </div>
          <div>
            <label className={lc}>Mobile *</label>
            <input className={fc} value={form.mobile} onChange={(e) => setField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" />
          </div>
          <div>
            <label className={lc}>Email *</label>
            <input type="email" className={fc} value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className={lc}>Status of Institution *</label>
            <select className={fc} value={form.statusOfInstitution} onChange={(e) => setField("statusOfInstitution", e.target.value)}>
              <option value="">Select</option>
              <option>Trust</option><option>Society</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className={lc}>Year of Establishment *</label>
            <select className={fc} value={form.yearOfEstablishment} onChange={(e) => setField("yearOfEstablishment", e.target.value)}>
              <option value="">Select Year</option>
              {Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString()).map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          Chief Executive / Principal / Director
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={lc}>Name *</label>
            <input className={fc} value={form.chiefName} onChange={(e) => setField("chiefName", e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className={lc}>Designation *</label>
            <input className={fc} value={form.designation} onChange={(e) => setField("designation", e.target.value)} placeholder="Director / Principal" />
          </div>
          <div>
            <label className={lc}>Education Qualification *</label>
            <input className={fc} value={form.educationQualification} onChange={(e) => setField("educationQualification", e.target.value)} placeholder="e.g. M.Sc, B.Ed" />
          </div>
          <div>
            <label className={lc}>Professional Experience *</label>
            <input className={fc} value={form.professionalExperience} onChange={(e) => setField("professionalExperience", e.target.value)} placeholder="e.g. 5 years" />
          </div>
          <div>
            <label className={lc}>Date of Birth *</label>
            <input type="date" className={fc} value={form.dob} onChange={(e) => setField("dob", e.target.value)} />
          </div>
          <div>
            <label className={lc}>Photo</label>
            <input type="file" accept="image/*" className={fc} onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </div>
        </div>
      </div>

      {/* Section 3 - Infrastructure */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
          Infrastructure Facility
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Particulars", "No. of Rooms", "Seating Capacity", "Total Area (Sq.Ft.)"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {infraFields.map((item) => (
                <Fragment key={item}>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 font-medium text-slate-700">{item}</td>
                    {(["rooms", "seats", "area"] as const).map((col) => (
                      <td key={col} className="px-4 py-2">
                        <input className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 transition" value={infra[item][col]} onChange={(e) => setInfra((c) => ({ ...c, [item]: { ...c[item], [col]: e.target.value } }))} />
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Mode */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Payment Mode *</label>
        <div className="flex flex-wrap gap-4">
          {[{ value: "gpay", label: "Google Pay (G-Pay)" }, { value: "online", label: "Online Payment" }].map((opt) => (
            <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="radio" name="adminPaymentMode" checked={form.paymentMode === opt.value} onChange={() => setField("paymentMode", opt.value)} className="accent-blue-600" />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className={lc}>Payment Transaction Screenshot (Manual Entry)</label>
          <input type="file" accept="image/*" className={fc} onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
        </div>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-60 shadow-md">
          {loading ? "Submitting..." : "Create ATC Application"}
        </button>
        <button type="reset" className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
          Reset Form
        </button>
      </div>
    </form>
  );
}
