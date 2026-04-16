"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, BookOpen, ScrollText, User, 
  Settings, LogOut, CheckCircle, Calendar, 
  MapPin, Phone, Mail, Award, Clock, Download,
  Fingerprint, CreditCard, ShieldCheck
} from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/me")
      .then(async (res) => {
        if (!res.ok) { router.push("/student/login"); return; }
        const data = await res.json();
        setStudent(data.student);
      })
      .catch(() => router.push("/student/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/student/logout", { method: "POST" });
    router.push("/student/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { visibility: hidden !important; background: white !important; }
          #student-id-card-container { 
            visibility: visible !important; 
            position: fixed !important; 
            top: 50% !important; 
            left: 50% !important; 
            transform: translate(-50%, -50%) scale(1.4) !important;
            display: flex !important;
            justify-content: center !important;
            width: 100% !important;
          }
          #student-id-card, #student-id-card * { 
            visibility: visible !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="font-black text-slate-800 text-lg tracking-tight">Student Portal</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Welcome & Info */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-[#0a0a2e] to-[#0a0aa1] rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6 bg-white/10 w-fit px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                  <Fingerprint className="w-4 h-4 text-blue-300" />
                  <span className="text-[10px] uppercase font-black tracking-[0.2em]">Verified Student</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight leading-tight">
                  Welcome back,<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100 italic">{student.name}!</span>
                </h1>
                <p className="text-blue-100 font-medium text-lg leading-relaxed max-w-lg opacity-90">
                  Your journey in <span className="text-white font-bold border-b-2 border-blue-400 pb-0.5">{student.course}</span> continues. Access your resources and track your progress below.
                </p>
                
                <div className="flex flex-wrap gap-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[120px]">
                    <span className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-1">Status</span>
                    <span className="text-sm font-black flex items-center gap-1.5 uppercase">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      {student.status}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[120px]">
                    <span className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-1">Session</span>
                    <span className="text-sm font-black uppercase">{new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-[80px] group-hover:bg-blue-300/30 transition-all duration-700" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/30 rounded-full blur-[60px]" />
              <ScrollText className="absolute bottom-10 right-10 text-white/5 w-40 h-40 transform rotate-12" />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: "Registration No", value: student.registrationNo, icon: ShieldCheck, bg: "bg-blue-600 text-white", labelCol: "text-blue-200" },
                { label: "Center TP Code", value: student.tpCode, icon: BookOpen, bg: "bg-white text-slate-800 border-slate-100", labelCol: "text-slate-400" },
                { label: "Enrolled Course", value: student.course, icon: GraduationCap, bg: "bg-white text-slate-800 border-slate-100", labelCol: "text-slate-400" },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} p-6 rounded-[2rem] shadow-sm border flex flex-col justify-between h-full relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
                  <stat.icon className={`w-8 h-8 mb-4 ${stat.labelCol.includes('blue') ? 'text-white/40' : 'text-blue-600/20'}`} />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.labelCol}`}>{stat.label}</p>
                    <p className="font-black text-sm tracking-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ID CARD DOWNLOAD SECTION */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <CreditCard className="text-blue-600" /> Virtual Identity Card
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Carry your official student identification everywhere.</p>
                </div>
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition shadow-lg shrink-0"
                >
                  <Download className="w-4 h-4" /> Download ID Card
                </button>
              </div>

              {/* ID CARD MOCKUP */}
              <div className="flex justify-center" id="student-id-card-container">
                <div id="student-id-card" className="w-[340px] h-[520px] bg-white rounded-3xl shadow-2xl overflow-hidden relative border border-slate-200 print:shadow-none print:border-slate-300">
                  {/* Card Front */}
                  <div className="h-[43%] bg-gradient-to-br from-[#0a0a2e] to-[#0a0aa1] p-6 relative flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 mb-6">
                      <GraduationCap className="text-blue-400 w-5 h-5 fill-blue-400/20" />
                      <span className="text-white text-[12px] font-black tracking-widest uppercase italic">YUKTI EDUCATION</span>
                    </div>
                    
                    <div className="relative">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-2xl relative z-10" />
                      ) : (
                        <div className="w-32 h-32 rounded-2xl bg-white flex items-center justify-center shadow-2xl relative z-10">
                          <User size={60} className="text-slate-200" />
                        </div>
                      )}
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] font-bold px-3 py-1 rounded-full border-2 border-white z-20 shadow-lg uppercase tracking-widest">Active</div>
                    </div>
                  </div>

                  {/* Card Back Details */}
                  <div className="p-8 pt-10 text-center">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">{student.name}</h3>
                    <p className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-8">{student.course}</p>
                    
                    <div className="space-y-4 text-left px-2">
                      <div className="grid grid-cols-2 border-b border-slate-50 pb-2 gap-4">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Reg. ID</span>
                          <span className="text-[10px] font-black text-slate-800 break-all">{student.registrationNo}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Center Code</span>
                          <span className="text-[10px] font-black text-slate-800 break-all">{student.tpCode}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contact No.</span>
                        <span className="text-[11px] font-black text-slate-800">{student.mobile}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">D.O.B</span>
                        <span className="text-[11px] font-black text-slate-800">{student.dob}</span>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col items-center">
                      <div className="text-[9px] font-bold text-slate-500 italic mb-2">Seal of yukti education</div>
                      <ShieldCheck className="w-10 h-10 text-blue-600 opacity-20" />
                    </div>
                  </div>

                  {/* Card Accents */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Profile Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 backdrop-blur-xl group hover:shadow-2xl transition-all duration-500">
               <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                 <User className="text-blue-600" /> My Profile
               </h3>
               <div className="space-y-6">
                  {[
                    { icon: Phone, label: "Mobile", value: student.mobile, bg: "bg-blue-50", text: "text-blue-600" },
                    { icon: Mail, label: "Email", value: student.email || 'N/A', bg: "bg-indigo-50", text: "text-indigo-600" },
                    { icon: MapPin, label: "Address", value: student.currentAddress, bg: "bg-emerald-50", text: "text-emerald-600" },
                    { icon: ShieldCheck, label: "Center Code", value: student.tpCode, bg: "bg-amber-50", text: "text-amber-600" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-2xl ${item.bg} ${item.text} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                        <item.icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-sm font-bold text-slate-800 truncate leading-tight mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Notification / Alert Box */}
            <div className="bg-[#0a0a2e] rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl">
              <div className="relative z-10">
                <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                   <Award className="text-blue-400" /> Notice Board
                </h4>
                <div className="space-y-4 mt-6">
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition cursor-default">
                      <p className="text-[10px] uppercase font-black tracking-widest text-blue-300 mb-1">New Update</p>
                      <p className="text-xs font-medium leading-relaxed">Your application has been approved and portal access is granted.</p>
                   </div>
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition cursor-default opacity-60">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">System</p>
                      <p className="text-xs font-medium leading-relaxed italic">Stay tuned for course materials and live tests.</p>
                   </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
            </div>

            {/* Help Button */}
            <button className="w-full bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all duration-300">
               <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <Settings />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase tracking-tight">Need Help?</p>
                    <p className="text-xs text-slate-500 font-medium italic">Contact Your Center</p>
                  </div>
               </div>
               <ScrollText className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </button>

          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200">
        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Yukti Computer Education • All Rights Reserved
        </p>
      </footer>
    </div>
    </>
  );
}
