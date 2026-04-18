import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const requiredFields = [
    "fullName",
    "fatherName",
    "motherName",
    "mobile",
    "email",
    "address",
    "course",
    "city",
    "state",
    "pin",
    "dob",
    "gender",
    "admissionDate",
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

  if (!/^\d{10}$/.test(mobile)) {
    return NextResponse.json({ message: "Mobile must be exactly 10 digits." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ message: "PIN must be exactly 6 digits." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  return NextResponse.json({ message: "Direct admission form submitted successfully." });
}
