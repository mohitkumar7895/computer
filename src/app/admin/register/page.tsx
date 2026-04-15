"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (form.password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = (await res.json()) as { message: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.message });
        return;
      }
      setMessage({ type: "success", text: "Registered successfully! Redirecting to login..." });
      setTimeout(() => router.push("/admin/login"), 1500);
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#0d1554] to-[#0a0aa1] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Registration</h1>
          <p className="text-blue-200 mt-1 text-sm">Create your admin account to manage ATC applications</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/60 outline-none focus:border-blue-300 focus:bg-white/15 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/60 outline-none focus:border-blue-300 focus:bg-white/15 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/60 outline-none focus:border-blue-300 focus:bg-white/15 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/60 outline-none focus:border-blue-300 focus:bg-white/15 transition text-sm"
              />
            </div>

            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  message.type === "success"
                    ? "bg-green-500/20 border border-green-400/40 text-green-200"
                    : "bg-red-500/20 border border-red-400/40 text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? "Registering..." : "Create Admin Account"}
            </button>
          </form>

          <p className="text-center text-sm text-blue-200 mt-6">
            Already have an account?{" "}
            <Link href="/admin/login" className="text-white font-semibold underline hover:text-blue-200 transition">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
