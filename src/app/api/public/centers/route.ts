import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/mongodb";
import { AtcUser } from "@/models/AtcUser";

export async function GET() {
  try {
    await connectDB();
    // Fetch active centers and cross-check with approved applications
    const centers = await AtcUser.find({ 
      status: "active",
      tpCode: { $exists: true, $ne: "" },
      trainingPartnerName: { $exists: true, $ne: "" }
    })
    .populate({
      path: "applicationId",
      select: "status"
    })
    .lean();
    
    // Filter to ensure associated application is also 'approved'
    const validCenters = centers.filter(c => {
      const app = c.applicationId as any;
      return app && app.status === "approved";
    });
      
    return NextResponse.json(validCenters);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
