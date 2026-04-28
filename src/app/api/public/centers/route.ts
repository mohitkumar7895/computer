import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/mongodb";
import { AtcUser } from "@/models/AtcUser";
import { AtcApplication } from "@/models/AtcApplication";

export async function GET() {
  try {
    await connectDB();
    // Source 1: ATC users (active/disabled both, for visibility in public form)
    const users = await AtcUser.find({
      tpCode: { $exists: true, $ne: "" },
      trainingPartnerName: { $exists: true, $ne: "" },
    })
      .select("tpCode trainingPartnerName")
      .lean();

    // Source 2: approved applications (fallback for centers not provisioned in AtcUser yet)
    const applications = await AtcApplication.find({
      status: "approved",
      tpCode: { $exists: true, $ne: "" },
      trainingPartnerName: { $exists: true, $ne: "" },
    })
      .select("tpCode trainingPartnerName")
      .lean();

    const uniqueByCode = new Map<string, { tpCode: string; trainingPartnerName: string }>();
    for (const c of users) {
      uniqueByCode.set(String(c.tpCode), {
        tpCode: String(c.tpCode),
        trainingPartnerName: String(c.trainingPartnerName),
      });
    }
    for (const c of applications) {
      const code = String(c.tpCode);
      if (!uniqueByCode.has(code)) {
        uniqueByCode.set(code, {
          tpCode: code,
          trainingPartnerName: String(c.trainingPartnerName),
        });
      }
    }

    const normalizedCenters = Array.from(uniqueByCode.values()).sort((a, b) =>
      a.trainingPartnerName.localeCompare(b.trainingPartnerName),
    );

    return NextResponse.json(normalizedCenters);
  } catch (error: any) {
    console.error("[api/public/centers GET]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
