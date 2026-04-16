import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
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

  const total = await AtcStudent.countDocuments({ atcId: user.id });
  const active = await AtcStudent.countDocuments({ atcId: user.id, status: "active" });
  const inactive = await AtcStudent.countDocuments({ atcId: user.id, status: "inactive" });
  
  // Since there's no completion field currently, we'll return 0 or placeholder
  // Or maybe user means 'inactive' is pending?
  
  return NextResponse.json({
    total,
    active,
    completing: 0, // Placeholder
    pending: inactive,
  });
}
