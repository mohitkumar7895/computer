import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Settings } from "@/models/Settings";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    // Fetch all brand related settings
    const keys = [
      "brand_name", 
      "brand_mobile", 
      "brand_email", 
      "brand_address", 
      "brand_url", 
      "brand_logo",
      "qr_code",
      "auth_signature"
    ];
    
    const settings = await Settings.find({ key: { $in: keys } }).lean();
    
    // Convert to a nice object
    const brandData = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(brandData);
  } catch (error) {
    console.error("[public/brand GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
