import { connectDB } from "./src/lib/mongodb";
import { AtcStudent } from "./src/models/Student";

async function main() {
  await connectDB();
  const count = await AtcStudent.countDocuments({ tpCode: "A.T.C-2026-0108" });
  console.log("Total students for A.T.C-2026-0108:", count);
  process.exit(0);
}
main();
