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
 * Service artwork on the public dashboard. Fills the entire product-art area.
 * If the image is missing or fails to load, the monogram fallback is shown instead.
 */
export function ServiceIcon({ name, iconUrl, className }: ServiceIconProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(iconUrl) && !failed;

  return (
    <div className={cn("product-art-content", className)} aria-hidden="true">
      {showImage ? (
        // Admin-supplied URLs may point at any host; a plain <img> keeps
        // them working without configuring next/image remote patterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl ?? undefined}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #14161c 0%, #0b0c10 100%)",
            fontSize: "2.5rem",
            fontWeight: 900,
            letterSpacing: "0.02em",
            color: "#fff",
            textShadow: "0 2px 10px #000",
          }}
        >
          {monogramFor(name)}
        </div>
      )}
    </div>
  );
}