"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = {
  src: string;
  /** Fires once when the bitmap is decoded (or on error / timeout fallback). */
  onPainted?: () => void;
  /**
   * Stretch the bitmap to the exact A4 frame (210×297 mm). Use on portrait marksheets
   * so no letterboxing / inline-img gap remains at the bottom edge.
   */
  fullBleed?: boolean;
};

const READY_TIMEOUT_MS = 12_000;

/**
 * Full-bleed template image behind certificate/marksheet text.
 * Preloads HTTP(S) URLs and hints the browser to fetch/decode ASAP.
 * Parents should hide the text overlay until `onPainted` has run (when a template exists).
 */
export default function DocumentTemplateBackground({ src, onPainted, fullBleed = false }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const doneRef = useRef(false);

  const fire = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onPainted?.();
  }, [onPainted]);

  useEffect(() => {
    doneRef.current = false;
  }, [src]);

  useEffect(() => {
    const t = window.setTimeout(fire, READY_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [src, fire]);

  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) fire();
  }, [src, fire]);

  useEffect(() => {
    if (!src.startsWith("http://") && !src.startsWith("https://")) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [src]);

  if (!src) return null;

  if (fullBleed) {
    return (
      <div className="absolute inset-0 z-[1] overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          onLoad={fire}
          onError={fire}
          className="document-template-bg block h-full w-full max-w-none bg-white object-fill object-center print:hidden"
          style={{ width: "100%", height: "100%", minWidth: "100%", minHeight: "100%" }}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt=""
      fetchPriority="high"
      loading="eager"
      decoding="sync"
      onLoad={fire}
      onError={fire}
      className="document-template-bg absolute inset-0 z-[1] block h-full w-full max-w-none bg-white object-fill object-center print:hidden"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
