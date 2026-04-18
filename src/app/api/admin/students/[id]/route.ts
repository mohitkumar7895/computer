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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action } = await request.json();

    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    await connectDB();
    const student = await AtcStudent.findById(id);
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    if (action === "approved" && !student.registrationNo) {
      // Generate Reg No: TPCODE-YYMM-RANDOM
      const count = await AtcStudent.countDocuments({ tpCode: student.tpCode, registrationNo: { $ne: "" } });
      const dateCode = new Date().toISOString().slice(2,7).replace("-", ""); // YYMM
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
      const regNo = `${student.tpCode}-${dateCode}-${String(count + 1).padStart(3, "0")}-${randomSuffix}`;
      student.registrationNo = regNo;
    }

    student.status = action;
    await student.save();

    return NextResponse.json({ 
      message: `Student ${action} successfully`, 
      student,
      registrationNo: student.registrationNo 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
