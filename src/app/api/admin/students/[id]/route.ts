import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { Settings } from "@/models/Settings";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action, updateData, newPassword } = await request.json();

    if (!action) return NextResponse.json({ message: "Action is required" }, { status: 400 });

    await connectDB();
    const student = await AtcStudent.findById(id);
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    if (action === "approved" || action === "rejected") {
      if (action === "approved" && (!student.registrationNo || student.registrationNo.startsWith("PENDING-") || student.registrationNo.startsWith("DIRECT-"))) {
        const { generateNextId } = await import("@/lib/idGenerator");
        const regNo = await generateNextId("reg_format_student", AtcStudent, "registrationNo");
        student.registrationNo = regNo;
      }
      student.status = action === "approved" ? "active" : action;
    } 
    else if (action === "toggleStatus") {
      student.userStatus = student.userStatus === "active" ? "disabled" : "active";
    }
    else if (action === "resetPassword") {
      if (!newPassword) return NextResponse.json({ message: "New password is required" }, { status: 400 });
      student.password = newPassword;
    }
    else if (action === "updateDetails") {
      if (!updateData) return NextResponse.json({ message: "Update data is required" }, { status: 400 });
      // Filter out fields we don't want to update via this action
      const allowedFields = [
        "name", "fatherName", "motherName", "mobile", "email", "course", 
        "currentAddress", "permanentAddress", "parentsMobile", "aadharNo",
        "photo", "studentSignature", "qualificationDoc", "highestQualDoc", "marksheet10th", "marksheet12th",
        "graduationDoc", "aadharDoc", "otherDocs",
        "dob", "gender", "category", "religion", "nationality", "session",
        "maritalStatus", "courseType", "highestQualification", "admissionFees",
        "admissionDate", "referredBy", "examMode", "totalFee"
      ];
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          (student as any)[key] = updateData[key];
        }
      });

      if (updateData.password) {
        student.password = updateData.password;
      }
    }

    await student.save();

    return NextResponse.json({ 
      message: "Action processed successfully", 
      student,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const deleted = await AtcStudent.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
