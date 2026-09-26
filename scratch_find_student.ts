import { connectDB } from "./src/lib/mongodb";
import { AtcStudent } from "./src/models/Student";

async function main() {
  await connectDB();
  const students = await AtcStudent.find({ name: /prince kohar/i });
  console.log(JSON.stringify(students, null, 2));
  process.exit(0);
}
main();
