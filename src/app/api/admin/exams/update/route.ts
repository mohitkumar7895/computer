import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, status, examDate, examTime, setId, examMode, admitCardReleased } = body;

    if (!requestId || !status) {
      return NextResponse.json({ message: "requestId and status are required." }, { status: 400 });
    }

    await connectDB();

    const updateData: any = { approvalStatus: status };
    if (examDate) updateData.examDate = new Date(examDate);
    if (examTime) updateData.examTime = examTime;
    if (examMode) updateData.examMode = examMode;
    if (setId) updateData.setId = setId;
    if (admitCardReleased !== undefined) updateData.admitCardReleased = admitCardReleased;

    const updatedExam = await StudentExam.findByIdAndUpdate(
      requestId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedExam) {
      return NextResponse.json({ message: "Exam record not found." }, { status: 404 });
    }

    // If offline exam is approved, update student status to 'appeared' so ATC can enter result
    if (status === "approved" && updatedExam.examMode === "offline") {
      const { AtcStudent } = await import("@/models/Student");
      await AtcStudent.findByIdAndUpdate(updatedExam.studentId, {
        $set: { offlineExamStatus: "appeared" }
      });
    }

    return NextResponse.json({ message: "Exam request updated successfully.", exam: updatedExam });
  } catch (error) {
    console.error("[admin/exams/update POST]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
