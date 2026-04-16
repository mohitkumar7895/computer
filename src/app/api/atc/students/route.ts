import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Student } from "@/models/Student";
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

export async function GET() {
  const user = await getAtcUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const students = await Student.find({ atcId: user.id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const user = await getAtcUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    // Validate required fields
    const reqFields = ["name", "fatherName", "motherName", "dob", "gender", "mobile", "address", "course", "qualification"];
    for (const f of reqFields) {
      if (!formData.get(f)) return NextResponse.json({ message: `Missing required field: ${f}` }, { status: 400 });
    }

    await connectDB();

    // File conversions
    let photoBase64 = "";
    const photoFile = formData.get("photo") as File | null;
    if (photoFile && photoFile.size > 0) {
      const buffer = await photoFile.arrayBuffer();
      photoBase64 = `data:${photoFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let idProofBase64 = "";
    const idProofFile = formData.get("idProof") as File | null;
    if (idProofFile && idProofFile.size > 0) {
      const buffer = await idProofFile.arrayBuffer();
      idProofBase64 = `data:${idProofFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    // Generate Reg No: TPCODE-YYMM-XXXX
    const count = await Student.countDocuments({ tpCode: user.tpCode });
    const regNo = `${user.tpCode}-${new Date().toISOString().slice(2,7).replace("-", "")}-${String(count + 1).padStart(4, "0")}`;

    const student = await Student.create({
      atcId: user.id,
      tpCode: user.tpCode,
      registrationNo: regNo,
      name: String(formData.get("name")),
      fatherName: String(formData.get("fatherName")),
      motherName: String(formData.get("motherName")),
      dob: String(formData.get("dob")),
      gender: String(formData.get("gender")),
      mobile: String(formData.get("mobile")),
      email: String(formData.get("email") || ""),
      address: String(formData.get("address")),
      course: String(formData.get("course")),
      qualification: String(formData.get("qualification")),
      photo: photoBase64,
      idProof: idProofBase64,
    });

    return NextResponse.json({ message: "Student admitted successfully", student }, { status: 201 });
  } catch (error) {
    console.error("[add student error]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
