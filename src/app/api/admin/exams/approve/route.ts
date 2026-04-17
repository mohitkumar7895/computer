import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examId, approvalStatus, examDate, examTime, setId, examMode, admitCardReleased } = body;

    if (!examId || !approvalStatus) {
      return NextResponse.json({ message: "examId and approvalStatus are required." }, { status: 400 });
    }

    await connectDB();

    const updateData: any = { approvalStatus };
    if (examDate) updateData.examDate = new Date(examDate);
    if (examTime) updateData.examTime = examTime;
    if (examMode) updateData.examMode = examMode;
    if (setId) updateData.setId = setId;
    if (admitCardReleased !== undefined) updateData.admitCardReleased = admitCardReleased;

    const updatedExam = await StudentExam.findByIdAndUpdate(
      examId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedExam) {
      return NextResponse.json({ message: "Exam record not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Exam request updated successfully.", exam: updatedExam });
  } catch (error) {
    console.error("[admin/exams/approve POST]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
