import { connectDB } from "@/lib/mongodb";
import { AtcUser } from "@/models/AtcUser";

/** One line for document "Learning Center": center name only. */
export async function learningCenterLineForMarksheet(atcId: unknown): Promise<string> {
  if (!atcId) return "";
  await connectDB();
  const atc = await AtcUser.findById(atcId).select("trainingPartnerName").lean();
  if (!atc) return "";
  return typeof atc.trainingPartnerName === "string" ? atc.trainingPartnerName.trim() : "";
}
