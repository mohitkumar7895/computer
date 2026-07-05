import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Certificate } from "@/models/Certificate";
import { Course } from "@/models/Course";
import { AtcStudent } from "@/models/Student";
import { StudentMedia } from "@/models/StudentMedia";
import { resolveAtcSignature } from "@/lib/documentAtcSignature";
import { getDocumentPageAssets } from "@/lib/documentPageAssets.server";
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
    const cert = await Certificate.findOne({ examId }).populate({
      path: "studentId",
      model: AtcStudent,
      select:
        "name fatherName motherName photo enrollmentNo session course graduationDoc highestQualDoc dob gender mobile admissionDate",
    });

    if (!cert) return NextResponse.json({ message: "Certificate not found" }, { status: 404 });

    const certData = cert.toObject() as {
      studentId?: { _id?: unknown; photo?: string } | string | null;
      durationMonths?: number;
      courseName?: string;
      [k: string]: unknown;
    };
    const studentObj =
      certData.studentId && typeof certData.studentId === "object" ? certData.studentId : null;
    const studentId = studentObj?._id;

    const [media, course, atcSignature, assets] = await Promise.all([
      studentId
        ? StudentMedia.findOne({ studentId, fieldName: "photo" }).select("content").lean()
        : Promise.resolve(null),
      !certData.durationMonths && certData.courseName
        ? Course.findOne({ name: certData.courseName }).select("durationMonths").lean()
        : Promise.resolve(null),
      resolveAtcSignature(cert.atcId?.toString()),
      getDocumentPageAssets("certificate"),
    ]);

    if (media && typeof (media as { content?: string }).content === "string" && studentObj) {
      studentObj.photo = (media as { content: string }).content;
    }
    if (course && typeof (course as { durationMonths?: number }).durationMonths === "number") {
      certData.durationMonths = (course as { durationMonths: number }).durationMonths;
    }

    const res = NextResponse.json({
      data: certData,
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
