import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student";
import { lifecycleStatusForExam } from "@/lib/exam-schedule";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atc_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const requests = await StudentExam.find({ atcId: new mongoose.Types.ObjectId(decoded.id) })
      .populate({
        path: "studentId",
        select: "name registrationNo course fatherName mobile photo profileImage",
        model: AtcStudent,
      })
      .populate({
        path: "atcId",
        select: "trainingPartnerName tpCode",
      })
      .sort({ createdAt: -1 })
      .lean();

    const updates = requests
      .map((req) => {
        const lifecycleStatus = lifecycleStatusForExam(req);
        if (req.lifecycleStatus === lifecycleStatus) return null;
        return {
          updateOne: {
            filter: { _id: req._id },
            update: { $set: { lifecycleStatus } },
          },
        };
      })
      .filter(Boolean) as Array<{ updateOne: { filter: { _id: unknown }; update: { $set: { lifecycleStatus: string } } } }>;
    if (updates.length > 0) {
      await StudentExam.bulkWrite(updates);
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[atc/exams/all GET]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
