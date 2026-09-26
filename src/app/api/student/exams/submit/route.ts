import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { StudentExam } from '@/models/StudentExam';
import { ExamQuestion } from '@/models/ExamQuestion';
import '@/models/QuestionSet';
import '@/models/AtcUser';
import { buildExamWindow } from "@/lib/exam-schedule";

export async function POST(request: Request) {
  try {
    const { examId, studentId, answers } = await request.json();
    if (!examId || !studentId || !answers || typeof answers !== "object") {
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
    const { startsAt } = buildExamWindow(examRecord);
    const nowMs = Date.now();
    if (startsAt && nowMs < startsAt.getTime()) {
      return NextResponse.json({ message: "Exam has not started yet." }, { status: 403 });
    }

    const startedAtMs = examRecord.startedAt
      ? new Date(examRecord.startedAt).getTime()
      : null;
    if (!startedAtMs) {
      return NextResponse.json({ message: "Exam attempt has not been started." }, { status: 403 });
    }

    // Two-minute grace allows an auto-submit request already in flight to finish.
    const allowedUntil =
      startedAtMs + ((examRecord.durationMinutes || 60) * 60 * 1000) + (2 * 60 * 1000);
    if (nowMs > allowedUntil) {
      return NextResponse.json({ message: "Your exam duration is over." }, { status: 403 });
    }
    const questions = await ExamQuestion.find({ setId: examRecord.setId, isActive: true });
    let totalScore = 0;
    const maxScore = questions.reduce((sum: number, q) => sum + (q.marks || 1), 0);
    const submittedAnswers: Array<{
      questionId: unknown;
      selectedOption: string;
      correct: boolean;
      marksEarned: number;
    }> = [];
    for (const q of questions) {
      const selectedOption = answers[q._id.toString()] || '';
      const isCorrect = selectedOption.trim().toLowerCase() === q.correctOption.trim().toLowerCase();
      const marksEarned = isCorrect ? (q.marks || 1) : 0;
      if (isCorrect) totalScore += (q.marks || 1);
      submittedAnswers.push({
        questionId: q._id,
        selectedOption,
        correct: isCorrect,
        marksEarned,
      });
    }
    examRecord.answers = submittedAnswers as never[];
    examRecord.totalScore = totalScore;
    examRecord.maxScore = maxScore;
    examRecord.status = 'completed';
    examRecord.lifecycleStatus = "completed";
    examRecord.resultDeclared = false;
    examRecord.marksheetReleased = false;
    examRecord.certificateReleased = false;
    examRecord.submittedAt = new Date();
    await examRecord.save();
    return NextResponse.json({ message: 'Exam submitted successfully', score: totalScore, max: maxScore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: 'Submission failed', error: message }, { status: 500 });
  }
}