"use client";

import { Fragment, type FormEvent, useMemo, useState } from "react";

type InfrastructureRow = {
  rooms: string;
  seats: string;
  area: string;
};

type FormState = {
  processFee: string;
  trainingPartnerName: string;
  trainingPartnerAddress: string;
  totalName: string;
  district: string;
  state: string;
  pin: string;
  country: string;
  mobile: string;
  email: string;
  statusOfInstitution: string;
  yearOfEstablishment: string;
  chiefName: string;
  designation: string;
  educationQualification: string;
  professionalExperience: string;
  dob: string;
  paymentMode: string;
};

const initialFormState: FormState = {
  processFee: "",
  trainingPartnerName: "",
  trainingPartnerAddress: "",
  totalName: "",
  district: "",
  state: "",
  pin: "",
  country: "INDIA",
  mobile: "",
  email: "",
  statusOfInstitution: "",
  yearOfEstablishment: "",
  chiefName: "",
  designation: "",
  educationQualification: "",
  professionalExperience: "",
  dob: "",
  paymentMode: "",
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

export default function BecomeAtcForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [infra, setInfra] = useState<Record<(typeof infraFields)[number], InfrastructureRow>>(emptyInfra);

  const errors = useMemo(() => {
    const result: string[] = [];
    if (!form.processFee) result.push("Please select affiliation process fee.");
    if (!form.trainingPartnerName.trim()) result.push("Training partner name is required.");
    if (!form.trainingPartnerAddress.trim()) result.push("Training partner address is required.");
    if (!form.totalName.trim()) result.push("Total name is required.");
    if (!form.district.trim()) result.push("District is required.");
    if (!form.state) result.push("State is required.");
    if (!/^\d{6}$/.test(form.pin)) result.push("PIN must be 6 digits.");
    if (!/^\d{10}$/.test(form.mobile)) result.push("Mobile must be 10 digits.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) result.push("Valid email is required.");
    if (!form.statusOfInstitution.trim()) result.push("Status of institution is required.");
    if (!form.yearOfEstablishment.trim()) result.push("Year of establishment is required.");
    if (!form.chiefName.trim()) result.push("Chief executive/principal/director name is required.");
    if (!form.designation.trim()) result.push("Designation is required.");
    if (!form.educationQualification.trim()) result.push("Education qualification is required.");
    if (!form.professionalExperience.trim()) result.push("Professional experience is required.");
    if (!form.dob.trim()) result.push("D.O.B is required.");
    if (!form.paymentMode) result.push("Please select payment mode.");
    return result;
  }, [form]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (errors.length) {
      setMessage({ type: "error", text: errors[0] });
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (photo) payload.append("photo", photo);
      payload.append("infrastructure", JSON.stringify(infra));

      const response = await fetch("/api/become-atc", {
        method: "POST",
        body: payload,
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage({ type: "error", text: data.message ?? "Form submission failed. Try again." });
        return;
      }

      setMessage({ type: "success", text: "Application submitted successfully." });
      setForm(initialFormState);
      setInfra(emptyInfra);
      setPhoto(null);
    } catch {
      setMessage({ type: "error", text: "Network error while submitting form." });
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setForm(initialFormState);
    setInfra(emptyInfra);
    setPhoto(null);
    setMessage(null);
  };

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-auto">
      <h2 className="text-center text-2xl font-extrabold uppercase tracking-wide text-slate-800 sm:text-4xl lg:text-5xl">
        Application Form For Authorized Learning Partner
      </h2>

      <div className="mt-8 border border-slate-300 bg-[#efefef]">
        <div className="border-b border-slate-300 px-4 py-2">
          <h3 className="text-lg font-extrabold uppercase tracking-wide text-slate-800 sm:text-2xl lg:text-4xl">
            Application Form For Authorized Learning Partner
          </h3>
        </div>

        <form className="p-2 sm:p-4" onSubmit={onSubmit} onReset={onReset}>
          <div className="border border-slate-300 bg-white">
            <div className="border-b border-slate-300 px-3 py-2">
              <h4 className="text-xl font-bold text-slate-800">
                Information About Training Partner{" "}
                <span className="text-xs font-medium text-red-500">(All fields are mandatory)</span>
              </h4>
            </div>

            <div className="grid gap-px bg-slate-300 md:grid-cols-4">
              <input className="bg-white px-3 py-2.5 text-sm" value="Applying For" readOnly />
              <input className="bg-white px-3 py-2.5 text-sm" value="Authorized Training Partner" readOnly />
              <input className="bg-white px-3 py-2.5 text-sm" value="Affiliation Process Fee" readOnly />
              <select
                className="bg-white px-3 py-2.5 text-sm text-slate-600"
                value={form.processFee}
                onChange={(event) => setField("processFee", event.target.value)}
              >
                <option value="">Select</option>
                <option value="1000">1000</option>
                <option value="1500">1500</option>
                <option value="2000">2000</option>
              </select>
            </div>

            <div className="mt-px grid gap-px bg-slate-300 md:grid-cols-[220px_1fr]">
              <label className="bg-white px-3 py-2.5 text-sm">Training Partner Name</label>
              <input
                className="bg-white px-3 py-2.5 text-sm"
                value={form.trainingPartnerName}
                onChange={(event) => setField("trainingPartnerName", event.target.value)}
              />
            </div>
            <div className="mt-px grid gap-px bg-slate-300 md:grid-cols-[220px_1fr]">
              <label className="bg-white px-3 py-2.5 text-sm">Training Partner Address</label>
              <input
                className="bg-white px-3 py-2.5 text-sm"
                value={form.trainingPartnerAddress}
                onChange={(event) => setField("trainingPartnerAddress", event.target.value)}
              />
            </div>
            <div className="mt-px grid gap-px bg-slate-300 md:grid-cols-[220px_1fr]">
              <label className="bg-white px-3 py-2.5 text-sm">Total Name</label>
              <input
                className="bg-white px-3 py-2.5 text-sm"
                value={form.totalName}
                onChange={(event) => setField("totalName", event.target.value)}
              />
            </div>

            <div className="mt-px grid gap-px bg-slate-300 md:grid-cols-4">
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="District"
                value={form.district}
                onChange={(event) => setField("district", event.target.value)}
              />
              <select
                className="bg-white px-3 py-2.5 text-sm text-slate-600"
                value={form.state}
                onChange={(event) => setField("state", event.target.value)}
              >
                <option value="">Select</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
              </select>
              <input className="bg-white px-3 py-2.5 text-sm" value="Country" readOnly />
              <input className="bg-white px-3 py-2.5 text-sm" value="INDIA" readOnly />
            </div>

            <div className="mt-px grid gap-px bg-slate-300 md:grid-cols-4">
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="PIN"
                value={form.pin}
                onChange={(event) => setField("pin", event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="Mobile"
                value={form.mobile}
                onChange={(event) => setField("mobile", event.target.value.replace(/\D/g, "").slice(0, 10))}
              />
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
              />
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="Year Of Establishment"
                value={form.yearOfEstablishment}
                onChange={(event) => setField("yearOfEstablishment", event.target.value)}
              />
            </div>

            <div className="mt-px grid gap-px bg-slate-300 md:grid-cols-[220px_1fr]">
              <label className="bg-white px-3 py-2.5 text-sm">Status of Institution</label>
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="Trust / Society / Other"
                value={form.statusOfInstitution}
                onChange={(event) => setField("statusOfInstitution", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 border border-slate-300 bg-white">
            <div className="border-b border-slate-300 px-3 py-2">
              <h4 className="text-xl font-bold text-slate-800">Information About the Chief Executive/Principal/Director of the Institute</h4>
            </div>
            <div className="grid gap-px bg-slate-300 md:grid-cols-2">
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="Name"
                value={form.chiefName}
                onChange={(event) => setField("chiefName", event.target.value)}
              />
              <input
                type="file"
                className="bg-white px-3 py-2 text-sm"
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              />
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="Designation/Position"
                value={form.designation}
                onChange={(event) => setField("designation", event.target.value)}
              />
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="Education Qualification"
                value={form.educationQualification}
                onChange={(event) => setField("educationQualification", event.target.value)}
              />
              <input
                className="bg-white px-3 py-2.5 text-sm"
                placeholder="Professional Experience"
                value={form.professionalExperience}
                onChange={(event) => setField("professionalExperience", event.target.value)}
              />
              <input
                type="date"
                className="bg-white px-3 py-2.5 text-sm"
                value={form.dob}
                onChange={(event) => setField("dob", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 border border-slate-300 bg-white">
            <div className="border-b border-slate-300 px-3 py-2">
              <h4 className="text-xl font-bold text-slate-800">Infrastructure Facility</h4>
            </div>
            <div className="grid gap-px bg-slate-300 text-sm md:grid-cols-4">
              <p className="bg-white px-3 py-2 font-semibold">PARTICULARS</p>
              <p className="bg-white px-3 py-2 font-semibold">NO.OF ROOMS</p>
              <p className="bg-white px-3 py-2 font-semibold">SEATING CAPACITY</p>
              <p className="bg-white px-3 py-2 font-semibold">TOTAL AREA (Sq.Ft.)</p>
              {infraFields.map((item) => (
                <Fragment key={item}>
                  <p className="bg-white px-3 py-2.5">{item}</p>
                  <input
                    className="bg-white px-3 py-2.5"
                    value={infra[item].rooms}
                    onChange={(event) =>
                      setInfra((current) => ({
                        ...current,
                        [item]: { ...current[item], rooms: event.target.value },
                      }))
                    }
                  />
                  <input
                    className="bg-white px-3 py-2.5"
                    value={infra[item].seats}
                    onChange={(event) =>
                      setInfra((current) => ({
                        ...current,
                        [item]: { ...current[item], seats: event.target.value },
                      }))
                    }
                  />
                  <input
                    className="bg-white px-3 py-2.5"
                    value={infra[item].area}
                    onChange={(event) =>
                      setInfra((current) => ({
                        ...current,
                        [item]: { ...current[item], area: event.target.value },
                      }))
                    }
                  />
                </Fragment>
              ))}
            </div>
          </div>

          <div className="mt-3 border border-slate-300 bg-white p-3">
            <p className="text-sm font-semibold text-slate-700">Payment Mode</p>
            <div className="mt-2 flex flex-wrap items-center gap-5 text-sm text-slate-600">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="paymentMode"
                  checked={form.paymentMode === "gpay"}
                  onChange={() => setField("paymentMode", "gpay")}
                />
                Google Pay (G-Pay)
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="paymentMode"
                  checked={form.paymentMode === "online"}
                  onChange={() => setField("paymentMode", "online")}
                />
                Online Payment
              </label>
            </div>
          </div>

          {message ? (
            <p
              className={`mt-3 rounded-sm px-3 py-2 text-sm ${
                message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-sm bg-cyan-500 px-5 py-2 text-xs font-bold uppercase text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
            <button type="reset" className="rounded-sm bg-blue-600 px-5 py-2 text-xs font-bold uppercase text-white hover:bg-blue-700">
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
