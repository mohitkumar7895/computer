"use client";

import type { CSSProperties, ReactNode } from "react";

/** Exact portrait A4 — locked so background + overlay share one coordinate system. */
export const MARKSHEET_A4_STYLE: CSSProperties = {
  width: "210mm",
  height: "297mm",
  minWidth: "210mm",
  minHeight: "297mm",
  maxWidth: "210mm",
  maxHeight: "297mm",
};

type Props = {
  children: ReactNode;
  id?: string;
  className?: string;
};

export default function MarksheetA4Frame({
  children,
  id = "cert-a4",
  className = "",
}: Props) {
  return (
    <div
      id={id}
      className={`relative isolate mx-auto box-border overflow-hidden bg-white shadow-2xl print:m-0 print:shadow-none ${className}`}
      style={MARKSHEET_A4_STYLE}
    >
      {children}
    </div>
  );
}

export const MARKSHEET_A4_PRINT_CSS = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      background: white !important;
      margin: 0 !important;
    }
    #cert-a4 {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
    }
  }
`;
