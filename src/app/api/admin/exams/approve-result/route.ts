import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student";
import { Marksheet } from "@/models/Marksheet";
import { Certificate } from "@/models/Certificate";
import { AtcUser } from "@/models/AtcUser";
import { Course } from "@/models/Course";
import {
  buildMarksheetFromCourse,
  formatCertificateFromLabel,
  gradeFromPercentage,
  type CourseSubjectInput,
} from "@/lib/examDocumentSplit";

export async function POST(request: Request) {
  try {
    const { examId, status, marksheet = false, certificate = false } = await request.json();

    await connectDB();

    const exam = await StudentExam.findById(examId);
    if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

    const student = await AtcStudent.findById(exam.studentId);

    type CourseLite = {
      name?: string;
      hasMarksheet?: boolean;
      hasCertificate?: boolean;
      durationMonths?: number;
      subjects?: CourseSubjectInput[];
    };
    const courseSettings = { hasMarksheet: true, hasCertificate: true };
    let courseDoc: CourseLite | null = null;
    if (student) {
      const ors: Record<string, unknown>[] = [];
      if (student.courseId) ors.push({ _id: student.courseId });
      if (student.course) ors.push({ name: student.course });
      if (ors.length) {
        const c = (await Course.findOne({ $or: ors }).lean()) as CourseLite | null;
        if (c) {
          courseDoc = c;
          courseSettings.hasMarksheet = Boolean(c.hasMarksheet);
          courseSettings.hasCertificate = Boolean(c.hasCertificate);
        }
      }
    }

    if (status === "published") {
      if (exam.examMode === "offline" && exam.offlineExamStatus !== "review_pending") {
        return NextResponse.json({ message: "Offline result is not in admin review queue." }, { status: 400 });
      }
      if (
        exam.examMode === "online" &&
        exam.status !== "completed" &&
        exam.offlineExamStatus !== "review_pending"
      ) {
        return NextResponse.json({ message: "Online result is not ready for admin approval." }, { status: 400 });
      }

      const releaseMarksheet = Boolean(marksheet) && courseSettings.hasMarksheet;
      const releaseCertificate = Boolean(certificate) && courseSettings.hasCertificate;

      exam.offlineExamStatus = "published";
      exam.status = "completed";
      exam.resultDeclared = true;
      exam.marksheetReleased = releaseMarksheet;
      exam.certificateReleased = releaseCertificate;
      await exam.save();

      if (student) {
        student.offlineExamStatus = "published";
        await student.save();
      }

      const atc = await AtcUser.findById(exam.atcId);

      const examMax = exam.maxScore && exam.maxScore > 0 ? exam.maxScore : 100;
      const examObt = Math.max(0, exam.totalScore || 0);
      const built = buildMarksheetFromCourse(examObt, examMax, courseDoc?.subjects ?? []);
      const courseTitle =
        (courseDoc?.name && String(courseDoc.name).trim()) || student?.course?.trim() || "N/A";
      const gradeLetter = gradeFromPercentage(built.percentage);

      if (releaseMarksheet) {
        await Marksheet.findOneAndUpdate(
          { examId: exam._id },
          {
            studentId: exam.studentId,
            atcId: exam.atcId,
            examId: exam._id,
            enrollmentNo: student?.enrollmentNo || "N/A",
            rollNo: student?.classRollNo || "N/A",
            courseName: courseTitle,
            subjects: built.rows,
            totalObtained: built.totalObtained,
            totalMax: built.totalMax,
            percentage: built.percentage,
            grade: gradeLetter,
            result: built.percentage >= 33 ? "Pass" : "Fail",
            issueDate: new Date(),
            isApproved: true,
          },
          { upsert: true },
        );
      }

      if (releaseCertificate) {
        const session = exam.session || student?.session || "2024-25";
        const count = await Certificate.countDocuments();
        const serialNo = `CERT-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, "0")}`;
        const fromLabel = formatCertificateFromLabel(student?.admissionDate);

        await Certificate.findOneAndUpdate(
          { examId: exam._id },
          {
            studentId: exam.studentId,
            atcId: exam.atcId,
            examId: exam._id,
            enrollmentNo: student?.enrollmentNo || "N/A",
            serialNo,
            issueDate: new Date(),
            session,
            courseName: courseTitle,
            centerCode: atc?.tpCode || "N/A",
            centerName: atc?.trainingPartnerName || "N/A",
            grade: gradeLetter,
            ...(fromLabel ? { fromLabel } : {}),
            ...(typeof courseDoc?.durationMonths === "number" && courseDoc.durationMonths > 0
              ? { durationMonths: courseDoc.durationMonths }
              : {}),
            isApproved: true,
          },
          { upsert: true },
        );
      }
    } else {
      exam.offlineExamStatus = "appeared";
      await exam.save();

      await AtcStudent.findByIdAndUpdate(exam.studentId, {
        offlineExamStatus: "appeared",
      });
    }

    return NextResponse.json({ message: "Action completed successfully" });
  } catch (error: unknown) {
    console.error("[api/admin/exams/approve-result] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
