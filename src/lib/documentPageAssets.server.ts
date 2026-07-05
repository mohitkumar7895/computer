import "server-only";

import { Settings } from "@/models/Settings";

const BG_KEYS = {
  marksheet: "bg_marksheet",
  certificate: "bg_certificate",
} as const;

export type DocumentKind = keyof typeof BG_KEYS;

/** Background + auth signature in one DB round-trip (used by document API routes). */
export async function getDocumentPageAssets(kind: DocumentKind): Promise<{
  backgroundUrl: string;
  signatureUrl: string;
}> {
  const keys = [BG_KEYS[kind], "auth_signature", "authorized_signature"];
  const docs = await Settings.find({ key: { $in: keys } }).select("key value").lean();
  const map = new Map(docs.map((d) => [d.key, d.value]));

  const rawBg = map.get(BG_KEYS[kind]);
  const backgroundUrl =
    typeof rawBg === "string" && rawBg.trim() !== "" && rawBg.trim() !== "-"
      ? rawBg.trim()
      : "";

  const sigPrimary = map.get("auth_signature");
  const sigFallback = map.get("authorized_signature");
  const signatureUrl =
    (typeof sigPrimary === "string" && sigPrimary.trim() ? sigPrimary.trim() : "") ||
    (typeof sigFallback === "string" && sigFallback.trim() ? sigFallback.trim() : "");

  return { backgroundUrl, signatureUrl };
}
