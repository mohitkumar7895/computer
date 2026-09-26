import { connectDB } from "./src/lib/mongodb";
import { StudentExam } from "./src/models/StudentExam";

async function main() {
  await connectDB();
  const exams = await StudentExam.find({ studentId: "6a562d06d7a882a0986913e3" });
  console.log(JSON.stringify(exams, null, 2));
  process.exit(0);
}
main();
