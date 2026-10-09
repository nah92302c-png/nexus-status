"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface ServiceIconProps {
  name: string;
  iconUrl: string | null;
  className?: string;
}

/**
 * Short non-colour monogram used when a service has no image (or its image
 * fails to load). Keeps the card readable without relying on artwork.
 */
export function monogramFor(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return cleaned.slice(0, 3) || "?";
}

/**
 * Service artwork on the public dashboard. Purely decorative: the service name
 * is always rendered as real text next to it, so the image carries an empty
 * alt and is hidden from assistive tech. If the image is missing or fails to
 * load, the monogram fallback is shown instead.
 */
export function ServiceIcon({ name, iconUrl, className }: ServiceIconProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(iconUrl) && !failed;

  return (
    <div className={cn("game-icon", className)} aria-hidden="true">
      <span className="monogram">{monogramFor(name)}</span>
      {showImage ? (
        // Artwork URLs are admin-supplied and may point at any host, so a plain
        // <img> is used rather than next/image (which would reject unknown hosts).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl ?? undefined}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
