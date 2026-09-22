import { connectDB } from "./src/lib/mongodb";
import { AtcStudent } from "./src/models/Student";
import { Course } from "./src/models/Course";
import { AtcUser } from "./src/models/AtcUser";

async function run() {
  await connectDB();
  const students = await AtcStudent.find({ status: "pending" }).lean();
  console.log(`Found ${students.length} pending students.`);
  
  for (const student of students) {
    console.log(`Student: ${student.name}, Course: ${student.course}`);
    const normalizedCourse = String(student.course || "").trim().replace(/\s+/g, " ");
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    const courseQuery: any[] = [
      { name: normalizedCourse },
      { shortName: normalizedCourse },
      { name: { $regex: `^${escapeRegex(normalizedCourse)}$`, $options: "i" } },
      { shortName: { $regex: `^${escapeRegex(normalizedCourse)}$`, $options: "i" } },
    ];
    if (student.courseId) courseQuery.push({ _id: student.courseId });
    
    const course = await Course.findOne({ $or: courseQuery }).lean();
    if (!course) {
      console.log(`❌ ERROR: Course not found for this student.`);
    } else {
      console.log(`✅ Course found. Registration fee: ${course.registrationFee}`);
      
      const atc = await AtcUser.findById(student.atcId).lean();
      if (!atc) {
        console.log(`❌ ERROR: ATC not found.`);
      } else {
        console.log(`ATC Wallet Balance: ${atc.walletBalance}`);
        if (Number(atc.walletBalance || 0) < Number(course.registrationFee || 0)) {
          console.log(`❌ ERROR: Insufficient Balance. Needed: ${course.registrationFee}, Have: ${atc.walletBalance}`);
        } else {
          console.log(`✅ ATC has enough balance.`);
        }
      }
    }
    console.log("---");
  }
  process.exit(0);
}

run().catch(console.error);
