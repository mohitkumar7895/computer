import mongoose from "mongoose";
import { connectDB } from "./src/lib/mongodb";
import { Course } from "./src/models/Course";

async function run() {
  try {
    await connectDB();
    const courses = await Course.find({}).lean();
    console.log(`Total courses: ${courses.length}`);
    for (const c of courses) {
      console.log(`Course: ${c._id} | ${c.name} | ${c.shortName} | status: ${c.status}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
