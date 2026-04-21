import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student";
import { Marksheet } from "@/models/Marksheet";
import { Certificate } from "@/models/Certificate";
import { AtcUser } from "@/models/AtcUser";

export async function POST(request: Request) {
  try {
    const { examId, status, marksheet, certificate } = await request.json(); // status: 'published' or 'appeared' (rejected)

    await connectDB();

    const exam = await StudentExam.findById(examId);
    if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

    if (status === "published") {
      // 1. Update Exam record
      exam.offlineExamStatus = "published";
      exam.status = "completed";
      exam.resultDeclared = true;
      exam.marksheetReleased = marksheet !== false;
      exam.certificateReleased = certificate !== false;
      await exam.save();

      // 2. Update Student Profile
      const student = await AtcStudent.findById(exam.studentId).populate("atcId");
      if (student) {
        student.offlineExamStatus = "published";
        await student.save();
      }

      const atc = await AtcUser.findById(exam.atcId);

      // 3. Conditional Marksheet
      if (marksheet !== false) {
        await Marksheet.findOneAndUpdate(
          { examId: exam._id },
          {
            studentId: exam.studentId,
            atcId: exam.atcId,
            examId: exam._id,
            enrollmentNo: student.registrationNo || "N/A",
            rollNo: student.classRollNo || "N/A",
            courseName: student.course,
            subjects: [
              {
                subjectName: student.course,
                marksObtained: exam.totalScore || 0,
                totalMarks: 100
              }
            ],
            totalObtained: exam.totalScore || 0,
            totalMax: 100,
            percentage: exam.totalScore || 0,
            grade: exam.grade || "A",
            result: (exam.totalScore || 0) >= 33 ? "Pass" : "Fail",
            issueDate: new Date(),
            isApproved: true
          },
          { upsert: true }
        );
      }

      // 4. Conditional Certificate
      if (certificate !== false) {
        const session = exam.session || student.session || "2024-25";
        const count = await Certificate.countDocuments();
        const serialNo = `CERT-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

        await Certificate.findOneAndUpdate(
          { examId: exam._id },
          {
            studentId: exam.studentId,
            atcId: exam.atcId,
            examId: exam._id,
            enrollmentNo: student.registrationNo || "N/A",
            serialNo,
            issueDate: new Date(),
            session,
            courseName: student.course,
            centerCode: atc?.centerCode || "N/A",
            centerName: atc?.centerName || "N/A",
            grade: exam.grade || "A",
            isApproved: true
          },
          { upsert: true }
        );
      }

    } else {
      // Revert to 'appeared' (rejected)
      exam.offlineExamStatus = "appeared";
      await exam.save();
      
      await AtcStudent.findByIdAndUpdate(exam.studentId, {
        offlineExamStatus: "appeared"
      });
    }

    return NextResponse.json({ message: "Action completed successfully" });
  } catch (error: any) {
    console.error("[api/admin/exams/approve-result] Error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
