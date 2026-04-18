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
    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const status = formData.get("status") as string;
    const marks = formData.get("marks") as string;
    const resultStatus = formData.get("resultStatus") as string;
    const examCopyFile = formData.get("examCopy") as File | null;

    if (!studentId) return NextResponse.json({ message: "Student ID target required" }, { status: 400 });

    await connectDB();
    const student = await AtcStudent.findOne({ _id: studentId, atcId: user.id });
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    student.offlineExamStatus = status as any;
    student.offlineExamMarks = marks;
    student.offlineExamResult = resultStatus as any;

    if (examCopyFile && examCopyFile.size > 0) {
      const arrayBuffer = await examCopyFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      student.offlineExamCopy = `data:application/pdf;base64,${buffer.toString("base64")}`;
    }

    await student.save();

    return NextResponse.json({ message: "Offline exam record updated", student });
  } catch (error: any) {
    console.error("[offline-exam error]", error);
    return NextResponse.json({ message: error.message || "Failed to update record" }, { status: 500 });
  }
}
