"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, LogIn } from "lucide-react";
import { useBrand } from "@/context/BrandContext";

export default function AdminLoginPage() {
  const { brandName, brandLogo } = useBrand();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = (await res.json()) as { message: string };
      if (!res.ok) {
        setError(data.message);
        return;
      }
      router.push("/admin/panel");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#0d1554] to-[#0a0aa1] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-4 shadow-lg overflow-hidden">
            {brandLogo ? (
               <img src={brandLogo} alt={brandName} className="w-full h-full object-contain p-2" />
            ) : (
               <ShieldCheck className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{brandName}</h1>
          <p className="text-blue-200 mt-1 text-sm uppercase tracking-widest font-black">Admin Control Panel</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                autoFocus
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
                  placeholder="Enter your password"
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

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium bg-red-500/20 border border-red-400/40 text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>


          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-blue-300 hover:text-white transition">
              ← Back to Website
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
