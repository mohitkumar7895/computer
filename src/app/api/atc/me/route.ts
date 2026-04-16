import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as string;

import { connectDB } from "@/lib/mongodb";
import { AtcUser } from "@/models/AtcUser";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atc_token")?.value ?? "";
    if (!token) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "atc") return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    await connectDB();
    const user = await AtcUser.findById(decoded.id).select("-password").lean();
    if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });

    return NextResponse.json({ user: { 
      id: user._id.toString(), 
      tpCode: user.tpCode, 
      trainingPartnerName: user.trainingPartnerName,
      mobile: user.mobile,
      email: user.email
    } });
  } catch {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atc_token")?.value ?? "";
    if (!token) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "atc") return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { mobile, email } = await request.json();
    await connectDB();
    
    const user = await AtcUser.findByIdAndUpdate(
      decoded.id,
      { $set: { mobile, email } },
      { new: true }
    );

    return NextResponse.json({ message: "Profile updated successfully.", user });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
