import { PartMediaCard } from "@/components/ui/part-media-card";

export function ComboPartsShowcase({ blade, ratchet, bit, dark = false }) {
  return (
    <div className="grid gap-3 md:grid-cols-[1.4fr,0.8fr]">
      <PartMediaCard part={blade} dark={dark} />
      <div className="grid gap-3">
        <PartMediaCard part={ratchet} compact dark={dark} />
        <PartMediaCard part={bit} compact dark={dark} />
      </div>
    </div>
  );
}
