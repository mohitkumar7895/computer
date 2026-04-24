import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }

    const { email, password } = body as { email?: string; password?: string };

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    if (!JWT_SECRET) {
      return NextResponse.json({ message: "Server configuration error: Missing JWT_SECRET." }, { status: 500 });
    }

    try {
      await connectDB();
    } catch (dbErr: any) {
      return NextResponse.json({ 
        message: "Database connection failed.",
        debug_info: dbErr.message 
      }, { status: 500 });
    }

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
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Clear any existing ATC token to prevent session crossover
    response.cookies.delete("atc_token");

    return response;
  } catch (error: any) {
    console.error("[admin/login] UNEXPECTED_ERROR:", error);
    return NextResponse.json({ 
      message: "Internal server error.",
      debug_info: `UNEXPECTED: ${error.message}`
    }, { status: 500 });
  }
}
