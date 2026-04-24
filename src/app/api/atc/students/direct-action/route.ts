import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAtcUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atc_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; tpCode: string };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getAtcUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { studentId, action, totalFee } = await request.json();
    await connectDB();

    const student = await AtcStudent.findOne({ _id: studentId, tpCode: user.tpCode, isDirectAdmission: true });
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    if (action === "approved") {
      student.status = "pending_admin";
      student.registrationNo = `PENDING-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      student.totalFee = totalFee;
      student.admissionFees = String(totalFee);
      student.duesAmount = totalFee - (student.paidAmount || 0);
    } else if (action === "rejected") {
      student.status = "rejected";
    }

    await student.save();

    return NextResponse.json({ 
      message: `Student ${action} successfully.`,
      student 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
