import mongoose from "mongoose";
import { connectDB } from "./src/lib/mongodb";
import { AtcStudent } from "./src/models/Student";
import { Course } from "./src/models/Course";

async function run() {
  try {
    await connectDB();
    console.log("Connected to DB");
    const pendingStudents = await AtcStudent.find({ status: { $ne: "active" } });
    console.log(`Pending students: ${pendingStudents.length}`);
    for (const s of pendingStudents) {
      console.log(`\nStudent: ${s._id} | Name: ${s.name} | Course: ${s.course} | CourseId: ${s.courseId}`);
      const normalizedCourse = String(s.course || "").trim();
      const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const courseQuery: any[] = [
        { name: normalizedCourse },
        { shortName: normalizedCourse },
        { name: { $regex: `^${escapeRegex(normalizedCourse)}$`, $options: "i" } },
        { shortName: { $regex: `^${escapeRegex(normalizedCourse)}$`, $options: "i" } },
      ];
      if (s.courseId) courseQuery.push({ _id: s.courseId });
      const course = await Course.findOne({ $or: courseQuery }).lean() as any;
      if (course) {
        console.log(`Found course: ${course.name} (${course.shortName})`);
      } else {
        console.log(`COURSE NOT FOUND!`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
