import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";

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
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ message: "Student ID required" }, { status: 400 });

  await connectDB();
  try {
    const { StudentMedia } = await import("@/models/StudentMedia");
    const mediaItems = await StudentMedia.find({ studentId }).lean();
    const media: Record<string, string> = {};
    mediaItems.forEach((item: any) => {
      media[item.fieldName] = item.content;
    });
    return NextResponse.json({ media });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
