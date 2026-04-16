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
    await connectDB();

    const contentType = request.headers.get("content-type") ?? "";
    let action: "approve" | "reject" | null = null;
    let formData: FormData | null = null;
    let body: any = null;

    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData();
      const maybeAction = String(formData.get("action") ?? "").trim();
      action = maybeAction === "approve" || maybeAction === "reject" ? maybeAction : null;
    } else {
      body = (await request.json()) as {
        action?: "approve" | "reject";
        update?: Record<string, unknown>;
      };
      action = body.action ?? null;
    }

    if (formData) {
      const existingAction = String(formData.get("action") ?? "").trim();
      if (existingAction === "approve" || existingAction === "reject") {
        action = existingAction as "approve" | "reject";
      }
    }

    if (!action && formData) {
      const application = await AtcApplication.findById(id);
      if (!application) {
        return NextResponse.json({ message: "Application not found." }, { status: 404 });
      }

      const requiredFields = [
        "processFee", "trainingPartnerName", "trainingPartnerAddress",
        "district", "state", "pin", "mobile", "email",
        "statusOfInstitution", "yearOfEstablishment", "chiefName",
        "designation", "educationQualification", "professionalExperience",
        "dob", "paymentMode",
      ];

      const updatedValues: Record<string, any> = {};
      for (const field of requiredFields) {
        updatedValues[field] = String(formData.get(field) ?? "").trim();
      }

      if (!updatedValues.trainingPartnerName || !updatedValues.trainingPartnerAddress || !updatedValues.district || !updatedValues.state) {
        return NextResponse.json({ message: "Missing required application fields." }, { status: 400 });
      }
      if (!/^[0-9]{10}$/.test(updatedValues.mobile)) {
        return NextResponse.json({ message: "Mobile number must be 10 digits." }, { status: 400 });
      }
      if (!/^[0-9]{6}$/.test(updatedValues.pin)) {
        return NextResponse.json({ message: "PIN must be 6 digits." }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedValues.email)) {
        return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
      }

      const zones = JSON.parse(String(formData.get("zones") ?? "[]"));
      const infraString = String(formData.get("infrastructure") ?? application.infrastructure ?? "{}");
      const photoFile = formData.get("photo") as File | null;
      const ssFile = formData.get("paymentScreenshot") as File | null;
      const docFile = formData.get("instituteDocument") as File | null;

      const toBase64 = async (file: File | null) => {
        if (!file || file.size === 0) return "";
        const buffer = await file.arrayBuffer();
        return `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`;
      };

      const photoBase64 = photoFile ? await toBase64(photoFile) : String(formData.get("existingPhoto") ?? application.photo ?? "");
      const ssBase64 = ssFile ? await toBase64(ssFile) : String(formData.get("existingPaymentScreenshot") ?? application.paymentScreenshot ?? "");
      const docBase64 = docFile ? await toBase64(docFile) : String(formData.get("existingInstituteDocument") ?? application.instituteDocument ?? "");

      application.processFee = updatedValues.processFee;
      application.trainingPartnerName = updatedValues.trainingPartnerName;
      application.trainingPartnerAddress = updatedValues.trainingPartnerAddress;
      application.postalAddressOffice = String(formData.get("postalAddressOffice") ?? application.postalAddressOffice ?? "");
      application.zones = Array.isArray(zones) ? zones : [];
      application.totalName = String(formData.get("totalName") ?? application.totalName ?? "");
      application.district = updatedValues.district;
      application.state = updatedValues.state;
      application.pin = updatedValues.pin;
      application.country = String(formData.get("country") ?? application.country ?? "INDIA");
      application.mobile = updatedValues.mobile;
      application.email = updatedValues.email.toLowerCase();
      application.statusOfInstitution = updatedValues.statusOfInstitution;
      application.yearOfEstablishment = updatedValues.yearOfEstablishment;
      application.chiefName = updatedValues.chiefName;
      application.designation = updatedValues.designation;
      application.educationQualification = updatedValues.educationQualification;
      application.professionalExperience = updatedValues.professionalExperience;
      application.dob = updatedValues.dob;
      application.photo = photoBase64 || application.photo;
      application.paymentMode = updatedValues.paymentMode;
      application.paymentScreenshot = ssBase64 || application.paymentScreenshot;
      application.instituteDocument = docBase64 || application.instituteDocument;
      application.infrastructure = infraString;

      await application.save();

      if (application.status === "approved") {
        const user = await AtcUser.findOne({ applicationId: application._id });
        if (user) {
          user.trainingPartnerName = application.trainingPartnerName;
          user.mobile = application.mobile;
          user.email = application.email;
          await user.save();
        }
      }

      return NextResponse.json({ message: "Application updated successfully.", application });
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }

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

    // Check if AtcUser already exists for this email
    const existingUser = await AtcUser.findOne({ email: application.email });
    let tpCode = application.tpCode;

    if (!existingUser) {
      let nextId = 1;
      const lastUser = await AtcUser.findOne().sort({ createdAt: -1 });
      if (lastUser?.tpCode) {
        const parts = lastUser.tpCode.split("-");
        if (parts.length === 3) nextId = parseInt(parts[2], 10) + 1;
      }
      
      tpCode = generateTpCode(isNaN(nextId) ? 1 : nextId);
      const hashedPassword = await bcrypt.hash(application.mobile, 12);

      await AtcUser.create({
        tpCode,
        trainingPartnerName: application.trainingPartnerName,
        email: application.email,
        mobile: application.mobile,
        password: hashedPassword,
        applicationId: application._id,
      });
    } else {
      tpCode = existingUser.tpCode;
    }

    application.tpCode = tpCode;
    await application.save();

    return NextResponse.json({
      message: "Application approved successfully.",
      tpCode,
      defaultPassword: application.mobile,
    });
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
