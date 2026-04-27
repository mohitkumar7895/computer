import { NextResponse } from "next/server";
import { connectDB as dbConnect } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student";
import { lifecycleStatusForExam } from "@/lib/exam-schedule";
import { verifyAtc } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const atc = await verifyAtc(request);
    if (!atc) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    const { studentId, examDate, examTime, durationMinutes, setId } = await request.json();

    if (!studentId || !examDate || !examTime || !durationMinutes) {
      return NextResponse.json(
        { message: "studentId, examDate, examTime, and durationMinutes are required." },
        { status: 400 },
      );
    }

    await dbConnect();

    // Enforce one request per student per day (ATC-wise)
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const todayRequest = await StudentExam.findOne({
      studentId,
      atcId: atc.id,
      createdAt: { $gte: dayStart, $lte: dayEnd },
    });

    if (todayRequest) {
      return NextResponse.json(
        { message: "Only one exam request per student is allowed in a day" },
        { status: 400 },
      );
    }

    const student = await AtcStudent.findById(studentId).lean();
    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }
    if (String(student.atcId) !== String(atc.id)) {
      return NextResponse.json({ message: "Unauthorized student mapping." }, { status: 403 });
    }

    const mode = String(student.examMode || "online").toLowerCase();
    if (mode !== "online" && mode !== "offline") {
      return NextResponse.json({ message: "Student exam mode is invalid." }, { status: 400 });
    }

    const dateTime = new Date(`${examDate}T${examTime}:00`);
    if (Number.isNaN(dateTime.getTime())) {
      return NextResponse.json({ message: "Invalid exam date/time." }, { status: 400 });
    }

    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration < 1 || duration > 600) {
      return NextResponse.json({ message: "Duration must be between 1 and 600 minutes." }, { status: 400 });
    }

    if (!setId) {
      return NextResponse.json({ message: "Question set is required." }, { status: 400 });
    }

    const newExam = new StudentExam({
      studentId,
      atcId: atc.id,
      examMode: mode,
      examDate,
      examTime,
      examDateTime: dateTime,
      durationMinutes: duration,
      setId,
      approvalStatus: "pending",
      status: "pending",
      lifecycleStatus: lifecycleStatusForExam({
        examDateTime: dateTime,
        durationMinutes: duration,
        status: "pending",
      }),
    });

    await newExam.save();

    return NextResponse.json({ message: "Exam request submitted successfully", exam: newExam });
  } catch (error: unknown) {
    console.error("Exam request error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
