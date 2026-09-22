import { connectDB } from "./src/lib/mongodb";
import { Course } from "./src/models/Course";

async function run() {
  await connectDB();
  const courses = await Course.find({}).lean();
  console.log(`Found ${courses.length} courses in DB.`);
  for (const c of courses) {
    console.log(`- "${c.name}" (Short: "${c.shortName}")`);
  }
  process.exit(0);
}

run().catch(console.error);
