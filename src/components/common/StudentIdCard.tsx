"use client";

import React, { useRef } from "react";
import { Download, Printer } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

interface StudentIdCardProps {
  student: {
    photo?: string;
    name: string;
    fatherName?: string;
    dob: string;
    course: string;
    registrationNo: string;
    admissionDate?: string;
    centerName?: string;
    centerAddress?: string;
    centerMobile?: string;
    centerSign?: string;
  };
  backgrounds?: {
    front?: string;
    back?: string;
  };
}

export default function StudentIdCard({ student, backgrounds = {} }: StudentIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const cardWidth = "350px";
  const cardHeight = "550px";

  // This ensures the Print is EXACTLY like the Download
  const handlePrint = async () => {
    if (!cardRef.current) return;
    
    try {
        // High quality capture first
        const dataUrl = await toPng(cardRef.current, {
            quality: 1,
            pixelRatio: 4, // Very high detail for print
            backgroundColor: "#ffffff",
        });

        // Open a new window and print the captured image
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print ID Card - ${student.name}</title>
                        <style>
                            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: white; }
                            img { width: 100%; height: auto; max-width: 297mm; }
                            @page { size: A4 landscape; margin: 0; }
                            @media print {
                                body { margin: 0; }
                                img { width: 100%; height: auto; }
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${dataUrl}" onload="window.print(); window.close();" />
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    } catch (error) {
        console.error("Print failed:", error);
        window.print(); // Fallback
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = 260; // Wider for better fit in landscape
      const rect = cardRef.current.getBoundingClientRect();
      const imgHeight = (rect.height * imgWidth) / rect.width;
      
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`${student.name.replace(/\s+/g, "_")}_ID_Card.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Something went wrong. Try using 'Print ID Card' instead.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 no-print mb-4">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-8 py-4 bg-[#0a0a2e] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-black transition transform active:scale-95 border border-white/10"
        >
          <Printer className="w-4 h-4" /> Print ID Document
        </button>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-8 py-4 bg-[#0a0aa1] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-blue-800 transition transform active:scale-95 border border-white/10"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* ── CARD CONTAINER ── */}
      <div 
        ref={cardRef}
        className="flex flex-row gap-12 justify-center items-center py-12 px-12 bg-white"
        style={{ backgroundColor: '#ffffff', minWidth: '850px' }}
      >
        {/* ── FRONT SIDE ── */}
        <div 
          className="relative overflow-hidden shadow-2xl rounded-[2.5rem]"
          style={{ width: cardWidth, height: cardHeight, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
        >
          {/* Background */}
          {backgrounds?.front && (
            <img src={backgrounds.front} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}

          {/* Content Overlay */}
          <div className="relative z-10 w-full h-full flex flex-col p-10 pt-12">
            <div className="text-center mb-6">
                <h1 className="text-[14px] font-black uppercase tracking-[0.25em] leading-none px-4" style={{ color: '#0a0a2e' }}>YUKTI COMPUTER EDUCATION</h1>
                <div className="flex justify-center flex-wrap gap-2 mt-3">
                  <span className="text-[8px] font-black border px-3 py-1 rounded-full uppercase tracking-tighter" style={{ color: '#64748b', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>www.yuktieducation.in</span>
                  <span className="text-[8px] font-black border px-3 py-1 rounded-full uppercase tracking-tighter" style={{ color: '#64748b', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>MOB: +91 9310898801</span>
                </div>
            </div>

            <div className="flex flex-col items-center mt-6">
                <div className="w-32 h-32 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl" style={{ backgroundColor: '#f1f5f9', color: '#cbd5e1' }}>👤</div>
                  )}
                </div>
            </div>

            <div className="text-center mt-6">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-1" style={{ color: '#0a0a2e' }}>{student.name}</h2>
                <div className="inline-block px-5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]" style={{ backgroundColor: '#0a0aa1', color: '#ffffff' }}>{student.course}</div>
            </div>

            <div className="mt-10 space-y-3.5 px-2 text-left">
                <DataRow label="FATHER NAME" value={student.fatherName || "---"} />
                <DataRow label="DATE OF BIRTH" value={student.dob} />
                <DataRow label="REGISTRATION NO" value={student.registrationNo} highlight />
                <DataRow label="ADMISSION DATE" value={student.admissionDate || "---"} />
            </div>

            <div className="mt-auto pt-8 flex justify-between items-center px-2">
                <div className="flex flex-col items-start">
                  <span className="text-[7px] font-black uppercase tracking-[0.4em]" style={{ color: '#94a3b8' }}>VALID UNTIL</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#0a0a2e]">COURSE END</span>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                   <span className="text-[6px] font-black text-slate-300 uppercase">QR CODE</span>
                </div>
            </div>
          </div>
        </div>

        {/* ── BACK SIDE ── */}
        <div 
          className="relative overflow-hidden shadow-2xl rounded-[2.5rem]"
          style={{ width: cardWidth, height: cardHeight, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
        >
          {/* Background */}
          {backgrounds?.back && (
            <img src={backgrounds.back} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}

          {/* Content Overlay */}
          <div className="relative z-10 w-full h-full flex flex-col p-10 pt-20 text-left">
              <div className="mt-6 space-y-8">
                  <div>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: '#0a0aa1' }}>ASSIGNED TRAINING CENTER</h3>
                    <div className="p-5 rounded-3xl border" style={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9 shadow-sm' }}>
                        <p className="text-[13px] font-black uppercase leading-tight mb-3" style={{ color: '#0a0a2e' }}>{student.centerName || "Not Assigned"}</p>
                        <p className="text-[11px] font-bold leading-relaxed italic line-clamp-3 text-slate-500">{student.centerAddress || "Center address details not found in application records."}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: '#0a0aa1' }}>CENTER CONTACT</h3>
                    <p className="text-sm font-black tracking-widest" style={{ color: '#0a0a2e' }}>{student.centerMobile || "---"}</p>
                  </div>
              </div>

              <div className="mt-auto flex flex-col items-center pb-12">
                <div className="w-full max-w-[200px] flex flex-col items-center">
                    <div className="h-20 w-full flex items-center justify-center relative mb-2">
                      {student.centerSign ? (
                        <img src={student.centerSign} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                      ) : (
                        <div className="w-28 h-full border border-dashed rounded-2xl flex items-center justify-center italic text-[9px]" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#94a3b8' }}>AUTHORIZED SIGNATURE</div>
                      )}
                    </div>
                    <div className="w-full h-[1px]" style={{ backgroundColor: '#e2e8f0' }} />
                    <p className="text-[8px] font-black uppercase mt-3 tracking-[0.4em]" style={{ color: '#94a3b8' }}>HEAD OFFICE SEAL & SIGN</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[7px] font-bold uppercase tracking-widest leading-loose" style={{ color: '#cbd5e1' }}>
                  THIS CARD IS PROPERTY OF YUKTI EDUCATION CENTER.<br/>
                  IF FOUND PLEASE RETURN TO THE ABOVE ADDRESS.
                </p>
              </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
            body { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function DataRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col border-b py-2 last:border-0" style={{ borderBottomColor: '#f1f5f9' }}>
       <span className="text-[7px] font-black uppercase tracking-[0.3em] mb-0.5" style={{ color: '#94a3b8' }}>{label}</span>
       <span className={`text-[11px] font-black truncate`} style={{ color: highlight ? '#1d4ed8' : '#0a0a2e', paddingBottom: highlight ? '2px' : '0' }}>{value}</span>
    </div>
  );
}
