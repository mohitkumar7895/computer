import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcApplication } from "@/models/AtcApplication";

export async function POST(request: Request) {
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
      return NextResponse.json(
        { message: `Missing required field: ${field}` },
        { status: 400 },
      );
    }
  }

  const mobile = String(formData.get("mobile") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const email = String(formData.get("email") ?? "");

  if (!/^\d{10}$/.test(mobile)) {
    return NextResponse.json({ message: "Mobile must be exactly 10 digits." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ message: "PIN must be exactly 6 digits." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await connectDB();

    // Check for duplicate email
    const existing = await AtcApplication.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { message: "An application with this email already exists." },
        { status: 409 },
      );
    }

    // Handle files (convert to base64 for MongoDB storage)
    let photoBase64 = "";
    const photoFile = formData.get("photo") as File | null;
    if (photoFile && photoFile.size > 0) {
      const buffer = await photoFile.arrayBuffer();
      photoBase64 = `data:${photoFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    let ssBase64 = "";
    const ssFile = formData.get("paymentScreenshot") as File | null;
    if (ssFile && ssFile.size > 0) {
      const buffer = await ssFile.arrayBuffer();
      ssBase64 = `data:${ssFile.type};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    const application = await AtcApplication.create({
      processFee: String(formData.get("processFee") ?? ""),
      trainingPartnerName: String(formData.get("trainingPartnerName") ?? ""),
      trainingPartnerAddress: String(formData.get("trainingPartnerAddress") ?? ""),
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
      paymentMode: String(formData.get("paymentMode") ?? ""),
      paymentScreenshot: ssBase64,
      infrastructure: String(formData.get("infrastructure") ?? "{}"),
      status: "pending",
      submittedByAdmin: false,
    });

    const refNumber = application._id.toString().slice(-6).toUpperCase();
    return NextResponse.json({ message: "Application submitted successfully. We will review and contact you soon.", refNumber });
  } catch (error) {
    console.error("[become-atc POST]", error);
    return NextResponse.json({ message: "Failed to save application. Please try again." }, { status: 500 });
  }
}
