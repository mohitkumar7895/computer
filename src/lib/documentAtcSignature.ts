import { AtcUser } from "@/models/AtcUser";
import { AtcApplication } from "@/models/AtcApplication";

type AtcApplicationWithSignature = {
  signature?: string | null;
};

export async function resolveAtcSignature(
  atcId: string | null | undefined,
): Promise<string> {
  if (!atcId) return "";

  const atcUser = (await AtcUser.findById(atcId)
    .populate<{ applicationId?: AtcApplicationWithSignature | null }>({
      path: "applicationId",
      model: AtcApplication,
      select: "signature",
    })
    .select("applicationId")
    .lean()) as { applicationId?: AtcApplicationWithSignature | null } | null;

  return atcUser?.applicationId?.signature?.trim() || "";
}
