import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { ids, action } = await request.json();
    if (!ids || !Array.isArray(ids) || !action) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    await connectDB();

    if (action === "delete") {
      await AtcStudent.deleteMany({ _id: { $in: ids } });
      return NextResponse.json({ message: `${ids.length} students deleted successfully` });
    } 
    else if (action === "disable") {
      await AtcStudent.updateMany({ _id: { $in: ids } }, { $set: { userStatus: "disabled" } });
      return NextResponse.json({ message: `${ids.length} students disabled successfully` });
    }
    else if (action === "enable") {
      await AtcStudent.updateMany({ _id: { $in: ids } }, { $set: { userStatus: "active" } });
      return NextResponse.json({ message: `${ids.length} students enabled successfully` });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
