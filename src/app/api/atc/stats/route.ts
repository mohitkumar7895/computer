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
  const pendingReview = await AtcStudent.countDocuments({ atcId: user.id, status: "pending" });
  const active = await AtcStudent.countDocuments({
    atcId: user.id,
    $or: [{ status: "active" }, { status: "approved" }],
    userStatus: { $ne: "disabled" },
  });
  const rejected = await AtcStudent.countDocuments({ atcId: user.id, status: "rejected" });
  const blocked = await AtcStudent.countDocuments({ atcId: user.id, userStatus: "disabled" });

  return NextResponse.json({
    total,
    pendingReview,
    active,
    rejected,
    blocked,
  });
}
