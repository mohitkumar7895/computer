import "server-only";

import { StudentExam, type IExamSubjectMark } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student";
import { Marksheet, type ISubjectMark } from "@/models/Marksheet";
import { Certificate } from "@/models/Certificate";
import { AtcUser } from "@/models/AtcUser";
import { Course } from "@/models/Course";
import {
  formatCertificateFromLabel,
  gradeFromPercentage,
  type CourseSubjectInput,
} from "@/lib/examDocumentSplit";
import { getMarksheetGradeBands } from "@/lib/marksheetGradeScale";
import { assignEnrollmentNoIfPending } from "@/lib/assignStudentEnrollmentNo";
import { assignRegistrationNoIfPending } from "@/lib/assignStudentRegistrationNo";

type MarkRow = {
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  internalObtained: number;
  internalMax: number;
  externalObtained: number;
  externalMax: number;
};

type CourseLite = {
  name?: string;
  shortName?: string;
  hasMarksheet?: boolean;
  hasCertificate?: boolean;
  durationMonths?: number;
  subjects?: CourseSubjectInput[];
};

function examIsPublished(exam: {
  status?: string;
  offlineExamStatus?: string;
  resultDeclared?: boolean;
}): boolean {
  return (
    exam.status === "completed" &&
    exam.offlineExamStatus === "published" &&
    exam.resultDeclared === true
  );
}

async function resolveCourseForStudent(student: {
  courseId?: unknown;
  course?: string;
}): Promise<CourseLite | null> {
  const ors: Record<string, unknown>[] = [];
  if (student.courseId) ors.push({ _id: student.courseId });
  if (student.course) {
    const safe = String(student.course).trim();
    const escaped = safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    ors.push({ name: { $regex: `^${escaped}$`, $options: "i" } });
    ors.push({ shortName: { $regex: `^${escaped}$`, $options: "i" } });
  }
  if (!ors.length) return null;
  return (await Course.findOne({ $or: ors }).lean()) as CourseLite | null;
}

async function buildMarkRows(exam: InstanceType<typeof StudentExam>): Promise<MarkRow[]> {
  let markRows: MarkRow[] = Array.isArray(exam.subjectMarks)
    ? exam.subjectMarks.map((row: IExamSubjectMark, idx: number) => {
        const internalObtained = Number(row.internalObtained ?? 0) || 0;
        const internalMax = Number(row.internalMax ?? 0) || 0;
        const externalObtained = Number(row.externalObtained ?? 0) || 0;
        const externalMax = Number(row.externalMax ?? 0) || 0;
        const mo = Number(row.marksObtained ?? NaN);
        const tm = Number(row.totalMarks ?? NaN);
        const sumO = internalObtained + externalObtained;
        const sumM = internalMax + externalMax;
        const subjectName = String(row.subjectName ?? "").trim() || `Subject ${idx + 1}`;
        return {
          subjectName,
          marksObtained: Number.isFinite(mo) ? mo : sumO,
          totalMarks: Number.isFinite(tm) ? tm : sumM,
          internalObtained,
          internalMax,
          externalObtained,
          externalMax,
        };
      })
    : [];

  if (markRows.length === 0) {
    const draft = await Marksheet.findOne({ examId: exam._id }).lean();
    const subj = draft?.subjects;
    if (Array.isArray(subj) && subj.length > 0) {
      markRows = subj.map((s: ISubjectMark, idx: number) => {
        const internalObtained = Number(s.internalObtained ?? 0) || 0;
        const internalMax = Number(s.internalMax ?? 0) || 0;
        const externalObtained = Number(s.externalObtained ?? 0) || 0;
        const externalMax = Number(s.externalMax ?? 0) || 0;
        const mo = Number(s.marksObtained ?? NaN);
        const tm = Number(s.totalMarks ?? NaN);
        const marksObtained = Number.isFinite(mo) ? mo : internalObtained + externalObtained;
        const totalMarks = Number.isFinite(tm) ? tm : internalMax + externalMax;
        return {
          subjectName: String(s.subjectName ?? "").trim() || `Subject ${idx + 1}`,
          marksObtained,
          totalMarks,
          internalObtained,
          internalMax,
          externalObtained,
          externalMax,
        };
      });
    }
  }

  const examMax = exam.maxScore && exam.maxScore > 0 ? exam.maxScore : 100;
  const examObt = Math.max(0, exam.totalScore || 0);
  const hadExamSubjectMarks = Array.isArray(exam.subjectMarks) && exam.subjectMarks.length > 0;

  if (markRows.length === 0 && !hadExamSubjectMarks) {
    markRows = [
      {
        subjectName: "Course",
        marksObtained: examObt,
        totalMarks: examMax > 0 ? examMax : Math.max(1, examObt || 1),
        internalObtained: 0,
        internalMax: 0,
        externalObtained: 0,
        externalMax: 0,
      },
    ];
  }

  return markRows;
}

function totalsFromMarkRows(
  markRows: MarkRow[],
  examObt: number,
  examMax: number,
): { finalTotalObtained: number; finalTotalMax: number; finalPercentage: number } {
  if (markRows.length > 0) {
    const finalTotalObtained = markRows.reduce((s, r) => s + r.marksObtained, 0);
    const finalTotalMax = markRows.reduce((s, r) => s + r.totalMarks, 0);
    const finalPercentage =
      finalTotalMax > 0 ? Math.round((finalTotalObtained / finalTotalMax) * 10000) / 100 : 0;
    return { finalTotalObtained, finalTotalMax, finalPercentage };
  }
  const finalTotalObtained = examObt;
  const finalTotalMax = examMax;
  const finalPercentage =
    finalTotalMax > 0 ? Math.round((finalTotalObtained / finalTotalMax) * 10000) / 100 : 0;
  return { finalTotalObtained, finalTotalMax, finalPercentage };
}

/** Create or refresh marksheet when exam is published but the row is missing. */
export async function ensureMarksheetForExam(examId: string): Promise<boolean> {
  const exam = await StudentExam.findById(examId);
  if (!exam || !examIsPublished(exam)) return false;

  let student = await AtcStudent.findById(exam.studentId);
  if (!student) return false;

  const courseDoc = await resolveCourseForStudent(student);
  if (courseDoc && courseDoc.hasMarksheet === false) return false;

  await assignEnrollmentNoIfPending(student._id);
  await assignRegistrationNoIfPending(student._id);
  student = await AtcStudent.findById(exam.studentId);
  if (!student) return false;

  const markRows = await buildMarkRows(exam);
  const examMax = exam.maxScore && exam.maxScore > 0 ? exam.maxScore : 100;
  const examObt = Math.max(0, exam.totalScore || 0);
  const { finalTotalObtained, finalTotalMax, finalPercentage } = totalsFromMarkRows(
    markRows,
    examObt,
    examMax,
  );

  const gradeBands = await getMarksheetGradeBands();
  const gradeLetter =
    exam.grade?.trim() || gradeFromPercentage(finalPercentage, gradeBands);

  const courseTitle =
    (courseDoc?.name && String(courseDoc.name).trim()) || student.course?.trim() || "N/A";

  const existing = await Marksheet.findOne({ examId: exam._id }).select("issueDate").lean();
  const issueDate = existing?.issueDate ?? new Date();

  await Marksheet.findOneAndUpdate(
    { examId: exam._id },
    {
      studentId: exam.studentId,
      atcId: exam.atcId,
      examId: exam._id,
      enrollmentNo: student.enrollmentNo || "N/A",
      rollNo: student.classRollNo || "N/A",
      courseName: courseTitle,
      subjects: markRows,
      totalObtained: finalTotalObtained,
      totalMax: finalTotalMax,
      percentage: finalPercentage,
      grade: gradeLetter,
      result:
        exam.offlineExamResult === "Fail" || finalPercentage < 33 ? "Fail" : "Pass",
      issueDate,
      isApproved: true,
    },
    { upsert: true },
  );

  return true;
}

/** Create or refresh certificate when exam is published but the row is missing. */
export async function ensureCertificateForExam(examId: string): Promise<boolean> {
  const exam = await StudentExam.findById(examId);
  if (!exam || !examIsPublished(exam)) return false;

  let student = await AtcStudent.findById(exam.studentId);
  if (!student) return false;

  const courseDoc = await resolveCourseForStudent(student);
  if (courseDoc && courseDoc.hasCertificate === false) return false;

  await assignEnrollmentNoIfPending(student._id);
  await assignRegistrationNoIfPending(student._id);
  student = await AtcStudent.findById(exam.studentId);
  if (!student) return false;

  const markRows = await buildMarkRows(exam);
  const examMax = exam.maxScore && exam.maxScore > 0 ? exam.maxScore : 100;
  const examObt = Math.max(0, exam.totalScore || 0);
  const { finalPercentage } = totalsFromMarkRows(markRows, examObt, examMax);

  const gradeBands = await getMarksheetGradeBands();
  const gradeLetter =
    exam.grade?.trim() || gradeFromPercentage(finalPercentage, gradeBands);

  const atc = await AtcUser.findById(exam.atcId);
  const courseTitle =
    (courseDoc?.name && String(courseDoc.name).trim()) || student.course?.trim() || "N/A";

  const existing = await Certificate.findOne({ examId: exam._id }).select("serialNo issueDate").lean();
  const issueDate = existing?.issueDate ?? new Date();
  let serialNo = existing?.serialNo;
  if (!serialNo) {
    const count = await Certificate.countDocuments();
    serialNo = `CERT-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, "0")}`;
  }

  const session = exam.session || student.session || "2024-25";
  const fromLabel = formatCertificateFromLabel(student.admissionDate);

  await Certificate.findOneAndUpdate(
    { examId: exam._id },
    {
      studentId: exam.studentId,
      atcId: exam.atcId,
      examId: exam._id,
      enrollmentNo: student.enrollmentNo || "N/A",
      serialNo,
      issueDate,
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

  return true;
}
