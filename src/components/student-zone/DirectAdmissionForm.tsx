"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";

type FormState = {
  fullName: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  email: string;
  address: string;
  course: string;
  city: string;
  state: string;
  pin: string;
  dob: string;
  gender: string;
  admissionDate: string;
};

const initialState: FormState = {
  fullName: "",
  fatherName: "",
  motherName: "",
  mobile: "",
  email: "",
  address: "",
  course: "",
  city: "",
  state: "",
  pin: "",
  dob: "",
  gender: "",
  admissionDate: new Date().toISOString().split('T')[0],
};

export default function DirectAdmissionForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [cert, setCert] = useState<File | null>(null);
  const [aadhar, setAadhar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.fatherName.trim()) return "Father name is required.";
    if (!form.motherName.trim()) return "Mother name is required.";
    if (!form.address.trim()) return "Address is required.";
    if (!form.course) return "Please select course.";
    if (!form.city.trim()) return "City is required.";
    if (!form.state.trim()) return "State is required.";
    if (!/^\d{6}$/.test(form.pin)) return "PIN must be 6 digits.";
    if (!/^\d{10}$/.test(form.mobile)) return "Mobile must be 10 digits.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email.";
    if (!form.dob) return "Date of birth is required.";
    if (!form.gender) return "Please select gender.";
    if (!form.admissionDate) return "Admission date is required.";
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const error = validate();
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (photo) payload.append("photo", photo);
      if (cert) payload.append("certificate", cert);
      if (aadhar) payload.append("aadhar", aadhar);

      const response = await fetch("/api/direct-admission", { method: "POST", body: payload });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage({ type: "error", text: data.message ?? "Submission failed." });
        return;
      }

      setMessage({ type: "success", text: "Form submitted successfully." });
      setForm(initialState);
      setPhoto(null);
      setCert(null);
      setAadhar(null);
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-auto border border-slate-300 bg-[#efefef] p-3 sm:p-5">
      <div className="mx-auto max-w-80 text-center">
        <Image src="/ygroup-logo.svg" alt="Y Group Logo" width={320} height={120} className="mx-auto h-auto w-auto" />
        <h2 className="mt-2 text-xl text-[#5b61c9] sm:text-3xl">Students Registration (Direct)</h2>
      </div>

      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Personal Information</h3>
          <div className="grid gap-2 md:grid-cols-[260px_1fr]">
            <label className="border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">Student Photo *</label>
            <input type="file" className="border border-slate-300 bg-white px-3 py-2 text-sm" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </div>
          <div className="grid gap-2 md:grid-cols-[260px_1fr]">
            <label className="border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">Full Name of the Applicant *</label>
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} />
          </div>
          <div className="grid gap-2 md:grid-cols-[260px_1fr]">
            <label className="border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">Father&apos;s Name *</label>
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" value={form.fatherName} onChange={(e) => setField("fatherName", e.target.value)} />
          </div>
          <div className="grid gap-2 md:grid-cols-[260px_1fr]">
            <label className="border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">Mother&apos;s Name *</label>
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" value={form.motherName} onChange={(e) => setField("motherName", e.target.value)} />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Date of Birth *" type="date" value={form.dob} onChange={(e) => setField("dob", e.target.value)} />
            <div className="flex items-center gap-4 rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700">
              <span className="font-medium">Gender *</span>
              <label className="inline-flex items-center gap-1">
                <input type="radio" name="gender" checked={form.gender === "male"} onChange={() => setField("gender", "male")} />
                Male
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="radio" name="gender" checked={form.gender === "female"} onChange={() => setField("gender", "female")} />
                Female
              </label>
            </div>
            <select className="border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600">
              <option>Category *</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Contact Details</h3>
          <div className="grid gap-2 md:grid-cols-[260px_1fr]">
            <label className="border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">Complete Address *</label>
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" value={form.address} onChange={(e) => setField("address", e.target.value)} />
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="City *" value={form.city} onChange={(e) => setField("city", e.target.value)} />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="State *" value={form.state} onChange={(e) => setField("state", e.target.value)} />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Country" value="INDIA" readOnly />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="PIN Code *" value={form.pin} onChange={(e) => setField("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Telephone (optional)" />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Mobile *" value={form.mobile} onChange={(e) => setField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Email ID *" value={form.email} onChange={(e) => setField("email", e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Admission Details</h3>
          <div className="grid gap-2 md:grid-cols-[1.1fr_1.3fr_1fr_1.3fr]">
            <input className="border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm" value="REGISTRATION TYPE" readOnly />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" value="DIRECT" readOnly />
            <select
              className="border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600"
              value={form.course}
              onChange={(event) => setField("course", event.target.value)}
            >
              <option value="">Select Code</option>
              <option value="ADCA">ADCA</option>
              <option value="DCA">DCA</option>
              <option value="Tally">Tally</option>
            </select>
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Course Fees" />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Admission Date *" type="date" value={form.admissionDate} onChange={(e) => setField("admissionDate", e.target.value)} />
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <select className="border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600">
              <option>Qualification</option>
            </select>
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="College / School Name" />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="Year of Passing" />
            <input className="border border-slate-300 bg-white px-3 py-2.5 text-sm" placeholder="% Obtained" />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="border border-slate-300 bg-white p-2.5">
              <p className="text-xs font-semibold text-slate-700">Certificate / Marksheet</p>
              <p className="text-[11px] text-red-600">SIZE: 1000 x 1300px</p>
              <input type="file" className="mt-2 w-full border border-slate-300 bg-white px-2 py-1.5 text-sm" onChange={(e) => setCert(e.target.files?.[0] ?? null)} />
            </div>
            <div className="border border-slate-300 bg-white p-2.5">
              <p className="text-xs font-semibold text-slate-700">Aadhar Card</p>
              <p className="text-[11px] text-red-600">SIZE: 250 x 500px</p>
              <input type="file" className="mt-2 w-full border border-slate-300 bg-white px-2 py-1.5 text-sm" onChange={(e) => setAadhar(e.target.files?.[0] ?? null)} />
            </div>
          </div>
        </div>

        <div className="border border-slate-300 bg-white p-3 text-xs leading-6 text-slate-700">
          <label className="inline-flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <span>I hereby declare that all details provided by me are true and correct and I agree to institute rules.</span>
          </label>
        </div>

        {message ? (
          <p className={`rounded-sm px-3 py-2 text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
            {message.text}
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-3">
          <button type="submit" disabled={loading} className="rounded-sm bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button type="reset" onClick={() => setForm(initialState)} className="rounded-sm bg-red-500 px-6 py-2 text-sm font-semibold text-white hover:bg-red-600">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
