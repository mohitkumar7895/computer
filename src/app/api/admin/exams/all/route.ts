import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student"; // Ensure model registration

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const atcId = searchParams.get("atcId");

    await connectDB();
    
    const query: any = {};
    if (atcId && mongoose.Types.ObjectId.isValid(atcId)) {
      query.atcId = new mongoose.Types.ObjectId(atcId);
    }

    // We populate student info
    const exams = await StudentExam.find(query)
      .populate({
        path: "studentId",
        select: "name registrationNo mobile",
        model: AtcStudent
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("[admin/exams/all GET]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
