import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as string;

import { connectDB } from "@/lib/mongodb";
import { AtcUser } from "@/models/AtcUser";
import { AtcApplication } from "@/models/AtcApplication";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atc_token")?.value ?? "";
    
    if (!token) {
      return NextResponse.json({ authorized: false, message: "No session found" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "atc") {
       return NextResponse.json({ authorized: false, message: "Invalid role" }, { status: 401 });
    }

    await connectDB();
    
    // Explicitly initialize AtcApplication
    await import("@/models/AtcApplication");
    
    const user = await AtcUser.findById(decoded.id)
      .populate({
        path: "applicationId",
        select: "-photo -logo -signature -aadharDoc -marksheetDoc -otherDocs -paymentScreenshot -instituteDocument"
      })
      .lean() as any;
    
    if (!user) {
      return NextResponse.json({ authorized: false, message: "User not found" }, { status: 404 });
    }

    // Fetch Stats in parallel to save time
    const { AtcStudent } = await import("@/models/Student");
    const statsResult = await AtcStudent.aggregate([
      { $match: { atcId: user._id } },
      {
        $facet: {
          total: [{ $count: "count" }],
          pendingReview: [{ $match: { status: "pending" } }, { $count: "count" }],
          active: [
            { $match: { $or: [{ status: "active" }, { status: "approved" }], userStatus: { $ne: "disabled" } } },
            { $count: "count" }
          ],
          rejected: [{ $match: { status: "rejected" } }, { $count: "count" }],
          blocked: [{ $match: { userStatus: "disabled" } }, { $count: "count" }]
        }
      }
    ]);

    const stats = statsResult[0];

    return NextResponse.json({ 
      authorized: true,
      user: { 
        id: user._id.toString(), 
        tpCode: user.tpCode, 
        trainingPartnerName: user.trainingPartnerName,
        mobile: user.mobile,
        email: user.email,
        application: user.applicationId
      },
      stats: {
        total: stats.total[0]?.count || 0,
        pendingReview: stats.pendingReview[0]?.count || 0,
        active: stats.active[0]?.count || 0,
        rejected: stats.rejected[0]?.count || 0,
        blocked: stats.blocked[0]?.count || 0,
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error("API /atc/me error:", err);
    return NextResponse.json({ authorized: false, message: "Session expired" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atc_token")?.value ?? "";
    if (!token) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "atc") return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { trainingPartnerName, mobile, email } = await request.json();
    await connectDB();
    
    const user = await AtcUser.findByIdAndUpdate(
      decoded.id,
      { $set: { trainingPartnerName, mobile, email } },
      { new: true }
    );

    if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id.toString(),
        tpCode: user.tpCode,
        trainingPartnerName: user.trainingPartnerName,
        mobile: user.mobile,
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
