import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, shortName, durationMonths, zone, status, hasMarksheet, hasCertificate } = body;
    const { id } = await context.params;

    await connectDB();
    const course = await Course.findByIdAndUpdate(
      id,
      { name, shortName, durationMonths, zone, status, hasMarksheet, hasCertificate },
      { new: true }
    );

    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    await connectDB();
    const course = await Course.findByIdAndDelete(id);
    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
