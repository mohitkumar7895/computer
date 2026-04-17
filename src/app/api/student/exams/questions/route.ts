import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ExamQuestion } from "@/models/ExamQuestion";
import "@/models/QuestionSet"; // Register model dependency

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get("setId");

  if (!setId) {
    return NextResponse.json({ message: "setId is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const questions = await ExamQuestion.find({ setId, isActive: true }).lean();
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
