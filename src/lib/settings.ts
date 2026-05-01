import { connectDB } from "./mongodb";
import mongoose from "mongoose";
import { unstable_noStore as noStore } from "next/cache";

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
type SettingRecord = { key: string; value: string };

export async function getSetting(key: string, defaultValue: string = ""): Promise<string> {
  try {
    noStore();
    await connectDB();
    const setting = await Setting.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown settings error";
    console.warn(`Settings fallback for "${key}": ${message}`);
    return defaultValue;
  }
}

export async function getBrandName(): Promise<string> {
  return getSetting("brand_name", "Institution");
}

export async function getFullBrandData() {
  try {
    noStore();
    await connectDB();
    const keys = [
      "brand_name", 
      "brand_mobile", 
      "brand_email", 
      "brand_address", 
      "brand_url", 
      "brand_logo",
      "qr_code",
      "auth_signature"
    ];
    const settings = await Setting.find({ key: { $in: keys } }).lean();
    const data: Record<string, string> = {};
    settings.forEach((s) => {
      const setting = s as SettingRecord;
      data[setting.key] = setting.value;
    });
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown settings error";
    console.warn(`Settings fallback for full brand data: ${message}`);
    return {};
  }
}
