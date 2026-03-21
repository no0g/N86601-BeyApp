"use client";

import { useState } from "react";

const BEYBREW_IMAGE_BASE_URL = "https://beybladebrew.com/images";

function initialsForPart(part) {
  const label = part?.altname || part?.name || "?";
  return label
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0])
    .join("")
    .toUpperCase();
}

export function PartMediaCard({ part, compact = false, dark = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = part?.image ? `${BEYBREW_IMAGE_BASE_URL}/${part.image}` : null;
  const name = part?.altname || part?.name || "Unknown part";

  return (
    <div
      className={`rounded-2xl border p-3 ${
        dark ? "border-white/10 bg-white/5" : "border-border bg-muted/30"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl ${
          compact ? "aspect-[4/3]" : "aspect-square"
        } ${dark ? "bg-slate-900/60" : "bg-white"}`}
      >
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt={name}
            className="h-full w-full object-contain p-2"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center text-lg font-semibold ${
              dark ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {initialsForPart(part)}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>{name}</div>
        <div className={`text-xs ${dark ? "text-slate-400" : "text-muted-foreground"}`}>
          {part?.source || "Part"}{part?.image && imageFailed ? " • image missing" : ""}
        </div>
      </div>
    </div>
  );
}
