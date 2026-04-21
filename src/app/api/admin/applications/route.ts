import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { AtcApplication } from "@/models/AtcApplication";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as string;
export const dynamic = 'force-dynamic';

async function verifyAdmin(request: Request) {
  // Try cookie first (httpOnly), fallback to Authorization header (for client-side fetch)
  const cookieStore = await cookies();
  let token = cookieStore.get("admin_token")?.value ?? "";
  if (!token) {
    const auth = request.headers.get("Authorization") ?? "";
    token = auth.replace("Bearer ", "");
  }
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

// GET — list all applications
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  await connectDB();
  const applications = await AtcApplication.find().sort({ createdAt: -1 }).lean();

  // Get all ATC users to map tpCode and status
  const { AtcUser } = await import("@/models/AtcUser");
  const users = await AtcUser.find({}, "tpCode email applicationId status").lean();
  
  const tpCodeMap = new Map();
  const emailMap = new Map();
  const statusMap = new Map();
  
  users.forEach((u) => {
    if (u.applicationId) {
      tpCodeMap.set(u.applicationId.toString(), u.tpCode);
      statusMap.set(u.applicationId.toString(), u.status);
    }
    if (u.email) {
      const e = u.email.trim().toLowerCase();
      emailMap.set(e, u.tpCode);
      if (!u.applicationId) statusMap.set(e, u.status);
    }
  });

  const enrichedApps = applications.map((app) => {
    const emailKey = (app.email || "").trim().toLowerCase();
    const appStatus = statusMap.get(app._id.toString()) || statusMap.get(emailKey) || "active";
    return {
      ...app,
      tpCode: app.tpCode || tpCodeMap.get(app._id.toString()) || emailMap.get(emailKey) || null,
      userStatus: appStatus,
    };
  });

  return NextResponse.json({ applications: enrichedApps });
}

// POST — admin manually creates/submits an ATC application (directly approved)
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  try {
    const formData = await request.formData();

    const requiredFields = [
      "processFee", "trainingPartnerName", "trainingPartnerAddress",
      "district", "state", "pin", "mobile", "email",
      "statusOfInstitution", "yearOfEstablishment", "chiefName",
      "designation", "educationQualification", "professionalExperience",
      "dob", "paymentMode",
    ];

    for (const field of requiredFields) {
      const value = String(formData.get(field) ?? "").trim();
      if (!value) {
        return NextResponse.json({ message: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const mobile = String(formData.get("mobile") ?? "");
    const pin = String(formData.get("pin") ?? "");
    const email = String(formData.get("email") ?? "");

    if (!/^\d{10}$/.test(mobile))
      return NextResponse.json({ message: "Mobile must be exactly 10 digits." }, { status: 400 });
    if (!/^\d{6}$/.test(pin))
      return NextResponse.json({ message: "PIN must be exactly 6 digits." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });

    // Handle files (convert to base64 for MongoDB storage)
    let photoBase64 = "";
    const photoFile = formData.get("photo") as File | null;
    if (photoFile && photoFile.size > 0) {
      const buffer = await photoFile.arrayBuffer();
      photoBase64 = `data:${photoFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let logoBase64 = "";
    const logoFile = formData.get("logo") as File | null;
    if (logoFile && logoFile.size > 0) {
      const buffer = await logoFile.arrayBuffer();
      logoBase64 = `data:${logoFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let sigBase64 = "";
    const sigFile = formData.get("signature") as File | null;
    if (sigFile && sigFile.size > 0) {
      const buffer = await sigFile.arrayBuffer();
      sigBase64 = `data:${sigFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let aadharBase64 = "";
    const aadharFile = formData.get("aadharDoc") as File | null;
    if (aadharFile && aadharFile.size > 0) {
      const buffer = await aadharFile.arrayBuffer();
      aadharBase64 = `data:${aadharFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let marksheetBase64 = "";
    const marksheetFile = formData.get("marksheetDoc") as File | null;
    if (marksheetFile && marksheetFile.size > 0) {
      const buffer = await marksheetFile.arrayBuffer();
      marksheetBase64 = `data:${marksheetFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let otherBase64 = "";
    const otherFile = formData.get("otherDocs") as File | null;
    if (otherFile && otherFile.size > 0) {
      const buffer = await otherFile.arrayBuffer();
      otherBase64 = `data:${otherFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let ssBase64 = "";
    const ssFile = formData.get("paymentScreenshot") as File | null;
    if (ssFile && ssFile.size > 0) {
      const buffer = await ssFile.arrayBuffer();
      ssBase64 = `data:${ssFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let instDocBase64 = "";
    const instDocFile = formData.get("instituteDocument") as File | null;
    if (instDocFile && instDocFile.size > 0) {
      const buffer = await instDocFile.arrayBuffer();
      instDocBase64 = `data:${instDocFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    const data = {
      processFee: String(formData.get("processFee") ?? ""),
      trainingPartnerName: String(formData.get("trainingPartnerName") ?? ""),
      trainingPartnerAddress: String(formData.get("trainingPartnerAddress") ?? ""),
      postalAddressOffice: String(formData.get("postalAddressOffice") ?? ""),
      zones: JSON.parse(String(formData.get("zones") ?? "[]")),
      totalName: String(formData.get("totalName") ?? ""),
      district: String(formData.get("district") ?? ""),
      state: String(formData.get("state") ?? ""),
      pin,
      country: String(formData.get("country") ?? "INDIA"),
      mobile,
      email,
      statusOfInstitution: String(formData.get("statusOfInstitution") ?? ""),
      yearOfEstablishment: String(formData.get("yearOfEstablishment") ?? ""),
      chiefName: String(formData.get("chiefName") ?? ""),
      designation: String(formData.get("designation") ?? ""),
      educationQualification: String(formData.get("educationQualification") ?? ""),
      professionalExperience: String(formData.get("professionalExperience") ?? ""),
      dob: String(formData.get("dob") ?? ""),
      photo: photoBase64,
      logo: logoBase64,
      signature: sigBase64,
      aadharDoc: aadharBase64,
      marksheetDoc: marksheetBase64,
      otherDocs: otherBase64,
      paymentMode: String(formData.get("paymentMode") ?? ""),
      paymentScreenshot: ssBase64,
      instituteDocument: instDocBase64,
      infrastructure: String(formData.get("infrastructure") ?? "{}"),
      status: "approved" as const,
      submittedByAdmin: true,
    };

    const application = await AtcApplication.create(data);

    // Auto-generate ATC account
    const { AtcUser } = await import("@/models/AtcUser");
    const existingUser = await AtcUser.findOne({ email: application.email });
    
    if (!existingUser) {
      let tpCode = String(formData.get("customTpCode") || "").trim();
      let rawPassword = String(formData.get("password") || formData.get("customPassword") || "").trim();

      if (!tpCode) {
        let nextId = 1;
        const lastUser = await AtcUser.findOne().sort({ createdAt: -1 });
        if (lastUser?.tpCode) {
          const parts = lastUser.tpCode.split("-");
          if (parts.length === 3) nextId = parseInt(parts[2], 10) + 1;
        }
        tpCode = `ATC-${new Date().getFullYear()}-${String(isNaN(nextId) ? 1 : nextId).padStart(4, "0")}`;
      }

      if (!rawPassword) {
        rawPassword = application.mobile;
      }

      const bcrypt = (await import("bcryptjs")).default;
      const hashedPassword = await bcrypt.hash(rawPassword, 12);

      await AtcUser.create({
        tpCode,
        trainingPartnerName: application.trainingPartnerName,
        email: application.email,
        mobile: application.mobile,
        password: hashedPassword,
        applicationId: application._id,
        status: "active",
      });

      // Save tpCode back to application
      application.tpCode = tpCode;
      await application.save();

      return NextResponse.json({ 
        message: "Application auto-approved.", 
        tpCode, 
        mobile: rawPassword 
      }, { status: 201 });
    }

    return NextResponse.json({ message: "Application created successfully." }, { status: 201 });
  } catch (error) {
    console.error("[admin/applications POST]", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
