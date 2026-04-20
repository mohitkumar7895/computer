import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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
    
    let studentId, offlineExamStatus, totalScoreStr, offlineExamResult, examCopyFile, grade, session, examId;

    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json();
      studentId = body.studentId;
      offlineExamStatus = body.offlineExamStatus;
      totalScoreStr = body.totalScore;
      offlineExamResult = body.offlineExamResult;
      grade = body.grade;
      session = body.session;
    } else {
      const formData = await request.formData();
      examId = formData.get("examId") as string;
      offlineExamStatus = formData.get("offlineExamStatus") as string;
      totalScoreStr = formData.get("totalScore") as string;
      offlineExamResult = formData.get("offlineExamResult") as string;
      examCopyFile = formData.get("examCopy") as File | null;
    }

    if (!examId && !studentId) {
      return NextResponse.json({ message: "Exam ID or Student ID is required" }, { status: 400 });
    }

    await connectDB();

    // Ensure the exam belongs to this ATC
    let exam;
    if (examId) {
      exam = await StudentExam.findOne({ _id: examId, atcId: decoded.id });
    } else if (studentId) {
      // Find the most recent offline exam for this student
      exam = await StudentExam.findOne({ studentId, atcId: decoded.id, examMode: "offline" }).sort({ createdAt: -1 });
      
      // If no offline exam record exists at all, CREATE one (Direct Entry mode)
      if (!exam) {
        exam = new StudentExam({
          studentId,
          atcId: decoded.id,
          examMode: "offline",
          approvalStatus: "approved", // Mark as approved by default for direct entry
          status: "pending"
        });
      }
    }

    let base64Copy = undefined;
    if (examCopyFile) {
      if (examCopyFile.size > 8 * 1024 * 1024) { // 8MB limit
         return NextResponse.json({ message: "PDF file is too large (max 8MB)" }, { status: 400 });
      }
      const buffer = await examCopyFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      base64Copy = `data:application/pdf;base64,${base64}`;
    }

    // Update StudentExam record
    const totalScore = parseInt(totalScoreStr) || 0;
    
    // ATC can only submit for review or as 'appeared'
    // If they were trying to 'publish', we set it to 'review_pending'
    const finalStatus = offlineExamStatus === "published" ? "review_pending" : offlineExamStatus;
    
    exam.offlineExamStatus = finalStatus as any;
    exam.offlineExamResult = offlineExamResult as any;
    exam.totalScore = totalScore;
    if (base64Copy) exam.offlineExamCopy = base64Copy;
    
    // We don't set status to completed here anymore if it's pending review
    if (finalStatus === "review_pending") {
      exam.status = "pending"; // Still pending until Admin approves result
      exam.resultDeclared = false;
      // Store additional info in exam metadata for admin approval
      if (grade) exam.grade = grade;
      if (session) exam.session = session;
    }

    await exam.save();

    // Sync to AtcStudent profile
    await AtcStudent.findByIdAndUpdate(exam.studentId, {
      offlineExamStatus: finalStatus,
      offlineExamMarks: totalScoreStr,
      offlineExamResult,
      offlineExamCopy: base64Copy || exam.offlineExamCopy
    });

    return NextResponse.json({ message: "Exam result updated successfully" });
  } catch (error: any) {
    console.error("[api/atc/exams/offline-result] Error:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
  }
}
