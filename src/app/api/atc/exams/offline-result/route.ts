import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
type OfflineExamStatus = "not_appeared" | "appeared" | "review_pending" | "published";
type OfflineExamResult = "Pass" | "Fail" | "Waiting";

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
      grade = formData.get("grade") as string;
      session = formData.get("session") as string;
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
    }

    if (!exam) {
      return NextResponse.json({ message: "Exam request not found for this student." }, { status: 404 });
    }

    if (String(exam.approvalStatus || "") !== "approved") {
      return NextResponse.json({ message: "Exam is not approved yet." }, { status: 400 });
    }

    let scheduledAt: Date | null = null;
    if (exam.examDateTime) {
      scheduledAt = new Date(exam.examDateTime);
    } else if (exam.examDate && exam.examTime) {
      const baseDate = new Date(exam.examDate);
      const [hours, minutes] = String(exam.examTime).split(":").map((part) => Number(part));
      if (!Number.isNaN(baseDate.getTime()) && Number.isFinite(hours) && Number.isFinite(minutes)) {
        baseDate.setHours(hours, minutes, 0, 0);
        scheduledAt = baseDate;
      }
    }
    if (scheduledAt && !Number.isNaN(scheduledAt.getTime()) && Date.now() < scheduledAt.getTime()) {
      return NextResponse.json(
        { message: "Result can only be submitted after scheduled exam date and time." },
        { status: 400 }
      );
    }

    let base64Copy = undefined;
    if (examCopyFile) {
      const isImage = examCopyFile.type.startsWith("image/");
      const isPdf = examCopyFile.type === "application/pdf";
      const sizeKb = examCopyFile.size / 1024;

      if (isImage && sizeKb > 100) {
        return NextResponse.json({ message: "Image copy is too large (max 100KB)" }, { status: 400 });
      }
      if (isPdf && sizeKb > 500) {
        return NextResponse.json({ message: "PDF copy is too large (max 500KB)" }, { status: 400 });
      }
      if (!isImage && !isPdf && sizeKb > 500) {
        return NextResponse.json({ message: "File copy is too large (max 500KB)" }, { status: 400 });
      }

      const buffer = await examCopyFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      base64Copy = `data:${examCopyFile.type || "application/pdf"};base64,${base64}`;
    }

    // Update StudentExam record
    const totalScore = parseInt(totalScoreStr) || 0;
    
    // ATC can only submit for review or as 'appeared'
    // If they were trying to 'publish', we set it to 'review_pending'
    const finalStatus = offlineExamStatus === "published" ? "review_pending" : offlineExamStatus;
    
    exam.offlineExamStatus = finalStatus as OfflineExamStatus;
    exam.offlineExamResult = offlineExamResult as OfflineExamResult;
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
  } catch (error: unknown) {
    console.error("[api/atc/exams/offline-result] Error:", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ message }, { status: 500 });
  }
}
