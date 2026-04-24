import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/mongodb";
import { AtcUser } from "@/models/AtcUser";

export async function GET() {
  try {
    await connectDB();
    // Fetch only active centers
    const centers = await AtcUser.find({ status: "active" })
      .select("tpCode trainingPartnerName")
      .sort({ trainingPartnerName: 1 })
      .lean();
      
    return NextResponse.json(centers);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
