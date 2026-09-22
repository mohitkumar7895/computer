import { connectDB } from "./src/lib/mongodb";
import { Course } from "./src/models/Course";

async function run() {
  await connectDB();
  const courses = await Course.find({});
  for (const c of courses) {
    let changed = false;
    if (c.name !== c.name.trim() || c.name.replace(/\s+/g, " ") !== c.name) {
      c.name = c.name.trim().replace(/\s+/g, " ");
      changed = true;
    }
    if (c.shortName && (c.shortName !== c.shortName.trim() || c.shortName.replace(/\s+/g, " ") !== c.shortName)) {
      c.shortName = c.shortName.trim().replace(/\s+/g, " ");
      changed = true;
    }
    if (changed) {
      await c.save();
      console.log(`Fixed spaces for course: "${c.name}" (Short: "${c.shortName}")`);
    }
  }
  console.log("Done.");
  process.exit(0);
}

run().catch(console.error);
