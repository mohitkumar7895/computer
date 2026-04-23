import { Settings } from "@/models/Settings";
import { connectDB } from "@/lib/mongodb";

type IdFormat = {
  prefix: string;
  counter: number;
  padding: number;
};

export async function generateNextId(key: "reg_format_center" | "reg_format_student", model: any, field: string): Promise<string> {
  await connectDB();

  // 1. Fetch current format
  let formatSetting = await Settings.findOne({ key });
  let format: IdFormat = formatSetting 
    ? JSON.parse(formatSetting.value) 
    : (key === "reg_format_center" 
        ? { prefix: "ATC-", counter: 1, padding: 4 } 
        : { prefix: "ATC-ST-", counter: 1, padding: 4 });

  // 2. Generate ID exactly as per the current counter
  let prefix = format.prefix;
  if (prefix.includes("{YEAR}")) {
    const year = new Date().getFullYear().toString();
    prefix = prefix.replace("{YEAR}", year);
  }

  const id = `${prefix}${String(format.counter).padStart(format.padding, "0")}`;

  // 3. Increment counter and save for the NEXT request
  // We trust the counter in the DB. If it's a duplicate, the DB will throw a unique constraint error.
  format.counter += 1;
  await Settings.findOneAndUpdate(
    { key },
    { value: JSON.stringify(format) },
    { upsert: true }
  );

  return id;
}
