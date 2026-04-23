import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAtcUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("atc_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; tpCode: string };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getAtcUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const fieldName = formData.get("fieldName") as string;
    const file = formData.get("file") as File | null;

    if (!studentId || !fieldName || !file) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const toBase64 = async (f: File) => {
      try {
        if (!f.size || f.size === 0) return "";
        const arrayBuffer = await f.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:${f.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
      } catch (e: any) {
        console.error("toBase64 conversion fail:", e.message);
        return "";
      }
    };

    const content = await toBase64(file);
    if (!content) {
      return NextResponse.json({ message: "Empty file content" }, { status: 400 });
    }

    const { StudentMedia } = await import("@/models/StudentMedia");
    await StudentMedia.findOneAndUpdate(
      { studentId, fieldName },
      { content },
      { upsert: true }
    );

    // Also update the main Student document if it's a critical field
    // (photo, studentSignature, etc.) just to keep it in sync, if needed.
    // However, the main API fetches from StudentMedia and merges it anyway,
    // so we don't strictly need to duplicate it in AtcStudent, but let's check
    // if other parts of the app rely on AtcStudent having it.
    const { AtcStudent } = await import("@/models/Student");
    const allowedMainFields = ["photo", "studentSignature", "aadharDoc", "marksheet10th", "marksheet12th", "graduationDoc", "highestQualDoc", "otherDocs"];
    // Wait, in POST /api/atc/students, it explicitly removes heavy docs from main object:
    // studentData.photo = "";
    // So we don't need to put it in AtcStudent.

    return NextResponse.json({ message: "Media uploaded successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("[POST MEDIA ERROR]", error);
    return NextResponse.json({ message: error.message || "Unknown error" }, { status: 500 });
  }
}
