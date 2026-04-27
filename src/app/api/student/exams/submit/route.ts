import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { StudentExam } from '@/models/StudentExam';
import { ExamQuestion } from '@/models/ExamQuestion';
import '@/models/QuestionSet';
import '@/models/AtcUser';
import { buildExamWindow, lifecycleStatusForExam } from "@/lib/exam-schedule";

export async function POST(request: Request) {
  try {
    const { examId, studentId, answers } = await request.json();
    if (!examId || !studentId || !answers) {
      return NextResponse.json({ message: 'Invalid submission data' }, { status: 400 });
    }
    await connectDB();
    const examRecord = await StudentExam.findById(examId);
    if (!examRecord) {
      return NextResponse.json({ message: 'Exam record not found' }, { status: 404 });
    }
    if (String(examRecord.studentId) !== String(studentId)) {
      return NextResponse.json({ message: "Invalid student for this exam." }, { status: 403 });
    }
    if (examRecord.examMode !== "online") {
      return NextResponse.json({ message: "Submission allowed only for online exams." }, { status: 400 });
    }
    if (examRecord.status === "completed") {
      return NextResponse.json({ message: "Reattempt not allowed." }, { status: 409 });
    }
    const lifecycleStatus = lifecycleStatusForExam(examRecord);
    if (lifecycleStatus === "upcoming") {
      return NextResponse.json({ message: "Exam has not started yet." }, { status: 403 });
    }
    if (lifecycleStatus === "completed") {
      const { endsAt } = buildExamWindow(examRecord);
      const now = Date.now();
      const allowedUntil = endsAt ? endsAt.getTime() + 5000 : now;
      if (now > allowedUntil) {
        return NextResponse.json({ message: "Exam time window is over." }, { status: 403 });
      }
    }
    const questions = await ExamQuestion.find({ setId: examRecord.setId, isActive: true });
    let totalScore = 0;
    const maxScore = questions.reduce((sum: number, q) => sum + (q.marks || 1), 0);
    for (const q of questions) {
      const selectedOption = answers[q._id.toString()] || '';
      const isCorrect = selectedOption.trim().toLowerCase() === q.correctOption.trim().toLowerCase();
      if (isCorrect) totalScore += (q.marks || 1);
    }
    examRecord.totalScore = totalScore;
    examRecord.maxScore = maxScore;
    examRecord.status = 'completed';
    examRecord.lifecycleStatus = "completed";
    examRecord.submittedAt = new Date();
    await examRecord.save();
    return NextResponse.json({ message: 'Exam submitted successfully', score: totalScore, max: maxScore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: 'Submission failed', error: message }, { status: 500 });
  }
}