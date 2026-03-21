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

export function PartMediaCard({ part, compact = false, mini = false, tiny = false, dark = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = part?.image ? `${BEYBREW_IMAGE_BASE_URL}/${part.image}` : null;
  const name = part?.altname || part?.name || "Unknown part";

  return (
    <div
      className={`h-fit rounded-2xl border ${tiny ? "p-1.5" : mini ? "p-2" : "p-2.5"} ${
        dark ? "border-white/10 bg-white/5 text-white" : "border-border bg-muted/30 text-foreground"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl ${
          tiny ? "aspect-[6/4]" : compact ? "aspect-[5/3]" : mini ? "aspect-[5/4]" : "aspect-[10/9]"
        } bg-transparent`}
      >
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt={name}
            className={`h-full w-full object-contain ${tiny ? "p-1" : mini ? "p-1.5" : "p-1.5"}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center text-lg font-semibold ${
              dark ? "text-slate-200" : "text-muted-foreground"
            }`}
          >
            {initialsForPart(part)}
          </div>
        )}
      </div>
      <div className={tiny ? "mt-1" : mini ? "mt-1.5" : "mt-2"}>
        <div className={`${tiny ? "text-xs" : mini ? "text-sm" : "text-sm"} leading-tight font-semibold ${dark ? "text-white" : "text-foreground"}`}>
          {name}
        </div>
        <div className={`${tiny ? "text-[10px]" : "text-xs"} leading-tight ${dark ? "text-slate-300" : "text-muted-foreground"}`}>
          {part?.source || "Part"}{part?.image && imageFailed ? " • image missing" : ""}
        </div>
      </div>
    </div>
  );
}
