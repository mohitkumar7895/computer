import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ExamQuestion } from "@/models/ExamQuestion";
import { StudentExam } from "@/models/StudentExam";
import "@/models/QuestionSet"; // Register model dependency
import { lifecycleStatusForExam } from "@/lib/exam-schedule";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get("setId");
  const examId = searchParams.get("examId");
  const studentId = searchParams.get("studentId");

  if (!setId || !examId || !studentId) {
    return NextResponse.json({ message: "setId, examId and studentId are required" }, { status: 400 });
  }

  try {
    await connectDB();
    const exam = await StudentExam.findById(examId).lean();
    if (!exam || String(exam.studentId) !== String(studentId)) {
      return NextResponse.json({ message: "Exam record not found." }, { status: 404 });
    }
    if (exam.examMode !== "online") {
      return NextResponse.json({ message: "Only online exams can be started." }, { status: 400 });
    }
    if (exam.approvalStatus !== "approved") {
      return NextResponse.json({ message: "Exam is not approved yet." }, { status: 403 });
    }
    if (exam.status === "completed") {
      return NextResponse.json({ message: "Exam attempt already completed." }, { status: 409 });
    }
    const lifecycleStatus = lifecycleStatusForExam(exam);
    if (lifecycleStatus === "upcoming") {
      return NextResponse.json({ message: "Exam has not started yet." }, { status: 403 });
    }
    // Allow late start for pending attempts (business hotfix).
    // We still block only when exam is already completed.
    const questions = await ExamQuestion.find({ setId, isActive: true }).lean();
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
