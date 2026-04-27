"use client";

import { useState, useEffect } from "react";
import { CreditCard, History, Printer, CheckCircle, AlertCircle, FileText, Plus, Minus } from "lucide-react";
import { apiFetch } from "@/utils/api";

interface Transaction {
  _id: string;
  date: string;
  receiptNo: string;
  paidFor: string;
  paymentMode: string;
  amount: number;
  type: "collect" | "return";
}

export default function StudentFeeView({ student }: { student: any }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/fee/history/${student._id}`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [student._id]);

  const printReceipt = (transaction: Transaction) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${transaction.receiptNo}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .receipt-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 16px; margin-top: 4px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background: #f9f9f9; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px; font-size: 14px; }
            .total-row { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="receipt-title">FEE RECEIPT</div>
            <div>Yukti Computer Education</div>
          </div>
          <div class="grid">
            <div>
              <div class="label">Receipt No</div>
              <div class="value">${transaction.receiptNo}</div>
            </div>
            <div style="text-align: right;">
              <div class="label">Date</div>
              <div class="value">${new Date(transaction.date).toLocaleDateString()}</div>
            </div>
            <div>
              <div class="label">Student Name</div>
              <div class="value">${student.name}</div>
            </div>
            <div style="text-align: right;">
              <div class="label">Registration No</div>
              <div class="value">${student.registrationNo}</div>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Payment Mode</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${transaction.paidFor} (${transaction.type === 'collect' ? 'Received' : 'Returned'})</td>
                <td>${transaction.paymentMode}</td>
                <td style="text-align: right;">₹${transaction.amount}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">Total Paid</td>
                <td style="text-align: right;">₹${transaction.amount}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 30px; font-size: 14px;">
            <p><strong>Remaining Dues:</strong> ₹${student.duesAmount}</p>
          </div>
          <div class="footer">
            <div>
              <p style="font-size: 10px; color: #999;">This is a computer generated receipt.</p>
            </div>
            <div class="signature">Authorized Signatory</div>
          </div>
          <script>window.print(); window.onafterprint = () => window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <CreditCard size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fee</p>
          <p className="text-3xl font-black text-slate-800 tracking-tight">₹{student.totalFee || student.admissionFees || 0}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
            <CheckCircle size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
          <p className="text-3xl font-black text-emerald-700 tracking-tight">₹{student.paidAmount || 0}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-red-500/5 group">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-6 group-hover:scale-110 transition-transform">
            <AlertCircle size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Dues</p>
          <p className="text-3xl font-black text-red-600 tracking-tight">
            ₹{(student.totalFee || Number(student.admissionFees) || 0) - (student.paidAmount || 0)}
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Payment Ledger</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Detailed history of all transactions</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/50">
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Receipt No</th>
                <th className="px-8 py-4">Paid For</th>
                <th className="px-8 py-4">Payment Mode</th>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                       <p className="text-xs font-bold text-slate-400 uppercase">Fetching Ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <FileText className="w-10 h-10 text-slate-200" />
                       <p className="text-sm font-bold text-slate-400 uppercase">No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-600">{new Date(t.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-700 border border-slate-200">
                      {t.receiptNo}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-500">{t.paidFor}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black uppercase text-slate-600">{t.paymentMode}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${t.type === 'collect' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {t.type === 'collect' ? <Plus className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                      {t.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-800">₹{t.amount}</td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => printReceipt(t)}
                      className="p-2.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-900"
                      title="Download Receipt"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice Block */}
      <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
               <ReceiptText className="w-10 h-10 text-white" />
            </div>
            <div>
               <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Automated Fee Tracking</h4>
               <p className="text-blue-100 font-medium opacity-80 leading-relaxed max-w-xl">
                 Your fee details are synchronized in real-time with the institution's financial core. If you notice any discrepancy in your paid amounts, please contact your study center head immediately.
               </p>
            </div>
         </div>
         <CreditCard className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5 transform -rotate-12" />
      </div>
    </div>
  );
}

function ReceiptText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M14 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  )
}
