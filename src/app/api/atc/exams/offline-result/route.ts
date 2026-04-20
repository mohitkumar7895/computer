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
    
    const formData = await request.formData();
    const examId = formData.get("examId") as string;
    const offlineExamStatus = formData.get("offlineExamStatus") as string;
    const totalScoreStr = formData.get("totalScore") as string;
    const offlineExamResult = formData.get("offlineExamResult") as string;
    const examCopyFile = formData.get("examCopy") as File | null;

    if (!examId) {
      return NextResponse.json({ message: "Exam ID is missing" }, { status: 400 });
    }

    await connectDB();

    // Ensure the exam belongs to this ATC
    const exam = await StudentExam.findOne({ _id: examId, atcId: decoded.id });
    if (!exam) {
      return NextResponse.json({ message: "Exam not found or unauthorized" }, { status: 404 });
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
