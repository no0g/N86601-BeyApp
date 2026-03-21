import { PartMediaCard } from "@/components/ui/part-media-card";

export function ComboPartsShowcase({ blade, ratchet, bit, dark = false, compact = false, tiny = false }) {
  return (
    <div className={`grid gap-2 ${compact || tiny ? "md:grid-cols-[1.1fr,0.82fr]" : "md:grid-cols-[1.4fr,0.8fr]"}`}>
      <PartMediaCard part={blade} dark={dark} mini={compact} tiny={tiny} />
      <div className="grid gap-3">
        <PartMediaCard part={ratchet} compact mini={compact} tiny={tiny} dark={dark} />
        <PartMediaCard part={bit} compact mini={compact} tiny={tiny} dark={dark} />
      </div>
    </div>
  );
}
