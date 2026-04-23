import { connectDB } from "./mongodb";
import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

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
  return getSetting("brand_name", "Yukti Computer Education");
}
