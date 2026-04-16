"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, LayoutDashboard, LogOut, Bell, CheckCircle,
  Phone, Mail, User, Calendar, MapPin, Menu, XCircle, Users, PlusCircle
} from "lucide-react";
import StudentManager from "@/components/atc/StudentManager";

interface AtcUser {
  id: string;
  tpCode: string;
  trainingPartnerName: string;
}

export default function AtcDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AtcUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "students">("dashboard");

  useEffect(() => {
    fetch("/api/atc/me")
      .then(async (res) => {
        if (res.status === 401) { router.push("/atc/login"); return; }
        const data = (await res.json()) as { user: AtcUser };
        setUser(data.user);
      })
      .catch(() => router.push("/atc/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/atc/logout", { method: "POST" });
    router.push("/atc/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const currentDate = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#0a2e1a] to-[#0a7a3b] text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">ATC Portal</p>
              <p className="text-green-300 text-xs truncate max-w-[130px]">{user.tpCode}</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition">
            <XCircle className="w-5 h-5 text-green-200" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => { setTab("dashboard"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "dashboard" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => { setTab("students"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "students" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <Users className="w-4 h-4" /> My Students
          </button>
        </nav>

        <div className="px-4 py-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition"
          >
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
              <Building2 className="w-6 h-6 text-green-700" />
              <span className="font-bold text-slate-800 text-sm">ATC Portal</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-slate-800">{tab === "dashboard" ? "Dashboard" : "Student Management"}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{currentDate}</p>
          </div>
          <div className="lg:hidden">
            <span className="text-[10px] bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold uppercase">{tab}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow">
              {user.trainingPartnerName.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {tab === "dashboard" && (
            <>
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-[#0a2e1a] via-[#0d4d2e] to-[#0a7a3b] rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span className="text-green-300 text-sm font-semibold">Account Active</span>
                  </div>
                  <h2 className="text-2xl font-extrabold leading-tight">
                    Welcome, {user.trainingPartnerName}!
                  </h2>
                  <p className="text-green-200 text-sm mt-1">Your Authorized Training Center portal is ready.</p>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                  <p className="text-xs text-green-300 font-semibold mb-0.5">Your TP Code</p>
                  <p className="text-2xl font-extrabold tracking-wider">{user.tpCode}</p>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "TP Code", value: user.tpCode, icon: Building2, color: "green" },
                  { label: "Portal Status", value: "Active", icon: CheckCircle, color: "emerald" },
                  { label: "Role", value: "ATC Partner", icon: User, color: "teal" },
                  { label: "Access Level", value: "Standard", icon: LayoutDashboard, color: "green" },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-${card.color}-50 flex items-center justify-center shrink-0`}>
                      <card.icon className={`w-5 h-5 text-${card.color}-600`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Info Block */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" /> Account Information
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: Building2, label: "Training Partner", value: user.trainingPartnerName },
                      { icon: Mail, label: "Portal ID", value: user.tpCode },
                      { icon: CheckCircle, label: "Status", value: "Approved & Active" },
                      { icon: Calendar, label: "Session", value: new Date().getFullYear().toString() },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <item.icon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notice Board */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-green-600" /> Notice Board
                  </h3>
                  <div className="space-y-3">
                    {[
                      { title: "Welcome to ATC Portal", desc: "Your application has been approved. You can now access the ATC dashboard.", date: "Today", hot: true },
                      { title: "Default Password", desc: "Please change your default password (mobile number) for security.", date: "Action Required", hot: true },
                      { title: "Upcoming Features", desc: "Student registration, course management and more features coming soon.", date: "Info", hot: false },
                    ].map((notice, i) => (
                      <div key={i} className="flex gap-3 py-2.5 border-b border-slate-50 last:border-0">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notice.hot ? "bg-green-500" : "bg-slate-300"}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{notice.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{notice.desc}</p>
                          <p className="text-xs text-green-600 font-semibold mt-1">{notice.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">Need Help?</h3>
                  <p className="text-slate-300 text-sm mt-0.5">Contact our support team for any assistance.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="tel:+919272638590" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition">
                    <Phone className="w-4 h-4" /> +91 9272638590
                  </a>
                  <a href="mailto:info@yukticomputer.com" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition">
                    <Mail className="w-4 h-4" /> Email Support
                  </a>
                  <a href="/" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition">
                    <MapPin className="w-4 h-4" /> Visit Website
                  </a>
                </div>
              </div>
            </>
          )}

          {tab === "students" && (
            <StudentManager />
          )}
        </div>
      </main>
    </div>
  );
}
