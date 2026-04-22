import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { Settings } from "@/models/Settings";
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
      const students = await AtcStudent.find({ _id: { $in: ids }, status: "pending" });
      if (students.length === 0) return NextResponse.json({ message: "No pending students selected." }, { status: 400 });

      const formatSetting = await Settings.findOne({ key: "reg_format_student" });
      let format = formatSetting ? JSON.parse(formatSetting.value) : { prefix: "ATC-ST-", counter: 1, padding: 4 };

      const results = [];
      for (const student of students) {
        if (!student.registrationNo || student.registrationNo.startsWith("PENDING-")) {
          const regNo = `${format.prefix}${String(format.counter).padStart(format.padding, "0")}`;
          student.registrationNo = regNo;
          format.counter += 1;
        }
        student.status = "active";
        await student.save();
        results.push(student);
      }

      // Save updated counter
      await Settings.findOneAndUpdate(
        { key: "reg_format_student" },
        { value: JSON.stringify(format) },
        { upsert: true }
      );

      return NextResponse.json({ message: `${results.length} students approved successfully.` });
    }
    else if (action === "reject") {
      const res = await AtcStudent.updateMany({ _id: { $in: ids }, status: "pending" }, { $set: { status: "rejected" } });
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
