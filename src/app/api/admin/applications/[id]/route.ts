import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { AtcApplication } from "@/models/AtcApplication";
import { AtcUser } from "@/models/AtcUser";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function verifyAdmin(request: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get("admin_token")?.value ?? "";
  if (!token) {
    const auth = request.headers.get("Authorization") ?? "";
    token = auth.replace("Bearer ", "");
  }
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

/** Generate TP Code like ATC-2024-0001 */
function generateTpCode(index: number): string {
  const year = new Date().getFullYear();
  return `ATC-${year}-${String(index).padStart(4, "0")}`;
}

// PATCH /api/admin/applications/[id] — approve or reject
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    const body = (await request.json()) as { action: "approve" | "reject" };

    if (!["approve", "reject"].includes(body.action)) {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }

    await connectDB();

    const application = await AtcApplication.findById(id);
    if (!application) {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { message: `Application is already ${application.status}.` },
        { status: 409 },
      );
    }

    if (body.action === "reject") {
      application.status = "rejected";
      await application.save();
      return NextResponse.json({ message: "Application rejected." });
    }

    // Approve — create AtcUser account
    application.status = "approved";
    await application.save();

    // Check if AtcUser already exists for this email
    const existingUser = await AtcUser.findOne({ email: application.email });
    if (!existingUser) {
      // Prevent Duplicate Key Error from `countDocuments` by finding the actual max ID
      let nextId = 1;
      const lastUser = await AtcUser.findOne().sort({ createdAt: -1 });
      if (lastUser?.tpCode) {
        const parts = lastUser.tpCode.split("-");
        if (parts.length === 3) {
          nextId = parseInt(parts[2], 10) + 1;
        }
      }
      
      const tpCode = generateTpCode(isNaN(nextId) ? 1 : nextId);
      // Default password = mobile number
      const hashedPassword = await bcrypt.hash(application.mobile, 12);

      await AtcUser.create({
        tpCode,
        trainingPartnerName: application.trainingPartnerName,
        email: application.email,
        mobile: application.mobile,
        password: hashedPassword,
        applicationId: application._id,
      });

      return NextResponse.json({
        message: "Application approved and ATC account created.",
        tpCode,
        defaultPassword: application.mobile,
      });
    }

    return NextResponse.json({ message: "Application approved." });
  } catch (error: any) {
    console.error("[ATC Approval Error]", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error during approval." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/applications/[id] — delete an application
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  await connectDB();

  await AtcApplication.findByIdAndDelete(id);
  return NextResponse.json({ message: "Application deleted." });
}
