import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { StudentExam } from "@/models/StudentExam";
import { AtcStudent } from "@/models/Student"; // Ensure model registration
import { AtcUser } from "@/models/AtcUser";
import { lifecycleStatusForExam } from "@/lib/exam-schedule";

import { verifyAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const atcId = searchParams.get("atcId");

    await connectDB();
    
    const query: Record<string, unknown> = {};
    if (atcId && mongoose.Types.ObjectId.isValid(atcId)) {
      query.atcId = new mongoose.Types.ObjectId(atcId);
    }

    // We populate student info and ATC info
    const requests = await StudentExam.find(query)
      .populate({
        path: "studentId",
        select: "name registrationNo mobile",
        model: AtcStudent
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
    console.error("[admin/exams/all GET]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
