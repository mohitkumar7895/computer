"use client";

import { useEffect } from "react";
import { preloadA4PdfLibs } from "@/lib/downloadA4";

/** Start PDF libs as soon as any admin document route loads. */
export default function AdminDocumentLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    preloadA4PdfLibs();
  }, []);
  return children;
}
