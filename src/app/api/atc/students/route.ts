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
  try {
    const students = await AtcStudent.find({ atcId: user.id })
      .select("registrationNo name fatherName mobile course admissionDate createdAt examMode offlineExamStatus status photo")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    // Fetch and merge media (only photo to reduce payload)
    const { StudentMedia } = await import("@/models/StudentMedia");
    const studentsWithMedia = await Promise.all(students.map(async (s: any) => {
      const media = await StudentMedia.find({ studentId: s._id, fieldName: "photo" }).select("fieldName content").lean();
      const mediaMap: any = {};
      media.forEach((m: any) => { mediaMap[m.fieldName] = m.content; });
      return { ...s, ...mediaMap };
    }));

    return NextResponse.json({ students: studentsWithMedia });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAtcUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    console.log("[POST] Request received from ATC:", user.tpCode);
    const formData = await request.formData();
    
    // Check required fields
    const reqFields = ["name", "fatherName", "motherName", "dob", "gender", "mobile", "currentAddress", "permanentAddress", "course", "highestQualification", "session", "category", "admissionFees", "admissionDate"];
    for (const f of reqFields) {
      const val = formData.get(f);
      if (!val || String(val).trim() === "") {
        console.warn("[POST] Missing field:", f);
        return NextResponse.json({ message: `Missing required field: ${f}` }, { status: 400 });
      }
    }

    await connectDB();
    console.log("[POST] DB Connected");

    const toBase64 = async (file: any) => {
      try {
        if (!file || typeof file === "string") return file || "";
        if (!file.size || file.size === 0) return "";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
      } catch (e: any) {
        console.error("toBase64 conversion fail:", e.message);
        return "";
      }
    };

    console.log("[POST] Converting documents...");
    const photo = await toBase64(formData.get("photo"));
    const otherDocs = await toBase64(formData.get("otherDocs"));
    const aadharDoc = await toBase64(formData.get("aadharDoc"));
    const studentSignature = await toBase64(formData.get("studentSignature"));
    const marksheet10th = await toBase64(formData.get("marksheet10th"));
    const marksheet12th = await toBase64(formData.get("marksheet12th"));
    const graduationDoc = await toBase64(formData.get("graduationDoc"));
    const highestQualDoc = await toBase64(formData.get("highestQualDoc"));

    const studentMobile = String(formData.get("mobile") || "").trim();
    const aadharNo = String(formData.get("aadharNo") || "").trim();
    
    const studentData: any = {
      atcId: user.id,
      tpCode: user.tpCode,
      name: String(formData.get("name")).trim(),
      fatherName: String(formData.get("fatherName")).trim(),
      motherName: String(formData.get("motherName")).trim(),
      dob: String(formData.get("dob")),
      gender: String(formData.get("gender")),
      mobile: studentMobile,
      parentsMobile: String(formData.get("parentsMobile") || "").trim(),
      email: String(formData.get("email") || "").trim().toLowerCase(),
      currentAddress: String(formData.get("currentAddress")).trim(),
      permanentAddress: String(formData.get("permanentAddress")).trim(),
      course: String(formData.get("course")).trim(),
      courseId: formData.get("courseId") ? String(formData.get("courseId")) : undefined,
      courseType: String(formData.get("courseType") || "Regular").trim(),
      session: String(formData.get("session")).trim(),
      classRollNo: String(formData.get("classRollNo") || "").trim(),
      nationality: String(formData.get("nationality") || "Indian").trim(),
      category: String(formData.get("category")).trim(),
      maritalStatus: String(formData.get("maritalStatus") || "").trim(),
      religion: String(formData.get("religion") || "").trim(),
      disability: formData.get("disability") === "Yes",
      disabilityDetails: String(formData.get("disabilityDetails") || "").trim(),
      admissionFees: String(formData.get("admissionFees")).trim(),
      admissionDate: String(formData.get("admissionDate")).trim(),
      highestQualification: String(formData.get("highestQualification")).trim(),
      photo,
      studentSignature,
      aadharDoc,
      otherDocs,
      qualificationDoc: marksheet10th || highestQualDoc,
      marksheet10th,
      marksheet12th,
      graduationDoc,
      highestQualDoc,
      registrationNo: `PENDING-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referredBy: String(formData.get("referredBy") || "").trim(),
      password: studentMobile,
      examMode: String(formData.get("examMode") || "online").trim(),
      status: "pending"
    };

    if (aadharNo) studentData.aadharNo = aadharNo;

    // REMOVE heavy docs from main object to bypass 16MB limit
    const photoContent = studentData.photo;
    const sigContent = studentData.studentSignature;
    const aadharContent = studentData.aadharDoc;
    const otherContent = studentData.otherDocs;
    const qualContent = studentData.qualificationDoc;
    const ms10Content = studentData.marksheet10th;
    const ms12Content = studentData.marksheet12th;
    const gradContent = studentData.graduationDoc;
    const hqContent = studentData.highestQualDoc;

    studentData.photo = "";
    studentData.studentSignature = "";
    studentData.aadharDoc = "";
    studentData.otherDocs = "";
    studentData.qualificationDoc = "";
    studentData.marksheet10th = "";
    studentData.marksheet12th = "";
    studentData.graduationDoc = "";
    studentData.highestQualDoc = "";

    console.log("[POST] Saving student to DB (Basic Info)...");
    const student = await AtcStudent.create(studentData);
    console.log("[POST] Success! Student ID:", student._id);

    // Save heavy media separately to bypass 16MB limit
    const mediaToSave = [
      { name: "photo", content: photoContent },
      { name: "studentSignature", content: sigContent },
      { name: "aadharDoc", content: aadharContent },
      { name: "otherDocs", content: otherContent },
      { name: "qualificationDoc", content: qualContent },
      { name: "marksheet10th", content: ms10Content },
      { name: "marksheet12th", content: ms12Content },
      { name: "graduationDoc", content: gradContent },
      { name: "highestQualDoc", content: hqContent }
    ];

    console.log("[POST] Saving heavy media...");
    const { StudentMedia } = await import("@/models/StudentMedia");
    for (const m of mediaToSave) {
      if (m.content && String(m.content).startsWith("data:")) {
        await StudentMedia.findOneAndUpdate(
          { studentId: student._id, fieldName: m.name },
          { content: m.content },
          { upsert: true }
        );
      }
    }
    
    return NextResponse.json({ message: "Student admitted successfully", student }, { status: 201 });
  } catch (error: any) {
    console.error("[CRITICAL POST ERROR]", error);
    return NextResponse.json({ 
      message: error.message || "Unknown error",
      details: error.name,
      stack: error.stack
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

    // Handle data type conversions
    if (updateData.disability === "Yes" || updateData.disability === "No") {
      updateData.disability = updateData.disability === "Yes";
    }

    Object.assign(student, updateData);
    await student.save();

    return NextResponse.json({ message: "Student updated successfully", student });
  } catch (error: any) {
    console.error("[PUT ERROR]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
