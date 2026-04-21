import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
  const students = await AtcStudent.find({ atcId: user.id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const user = await getAtcUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    // Validate required fields
    const reqFields = ["name", "fatherName", "motherName", "dob", "gender", "mobile", "currentAddress", "permanentAddress", "course", "highestQualification", "session", "category", "admissionFees", "admissionDate"];
    for (const f of reqFields) {
      if (!formData.get(f)) return NextResponse.json({ message: `Missing required field: ${f}` }, { status: 400 });
    }

    await connectDB();

    // Helper for base64 with safety checks
    const toBase64 = async (file: any) => {
      try {
        if (!file || typeof file === "string" || !file.size) return "";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      } catch (e) {
        console.error("toBase64 error:", e);
        return "";
      }
    };

    const photo = await toBase64(formData.get("photo"));
    const otherDocs = await toBase64(formData.get("otherDocs"));
    const aadharDoc = await toBase64(formData.get("aadharDoc"));
    const studentSignature = await toBase64(formData.get("studentSignature"));
    
    // Additional docs from frontend
    const marksheet10th = await toBase64(formData.get("marksheet10th"));
    const marksheet12th = await toBase64(formData.get("marksheet12th"));
    const graduationDoc = await toBase64(formData.get("graduationDoc"));
    const highestQualDoc = await toBase64(formData.get("highestQualDoc"));

    const studentMobile = String(formData.get("mobile") || "").trim();
    if (!studentMobile || studentMobile.length < 10) {
      return NextResponse.json({ message: "Mobile number is required and must be 10 digits." }, { status: 400 });
    }

    const studentData: any = {
      atcId: user.id,
      tpCode: user.tpCode,
      name: String(formData.get("name") || "N/A").trim(),
      fatherName: String(formData.get("fatherName") || "N/A").trim(),
      motherName: String(formData.get("motherName") || "N/A").trim(),
      dob: String(formData.get("dob") || ""),
      gender: String(formData.get("gender") || "Male"),
      mobile: studentMobile,
      parentsMobile: String(formData.get("parentsMobile") || "").trim(),
      email: String(formData.get("email") || "").trim().toLowerCase(),
      currentAddress: String(formData.get("currentAddress") || "N/A").trim(),
      permanentAddress: String(formData.get("permanentAddress") || "N/A").trim(),
      course: String(formData.get("course") || "N/A").trim(),
      courseId: (formData.get("courseId") ? String(formData.get("courseId")) : undefined),
      courseType: String(formData.get("courseType") || "Regular").trim(),
      session: String(formData.get("session") || "").trim(),
      classRollNo: String(formData.get("classRollNo") || "").trim(),
      nationality: String(formData.get("nationality") || "Indian").trim(),
      category: String(formData.get("category") || "General").trim(),
      maritalStatus: String(formData.get("maritalStatus") || "").trim(),
      religion: String(formData.get("religion") || "").trim(),
      disability: formData.get("disability") === "Yes",
      disabilityDetails: String(formData.get("disabilityDetails") || "").trim(),
      admissionFees: String(formData.get("admissionFees") || "0").trim(),
      admissionDate: String(formData.get("admissionDate") || "").trim(),
      highestQualification: String(formData.get("highestQualification") || "N/A").trim(),
      
      // Document Mapping
      photo,
      studentSignature,
      aadharDoc,
      otherDocs,
      qualificationDoc: marksheet10th || highestQualDoc,
      marksheet10th,
      marksheet12th,
      graduationDoc,
      highestQualDoc,
      
      // Satisfy unique index with a transient ID until Admin approves
      registrationNo: `PENDING-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      
      aadharNo: String(formData.get("aadharNo") || "").trim(),
      referredBy: String(formData.get("referredBy") || "").trim(),
      password: studentMobile, // Default password
      examMode: String(formData.get("examMode") || "online").trim(),
      status: "pending"
    };

    const student = await AtcStudent.create(studentData);
    return NextResponse.json({ message: "Student admitted successfully", student }, { status: 201 });
  } catch (error: any) {
    console.error("[add student error]", error);
    let errorMsg = error?.message || "Something went wrong";
    if (error.code === 11000) {
      errorMsg = "Duplicate entry found (Mobile, Aadhar or Registration No). Please check details.";
    }
    return NextResponse.json({ 
      message: errorMsg,
      details: error?.errors ? Object.keys(error.errors) : [error.toString()]
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getAtcUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { studentId, ...updateData } = await request.json();
    await connectDB();

    const student = await AtcStudent.findOne({ _id: studentId, atcId: user.id });
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    Object.assign(student, updateData);
    await student.save();

    return NextResponse.json({ message: "Student updated successfully", student });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
