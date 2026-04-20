import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Settings } from "@/models/Settings";

const BG_KEYS = ["id_front", "id_back", "certificate", "marksheet"];

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.find({ key: { $in: BG_KEYS.map(k => `bg_${k}`) } });
    const data: any = { id_front: "", id_back: "", certificate: "", marksheet: "" };
    settings.forEach(s => {
      data[s.key.replace("bg_", "")] = s.value;
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching backgrounds" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();
    if (!BG_KEYS.includes(key)) {
      return NextResponse.json({ message: "Invalid key" }, { status: 400 });
    }

    await connectDB();
    await Settings.findOneAndUpdate(
      { key: `bg_${key}` },
      { value },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "Background saved successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Error saving background" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key || !BG_KEYS.includes(key)) {
      return NextResponse.json({ message: "Invalid key" }, { status: 400 });
    }

    await connectDB();
    await Settings.deleteOne({ key: `bg_${key}` });

    return NextResponse.json({ message: "Background removed" });
  } catch (error) {
    return NextResponse.json({ message: "Error removing background" }, { status: 500 });
  }
}
