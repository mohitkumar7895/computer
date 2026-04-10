import SectionWrapper from "@/components/SectionWrapper";
import { SITE_INFO } from "@/utils/constants";

export default function Contact() {
  return (
    <SectionWrapper
      id="contact"
      title="Contact Us"
      subtitle="Have questions? Send us a message and our team will get back to you."
      className="bg-slate-100"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200">
          <h3 className="text-2xl font-semibold text-slate-900">{SITE_INFO.name}</h3>
          <p className="text-slate-600">{SITE_INFO.tagline}</p>
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Email:</span> {SITE_INFO.email}
            </p>
            <p>
              <span className="font-semibold">Phone:</span> {SITE_INFO.phone}
            </p>
            <p>
              <span className="font-semibold">Address:</span> {SITE_INFO.address}
            </p>
          </div>
        </div>
        <form className="space-y-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="email"
            placeholder="Your Email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <textarea
            placeholder="Your Message"
            rows={5}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Send Message
          </button>
        </form>
      </div>
    </SectionWrapper>
  );
}
