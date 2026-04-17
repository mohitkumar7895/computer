import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { StudentExam } from '@/models/StudentExam';
import { ExamQuestion } from '@/models/ExamQuestion';
import { AtcStudent } from '@/models/AtcStudent';
import '@/models/QuestionSet';
import '@/models/AtcUser';

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
    const questions = await ExamQuestion.find({ setId: examRecord.setId, isActive: true });
    let totalScore = 0;
    const maxScore = questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
    for (const q of questions) {
      const selectedOption = answers[q._id.toString()] || '';
      const isCorrect = selectedOption.trim().toLowerCase() === q.correctOption.trim().toLowerCase();
      if (isCorrect) totalScore += (q.marks || 1);
    }
    examRecord.totalScore = totalScore;
    examRecord.maxScore = maxScore;
    examRecord.status = 'completed';
    examRecord.submittedAt = new Date();
    await examRecord.save();
    return NextResponse.json({ message: 'Exam submitted successfully', score: totalScore, max: maxScore });
  } catch (error: any) {
    return NextResponse.json({ message: 'Submission failed', error: error.message }, { status: 500 });
  }
}