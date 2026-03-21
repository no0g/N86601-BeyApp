import { PartMediaCard } from "@/components/ui/part-media-card";

export function ComboPartsShowcase({ blade, ratchet, bit, dark = false, compact = false, tiny = false }) {
  return (
    <div
      className={`gap-2 md:grid md:items-stretch ${compact || tiny ? "md:grid-cols-[1.1fr,0.82fr]" : "md:grid-cols-[1.4fr,0.8fr]"}`}
    >
      <PartMediaCard part={blade} dark={dark} mini={compact} tiny={tiny} className="md:h-full" />
      <div className="grid gap-3 self-stretch md:h-full md:min-h-0 md:grid-rows-2">
        <PartMediaCard
          part={ratchet}
          compact
          mini={compact}
          tiny={tiny}
          dark={dark}
          stretchTextOnly
          className="md:min-h-0"
        />
        <PartMediaCard
          part={bit}
          compact
          mini={compact}
          tiny={tiny}
          dark={dark}
          stretchTextOnly
          className="md:min-h-0"
        />
      </div>
    </div>
  );
}
