import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examId, resultDeclared } = body;

    if (!examId) {
      return NextResponse.json({ message: "examId is required." }, { status: 400 });
    }

    await connectDB();

    const updatedExam = await StudentExam.findByIdAndUpdate(
      examId,
      { $set: { resultDeclared: resultDeclared ?? true } },
      { new: true }
    );

    if (!updatedExam) {
      return NextResponse.json({ message: "Exam record not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Result status updated.", exam: updatedExam });
  } catch (error) {
    console.error("[admin/exams/declare-result POST]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
