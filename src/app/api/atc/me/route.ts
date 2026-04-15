import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("atc_token")?.value ?? "";
    if (!token) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      tpCode: string;
      trainingPartnerName: string;
      role: string;
    };

    if (decoded.role !== "atc") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ user: { id: decoded.id, tpCode: decoded.tpCode, trainingPartnerName: decoded.trainingPartnerName } });
  } catch {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
}
