"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/utils/api";
import { preloadImageUrl } from "@/lib/preloadImageUrl";

const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 600;

export type DocumentPagePayload = {
  data: unknown;
  backgroundUrl?: string;
  signatureUrl?: string;
  atcSignature?: string;
  learningCenterLine?: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";

type Options = {
  apiPath: string;
  examId: string;
  /** When false, redirect away on hard failure (view mode). */
  stayOnFailure?: boolean;
  onHardFailure?: () => void;
};

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchDocumentPayload(apiPath: string, examId: string): Promise<DocumentPagePayload> {
  const res = await apiFetch(`${apiPath}?examId=${encodeURIComponent(examId)}`, {
    cache: "no-store",
  });
  const json = (await res.json()) as DocumentPagePayload & { message?: string };
  if (!res.ok || !json?.data) {
    throw new Error(json?.message || `Failed to load document (${res.status})`);
  }
  return json;
}

/**
 * Loads certificate/marksheet API data with retries and Bearer + cookie auth.
 */
export function useDocumentPageData({
  apiPath,
  examId,
  stayOnFailure = false,
  onHardFailure,
}: Options) {
  const [payload, setPayload] = useState<DocumentPagePayload | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const attemptRef = useRef(0);

  const load = useCallback(async () => {
    if (!examId) return;
    setLoadState("loading");
    setErrorMessage("");
    attemptRef.current = 0;

    let lastError = "Could not load document.";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      attemptRef.current = attempt;
      try {
        const json = await fetchDocumentPayload(apiPath, examId);
        if (json.backgroundUrl?.trim()) preloadImageUrl(json.backgroundUrl);
        setPayload(json);
        setLoadState("ready");
        return;
      } catch (err) {
        lastError = err instanceof Error ? err.message : lastError;
        if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
      }
    }

    setLoadState("error");
    setErrorMessage(lastError);
    if (!stayOnFailure) onHardFailure?.();
  }, [apiPath, examId, stayOnFailure, onHardFailure]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    payload,
    loadState,
    errorMessage,
    retry: load,
    attempt: attemptRef.current,
  };
}
