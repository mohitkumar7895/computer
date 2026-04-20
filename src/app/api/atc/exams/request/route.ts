import { NextResponse } from "next/server";
import { connectDB as dbConnect } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atc_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    const { studentId, examMode, offlineDetails } = await request.json();

    if (!studentId || !examMode) {
      return NextResponse.json({ message: "Student ID and Exam Mode are required" }, { status: 400 });
    }

    await dbConnect();

    // Check if there is already a pending or approved exam for this student
    const existingExam = await StudentExam.findOne({ 
      studentId, 
      status: "pending",
      $or: [{ approvalStatus: "pending" }, { approvalStatus: "approved" }]
    });

    if (existingExam) {
      return NextResponse.json({ message: "An exam request is already active for this student" }, { status: 400 });
    }

    const student = await AtcStudent.findById(studentId);
    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const newExam = new StudentExam({
      studentId,
      atcId: decoded.id,
      examMode,
      offlineDetails: examMode === "offline" ? offlineDetails : undefined,
      approvalStatus: "pending",
      status: "pending"
    });

    await newExam.save();

    return NextResponse.json({ message: "Exam request submitted successfully", exam: newExam });
  } catch (error: any) {
    console.error("Exam request error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
