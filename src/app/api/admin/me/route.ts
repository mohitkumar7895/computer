import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const decoded = await verifyAdmin(request);
    
    if (!decoded) {
      return NextResponse.json({ authorized: false, message: "No session found" }, { status: 401 });
    }

    await connectDB();
    
    const user = await AdminUser.findById(decoded.id).select("-password").lean();
    
    if (!user) {
      return NextResponse.json({ authorized: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      authorized: true,
      user: { 
        id: user._id.toString(), 
        username: user.username,
        email: user.email,
        role: "admin"
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error("API /admin/me error:", err);
    return NextResponse.json({ authorized: false, message: "Internal server error" }, { status: 500 });
  }
}
