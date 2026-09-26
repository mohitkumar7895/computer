import { connectDB } from "./src/lib/mongodb";
import { AtcUser } from "./src/models/AtcUser";

async function main() {
  await connectDB();
  const atc = await AtcUser.findOne({ tpCode: "A.T.C-2026-0108" });
  console.log(JSON.stringify(atc, null, 2));
  process.exit(0);
}
main();
