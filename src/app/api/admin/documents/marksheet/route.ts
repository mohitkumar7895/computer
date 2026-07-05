import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Marksheet } from "@/models/Marksheet";
import { AtcStudent } from "@/models/Student";
import { StudentMedia } from "@/models/StudentMedia";
import { learningCenterLineForMarksheet } from "@/lib/marksheetLearningCenter";
import { resolveAtcSignature } from "@/lib/documentAtcSignature";
import { getDocumentPageAssets } from "@/lib/documentPageAssets.server";
import { getMarksheetGradeBands, gradeFromPercentageWithBands } from "@/lib/marksheetGradeScale";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");
    if (!examId) return NextResponse.json({ message: "examId is required" }, { status: 400 });

    await connectDB();
    const marksheet = await Marksheet.findOne({ examId }).populate({
      path: "studentId",
      model: AtcStudent,
      select: "name fatherName motherName photo enrollmentNo registrationNo session dob classRollNo",
    });

    if (!marksheet) return NextResponse.json({ message: "Marksheet not found" }, { status: 404 });

    const data = marksheet.toObject() as {
      studentId?: { _id?: unknown; photo?: string } | string | null;
      [k: string]: unknown;
    };
    const studentObj =
      data.studentId && typeof data.studentId === "object" ? data.studentId : null;
    const studentId = studentObj?._id;

    const [gradeBands, media, learningCenterLine, atcSignature, assets] = await Promise.all([
      getMarksheetGradeBands(),
      studentId
        ? StudentMedia.findOne({ studentId, fieldName: "photo" }).select("content").lean()
        : Promise.resolve(null),
      learningCenterLineForMarksheet(marksheet.atcId),
      resolveAtcSignature(marksheet.atcId?.toString()),
      getDocumentPageAssets("marksheet"),
    ]);

    data.grade = gradeFromPercentageWithBands(Number(data.percentage) || 0, gradeBands);
    if (media && typeof (media as { content?: string }).content === "string") {
      if (studentObj) studentObj.photo = (media as { content: string }).content;
    }

    const res = NextResponse.json({
      data,
      learningCenterLine,
      atcSignature,
      backgroundUrl: assets.backgroundUrl,
      signatureUrl: assets.signatureUrl,
    });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
