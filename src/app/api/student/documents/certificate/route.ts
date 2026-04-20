import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Certificate } from "@/models/Certificate";
import { AtcStudent } from "@/models/Student";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    const cookieStore = await cookies();
    const token = cookieStore.get("student_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    await connectDB();
    const cert = await Certificate.findOne({ examId, studentId: decoded.id })
      .populate({
        path: "studentId",
        model: AtcStudent,
        select: "name fatherName motherName photo classRollNo"
      });

    if (!cert) return NextResponse.json({ message: "Certificate not found" }, { status: 404 });

    return NextResponse.json({ data: cert });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
