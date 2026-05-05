import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { assignEnrollmentNoIfPending } from "@/lib/assignStudentEnrollmentNo";
import { assignRegistrationNoIfPending } from "@/lib/assignStudentRegistrationNo";
import { buildExamDateTimeUtc } from "@/lib/examScheduleUtc";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examId, approvalStatus, examDate, examTime, setId, examMode, durationMinutes, admitCardReleased } = body;

    if (!examId || !approvalStatus) {
      return NextResponse.json({ message: "examId and approvalStatus are required." }, { status: 400 });
    }

    await connectDB();

    const updateData: any = { approvalStatus };
    if (examDate) updateData.examDate = examDate;
    if (examTime) updateData.examTime = examTime;
    if (examMode) updateData.examMode = examMode;
    if (setId) updateData.setId = setId;
    if (durationMinutes !== undefined) updateData.durationMinutes = Number(durationMinutes);
    if (admitCardReleased !== undefined) updateData.admitCardReleased = admitCardReleased;
    if (examDate && examTime) {
      const dt = buildExamDateTimeUtc(examDate, String(examTime));
      if (dt) {
        updateData.examDateTime = dt;
      }
    }

    const updatedExam = await StudentExam.findByIdAndUpdate(
      examId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedExam) {
      return NextResponse.json({ message: "Exam record not found." }, { status: 404 });
    }

    // NEW: If offline exam is approved, update student status to 'appeared' so ATC can enter result
    if (approvalStatus === "approved" && updatedExam.examMode === "offline") {
      const { AtcStudent } = await import("@/models/Student");
      await AtcStudent.findByIdAndUpdate(updatedExam.studentId, {
        $set: { offlineExamStatus: "appeared" }
      });
    }

    if (updatedExam.approvalStatus === "approved" && updatedExam.admitCardReleased) {
      try {
        await assignEnrollmentNoIfPending(updatedExam.studentId);
        await assignRegistrationNoIfPending(updatedExam.studentId);
      } catch (e) {
        console.error("[admin/exams/approve] assign enrollment/registration", e);
      }
    }

    return NextResponse.json({ message: "Exam request updated successfully.", exam: updatedExam });
  } catch (error) {
    console.error("[admin/exams/approve POST]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
