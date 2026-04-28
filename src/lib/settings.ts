import { connectDB } from "./mongodb";
import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
type SettingRecord = { key: string; value: string };

export async function getSetting(key: string, defaultValue: string = ""): Promise<string> {
  try {
    await connectDB();
    const setting = await Setting.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (err) {
    console.error(`Error fetching setting ${key}:`, err);
    return defaultValue;
  }
}

export async function getBrandName(): Promise<string> {
  return getSetting("brand_name", "Institution");
}

export async function getFullBrandData() {
  try {
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
  } catch (err) {
    console.error("Error fetching full brand data:", err);
    return {};
  }
}
