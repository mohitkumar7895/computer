import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examId, examDate, examTime, setId, examMode } = body;

    if (!examId) {
      return NextResponse.json({ message: "examId is required." }, { status: 400 });
    }

    await connectDB();

    const updateData: any = {};
    if (examDate) updateData.examDate = new Date(examDate);
    if (examTime) updateData.examTime = examTime;
    if (examMode) updateData.examMode = examMode;
    if (setId) updateData.setId = setId;

    const updatedExam = await StudentExam.findByIdAndUpdate(
      examId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedExam) {
      return NextResponse.json({ message: "Exam record not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Exam schedule proposed successfully.", exam: updatedExam });
  } catch (error) {
    console.error("[atc/exams/update POST]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
