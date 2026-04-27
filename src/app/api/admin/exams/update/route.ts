import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { lifecycleStatusForExam } from "@/lib/exam-schedule";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, status, examDate, examTime, setId, examMode, durationMinutes, admitCardReleased } = body;

    if (!requestId || !status) {
      return NextResponse.json({ message: "requestId and status are required." }, { status: 400 });
    }

    await connectDB();

    const updateData: Record<string, unknown> = { approvalStatus: status };
    if (examDate) updateData.examDate = new Date(examDate);
    if (examTime) updateData.examTime = examTime;
    if (durationMinutes) updateData.durationMinutes = Number(durationMinutes);
    if (examMode) updateData.examMode = examMode;
    if (setId) updateData.setId = setId;
    if (admitCardReleased !== undefined) updateData.admitCardReleased = admitCardReleased;
    if (examDate && examTime) {
      const dt = new Date(`${examDate}T${examTime}:00`);
      if (!Number.isNaN(dt.getTime())) {
        updateData.examDateTime = dt;
      }
    }

    const updatedExam = await StudentExam.findByIdAndUpdate(
      requestId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedExam) {
      return NextResponse.json({ message: "Exam record not found." }, { status: 404 });
    }
    updatedExam.lifecycleStatus = lifecycleStatusForExam(updatedExam);
    await updatedExam.save();

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
