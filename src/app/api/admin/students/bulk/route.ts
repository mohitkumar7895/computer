import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { Settings } from "@/models/Settings";
import { Course } from "@/models/Course";
import { AtcUser } from "@/models/AtcUser";
import { WalletTransaction } from "@/models/WalletTransaction";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { ids, action } = await request.json();
    if (!ids || !Array.isArray(ids) || !action) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    await connectDB();

    if (action === "approve") {
      const students = await AtcStudent.find({ _id: { $in: ids }, status: { $in: ["pending", "pending_admin", "approved"] } });
      if (students.length === 0) return NextResponse.json({ message: "No pending students selected." }, { status: 400 });

      const formatSetting = await Settings.findOne({ key: "reg_format_student" });
      let format = formatSetting ? JSON.parse(formatSetting.value) : { prefix: "ATC-ST-", counter: 1, padding: 4 };

      const results = [];
      const failed: string[] = [];
      for (const student of students) {
        const normalizedCourse = String(student.course || "").trim();
        const courseQuery: any[] = [
          { name: normalizedCourse },
          { shortName: normalizedCourse },
          { name: { $regex: `^${escapeRegex(normalizedCourse)}$`, $options: "i" } },
          { shortName: { $regex: `^${escapeRegex(normalizedCourse)}$`, $options: "i" } },
        ];
        if (student.courseId) courseQuery.push({ _id: student.courseId });
        const course = await Course.findOne({ $or: courseQuery }).lean() as any;
        if (!course) {
          failed.push(`${student.name}: course not found`);
          continue;
        }

        const registrationFee = Number(course.registrationFee || 0);
        const updatedAtc = await AtcUser.findOneAndUpdate(
          { _id: student.atcId, walletBalance: { $gte: registrationFee } },
          { $inc: { walletBalance: -registrationFee } },
          { new: true }
        ).lean();

        if (!updatedAtc) {
          failed.push(`${student.name}: insufficient balance`);
          continue;
        }

        // Keep student's total fee/admission fee unchanged.
        // Only course registration fee is deducted from ATC wallet.
        await WalletTransaction.create({
          atcId: student.atcId,
          tpCode: student.tpCode,
          type: "debit",
          amount: registrationFee,
          reason: "Course registration fee deduction",
          studentId: student._id,
          studentName: student.name,
          courseName: student.course,
        });

        if (!student.registrationNo || student.registrationNo.startsWith("PENDING-") || student.registrationNo.startsWith("DIRECT-")) {
          let prefix = format.prefix;
          if (prefix.includes("{YEAR}")) {
            prefix = prefix.replace("{YEAR}", new Date().getFullYear().toString());
          }
          
          let regNo = `${prefix}${String(format.counter).padStart(format.padding, "0")}`;
          
          // Ensure uniqueness
          let exists = await AtcStudent.findOne({ registrationNo: regNo });
          while (exists) {
            format.counter += 1;
            regNo = `${prefix}${String(format.counter).padStart(format.padding, "0")}`;
            exists = await AtcStudent.findOne({ registrationNo: regNo });
          }

          student.registrationNo = regNo;
          format.counter += 1;
        }
        student.status = "active";
        await student.save();
        results.push(student);
      }

      // Save updated counter once
      await Settings.findOneAndUpdate(
        { key: "reg_format_student" },
        { value: JSON.stringify(format) },
        { upsert: true }
      );

      const failureText = failed.length > 0 ? ` ${failed.length} failed (${failed.slice(0, 3).join(", ")}${failed.length > 3 ? ", ..." : ""}).` : "";
      return NextResponse.json({ message: `${results.length} students approved successfully.${failureText}` });
    }
    else if (action === "reject") {
      const res = await AtcStudent.updateMany({ _id: { $in: ids }, status: { $in: ["pending", "pending_admin", "approved"] } }, { $set: { status: "rejected" } });
      return NextResponse.json({ message: `${res.modifiedCount} students rejected successfully` });
    }
    else if (action === "delete") {
      await AtcStudent.deleteMany({ _id: { $in: ids } });
      return NextResponse.json({ message: `${ids.length} students deleted successfully` });
    } 
    else if (action === "disable") {
      const res = await AtcStudent.updateMany({ _id: { $in: ids }, status: "active" }, { $set: { userStatus: "disabled" } });
      return NextResponse.json({ message: `${res.modifiedCount} students disabled successfully` });
    }
    else if (action === "enable") {
      const res = await AtcStudent.updateMany({ _id: { $in: ids }, status: "active" }, { $set: { userStatus: "active" } });
      return NextResponse.json({ message: `${res.modifiedCount} students enabled successfully` });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
