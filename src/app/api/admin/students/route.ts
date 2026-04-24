import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function verifyAdmin(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const students = await AtcStudent.find({
      $or: [
        { isDirectAdmission: { $ne: true } }, // Regular students
        { isDirectAdmission: true, status: { $in: ["pending_admin", "approved", "active", "rejected"] } } // Only if reviewed by ATC
      ]
    }).sort({ createdAt: -1 }).lean();
    
    // Merge media (only photo to reduce payload)
    const { StudentMedia } = await import("@/models/StudentMedia");
    // Fetch transactions and merge balances for each student
    const { FeeTransaction } = await import("@/models/FeeTransaction");
    const studentsWithRealBalances = await Promise.all(students.map(async (s: any) => {
      const media = await StudentMedia.find({ studentId: s._id, fieldName: "photo" }).select("fieldName content").lean();
      const mediaMap: any = {};
      media.forEach((m: any) => { mediaMap[m.fieldName] = m.content; });
      
      const txs = await FeeTransaction.find({ studentId: s._id }).lean();
      const totalPaid = txs.reduce((acc: number, t: any) => acc + (t.type === 'collect' ? t.amount : -t.amount), 0);
      const totalAdmission = s.totalFee || Number(s.admissionFees) || 0;

      return { 
        ...s, 
        ...mediaMap,
        totalFee: totalAdmission,
        paidAmount: totalPaid,
        duesAmount: totalAdmission - totalPaid
      };
    }));

    return NextResponse.json({ students: studentsWithRealBalances });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
