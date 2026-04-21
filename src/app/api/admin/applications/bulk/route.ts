import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcApplication } from "@/models/AtcApplication";
import { AtcUser } from "@/models/AtcUser";
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
      // Find tpCodes to also delete linked users
      const apps = await AtcApplication.find({ _id: { $in: ids } }, { tpCode: 1 });
      const tpCodes = apps.map(app => app.tpCode).filter(Boolean);
      
      await AtcUser.deleteMany({ tpCode: { $in: tpCodes } });
      await AtcApplication.deleteMany({ _id: { $in: ids } });
      
      return NextResponse.json({ message: `${ids.length} centers deleted successfully` });
    } 
    else if (action === "disable") {
      const apps = await AtcApplication.find({ _id: { $in: ids } }, { tpCode: 1 });
      const tpCodes = apps.map(app => app.tpCode).filter(Boolean);
      
      await AtcUser.updateMany({ tpCode: { $in: tpCodes } }, { $set: { status: "disabled" } });
      return NextResponse.json({ message: `${ids.length} centers disabled successfully` });
    }
    else if (action === "reject") {
      await AtcApplication.updateMany({ _id: { $in: ids } }, { $set: { status: "rejected" } });
      return NextResponse.json({ message: `${ids.length} applications rejected successfully` });
    }
    else if (action === "enable") {
      const apps = await AtcApplication.find({ _id: { $in: ids } }, { tpCode: 1 });
      const tpCodes = apps.map(app => app.tpCode).filter(Boolean);
      
      await AtcUser.updateMany({ tpCode: { $in: tpCodes } }, { $set: { status: "active" } });
      return NextResponse.json({ message: `${ids.length} centers enabled successfully` });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
