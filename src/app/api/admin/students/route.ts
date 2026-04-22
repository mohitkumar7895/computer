import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function verifyAdmin(request: Request) {
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
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const students = await AtcStudent.find().sort({ createdAt: -1 }).lean();
    
    // Merge media
    const { StudentMedia } = await import("@/models/StudentMedia");
    const studentsWithMedia = await Promise.all(students.map(async (s: any) => {
      const media = await StudentMedia.find({ studentId: s._id }).lean();
      const mediaMap: any = {};
      media.forEach((m: any) => { mediaMap[m.fieldName] = m.content; });
      return { ...s, ...mediaMap };
    }));

    return NextResponse.json({ students: studentsWithMedia });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
