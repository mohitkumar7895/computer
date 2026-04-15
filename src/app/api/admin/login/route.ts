import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const { email, password } = body;

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    if (!JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET is not defined in environment variables.");
      return NextResponse.json({ message: "Server configuration error." }, { status: 500 });
    }

    await connectDB();

    const admin = await AdminUser.findOne({ email: email.trim().toLowerCase() });
    if (!admin) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const token = jwt.sign(
      { id: admin._id.toString(), username: admin.username, role: "admin" },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const response = NextResponse.json({
      message: "Login successful.",
      admin: { id: admin._id.toString(), username: admin.username, email: admin.email },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[admin/login]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
