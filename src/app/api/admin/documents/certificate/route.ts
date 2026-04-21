import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Certificate } from "@/models/Certificate";
import { AtcStudent } from "@/models/Student";
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
      select: "name fatherName motherName photo registrationNo session course graduationDoc highestQualDoc dob gender mobile",
    });

    if (!cert) return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    return NextResponse.json({ data: cert });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
