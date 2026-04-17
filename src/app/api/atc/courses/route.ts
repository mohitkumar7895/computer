import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { AtcUser } from "@/models/AtcUser";
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
  const sessionUser = await getAtcUser();
  if (!sessionUser) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const user = await AtcUser.findById(sessionUser.id).lean();
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // approved zones of the ATC
    const approvedZones = user.zones || [];

    // fetch courses that belong to those zones; if no zones are assigned, return all active courses
    const query: Record<string, unknown> = { status: "active" };
    if (approvedZones.length > 0) {
      query.zone = { $in: approvedZones };
    }

    const courses = await Course.find(query).sort({ name: 1 });

    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
