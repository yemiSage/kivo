"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/sign/media/`;

/** Resize only our signed uploads; arbitrary preview hosts keep their direct URL. */
export function MediaThumbnail({ src, className, style, eager = false, sizes = "(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 256px" }: {
  src: string;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
  sizes?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (src.startsWith(storagePrefix) && failedSource !== src) {
    return (
      <Image
        src={src}
        alt=""
        width={640}
        height={480}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        className={className}
        style={style}
        onError={() => setFailedSource(src)}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary hosts and optimizer fallback
    <img src={src} alt="" width={640} height={480} loading={eager ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" className={className} style={style} />
  );
}
