import mongoose from "mongoose";
import { Settings } from "@/models/Settings";
import { connectDB } from "@/lib/mongodb";

type IdFormat = {
  prefix: string;
  counter: number;
  padding: number;
};

function parseStudentIdFormat(raw: string | undefined | null): IdFormat {
  try {
    if (!raw) throw new Error("empty");
    const f = JSON.parse(raw) as IdFormat;
    if (typeof f.prefix !== "string" || typeof f.counter !== "number" || typeof f.padding !== "number") {
      throw new Error("shape");
    }
    return {
      prefix: "",
      counter: Math.max(1, Math.floor(f.counter)),
      padding: 1,
    };
  } catch {
    return { prefix: "", counter: 1, padding: 1 };
  }
}

/**
 * Next **student registration / enrollment number** from Admin → Registration →
 * `reg_format_student` (prefix + counter + padding).
 *
 * Runs inside a MongoDB transaction so many exam approvals at once still get a
 * strict increasing sequence (same order as counter in settings).
 */
type RegistrationOnlyFormat = {
  prefix: string;
  counter: number;
};

function parseStudentRegistrationFormat(raw: string | undefined | null): RegistrationOnlyFormat {
  try {
    if (!raw) throw new Error("empty");
    const f = JSON.parse(raw) as { prefix?: unknown; counter?: unknown };
    const counter =
      typeof f.counter === "number" && Number.isFinite(f.counter) ? Math.max(1, Math.floor(f.counter)) : 1;
    return { prefix: "", counter };
  } catch {
    return { prefix: "", counter: 1 };
  }
}

/**
 * Next **registration number** for admit cards from Admin → Registration →
 * `reg_format_student_registration` (prefix + counter only, no padding).
 */
export async function generateNextStudentRegistrationNumber(): Promise<string> {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const doc = await Settings.findOne({ key: "reg_format_student_registration" }).session(session);
    const format = parseStudentRegistrationFormat(doc?.value as string | undefined);
    const id = String(format.counter);
    const bumped: RegistrationOnlyFormat = { prefix: format.prefix, counter: format.counter + 1 };
    await Settings.findOneAndUpdate(
      { key: "reg_format_student_registration" },
      { $set: { value: JSON.stringify(bumped) } },
      { upsert: true, session },
    );
    await session.commitTransaction();
    return id;
  } catch (e) {
    try {
      await session.abortTransaction();
    } catch {
      /* noop */
    }
    console.warn("[idGenerator] generateNextStudentRegistrationNumber tx failed; using non-transactional path:", e);
    return generateNextStudentRegistrationNumberNonTx();
  } finally {
    session.endSession();
  }
}

async function generateNextStudentRegistrationNumberNonTx(): Promise<string> {
  await connectDB();
  const formatSetting = await Settings.findOne({ key: "reg_format_student_registration" });
  const format = parseStudentRegistrationFormat(formatSetting?.value as string | undefined);
    const id = String(format.counter);
  const bumped: RegistrationOnlyFormat = { prefix: format.prefix, counter: format.counter + 1 };
  await Settings.findOneAndUpdate(
    { key: "reg_format_student_registration" },
    { value: JSON.stringify(bumped) },
    { upsert: true },
  );
  return id;
}

export async function generateNextStudentEnrollmentNumber(): Promise<string> {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const doc = await Settings.findOne({ key: "reg_format_student" }).session(session);
    const format = parseStudentIdFormat(doc?.value as string | undefined);
    const id = String(format.counter);
    const bumped: IdFormat = { ...format, counter: format.counter + 1 };
    await Settings.findOneAndUpdate(
      { key: "reg_format_student" },
      { $set: { value: JSON.stringify(bumped) } },
      { upsert: true, session },
    );
    await session.commitTransaction();
    return id;
  } catch (e) {
    try {
      await session.abortTransaction();
    } catch {
      /* noop */
    }
    console.warn("[idGenerator] generateNextStudentEnrollmentNumber tx failed; using non-transactional path:", e);
    return generateNextId("reg_format_student");
  } finally {
    session.endSession();
  }
}

/** Next id from Settings `reg_format_*` (counter + prefix); not tied to a Mongoose model. */
export async function generateNextId(key: "reg_format_center" | "reg_format_student"): Promise<string> {
  await connectDB();

  // 1. Fetch current format
  const formatSetting = await Settings.findOne({ key });
  const format: IdFormat = formatSetting
    ? JSON.parse(formatSetting.value)
    : key === "reg_format_center"
      ? { prefix: "ATC-", counter: 1, padding: 4 }
      : { prefix: "", counter: 1, padding: 1 };

  // 2. Generate ID exactly as per the current counter
  let prefix = format.prefix;
  if (prefix.includes("{YEAR}")) {
    const year = new Date().getFullYear().toString();
    prefix = prefix.replace("{YEAR}", year);
  }

  const id =
    key === "reg_format_student"
      ? String(Math.max(1, Math.floor(Number(format.counter) || 1)))
      : `${prefix}${String(format.counter).padStart(format.padding, "0")}`;

  // 3. Increment counter and save for the NEXT request
  // We trust the counter in the DB. If it's a duplicate, the DB will throw a unique constraint error.
  format.counter += 1;
  if (key === "reg_format_student") {
    format.prefix = "";
    format.padding = 1;
  }
  await Settings.findOneAndUpdate(
    { key },
    { value: JSON.stringify(format) },
    { upsert: true }
  );

  return id;
}
