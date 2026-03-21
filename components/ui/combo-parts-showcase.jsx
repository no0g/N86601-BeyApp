import { PartMediaCard } from "@/components/ui/part-media-card";

export function ComboPartsShowcase({ blade, ratchet, bit, dark = false, compact = false }) {
  return (
    <div className={`grid gap-3 ${compact ? "md:grid-cols-[1.15fr,0.8fr]" : "md:grid-cols-[1.4fr,0.8fr]"}`}>
      <PartMediaCard part={blade} dark={dark} mini={compact} />
      <div className="grid gap-3">
        <PartMediaCard part={ratchet} compact mini={compact} dark={dark} />
        <PartMediaCard part={bit} compact mini={compact} dark={dark} />
      </div>
    </div>
  );
}
