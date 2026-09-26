import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ExamQuestion } from "@/models/ExamQuestion";
import { StudentExam } from "@/models/StudentExam";
import "@/models/QuestionSet"; // Register model dependency
import { buildExamWindow } from "@/lib/exam-schedule";

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
    const examDoc = await StudentExam.findById(examId);
    if (!examDoc || String(examDoc.studentId) !== String(studentId)) {
      return NextResponse.json({ message: "Exam record not found." }, { status: 404 });
    }
    const exam = examDoc.toObject();
    if (exam.examMode !== "online") {
      return NextResponse.json({ message: "Only online exams can be started." }, { status: 400 });
    }
    if (exam.approvalStatus !== "approved") {
      return NextResponse.json({ message: "Exam is not approved yet." }, { status: 403 });
    }
    if (exam.status === "completed") {
      return NextResponse.json({ message: "Exam attempt already completed." }, { status: 409 });
    }

    const hasExplicitSchedule = Boolean(
      exam.examDateTime || (exam.examDate && exam.examTime),
    );

    if (hasExplicitSchedule) {
      const { startsAt } = buildExamWindow(exam);
      if (!startsAt) {
        return NextResponse.json({ message: "Exam schedule is invalid." }, { status: 400 });
      }
      if (Date.now() < startsAt.getTime()) {
        return NextResponse.json({ message: "Exam has not started yet." }, { status: 403 });
      }
    }

    const durationMinutes = Math.max(1, Number(exam.durationMinutes ?? 60) || 60);
    const startAnchor = examDoc.startedAt ? new Date(examDoc.startedAt) : new Date();
    if (!examDoc.startedAt) {
      examDoc.startedAt = startAnchor;
      examDoc.lifecycleStatus = "active";
      await examDoc.save();
    }

    const attemptEndsAt = new Date(startAnchor.getTime() + durationMinutes * 60_000);
    const timeLeftSeconds = Math.max(
      0,
      Math.floor((attemptEndsAt.getTime() - Date.now()) / 1000),
    );
    if (timeLeftSeconds <= 0) {
      return NextResponse.json({ message: "Your exam duration is over." }, { status: 403 });
    }

    const questions = await ExamQuestion.find({ setId, isActive: true }).lean();
    return NextResponse.json({ questions, timeLeftSeconds });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
