"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComboPartsShowcase } from "@/components/ui/combo-parts-showcase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { beybladeData, computeComboStats, comboLabel, getPartById } from "@/lib/beyblade-data";

const STAT_CAPS = {
  attack: 160,
  defense: 160,
  stamina: 160,
  xtreme: 50,
  burst: 80
};

function StatBar({ label, value, tone, max }) {
  const widths = {
    red: "bg-rose-500",
    amber: "bg-amber-500",
    blue: "bg-sky-500",
    cyan: "bg-cyan-500",
    green: "bg-emerald-500"
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {value}
          <span className="ml-1 text-xs text-slate-400">/ {max}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${widths[tone]}`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function WeightPanel({ stats }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Weight</div>
          <div className="mt-2 text-2xl font-semibold text-white">{stats.weight.toFixed(1)}g</div>
        </div>
        <div className="text-right text-xs text-slate-300">
          <div>Blade {stats.weightDetails.blade?.toFixed(1) ?? "?"}g</div>
          <div>Ratchet {stats.weightDetails.ratchet?.toFixed(1) ?? "?"}g</div>
          <div>Bit {stats.weightDetails.bit?.toFixed(1) ?? "?"}g</div>
        </div>
      </div>
      {stats.weightWarning ? (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Warning: {stats.weightWarning}
        </div>
      ) : null}
    </div>
  );
}

export function ComboBuilderForm({ action }) {
  const [name, setName] = useState("");
  const [bladeId, setBladeId] = useState(beybladeData.blades[0].id);
  const [ratchetId, setRatchetId] = useState(beybladeData.ratchets[0].id);
  const [bitId, setBitId] = useState(beybladeData.bits[0].id);

  const stats = useMemo(
    () => computeComboStats(bladeId, ratchetId, bitId),
    [bladeId, ratchetId, bitId]
  );

  const parts = [getPartById(bladeId), getPartById(ratchetId), getPartById(bitId)];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Combo Builder</CardTitle>
          <CardDescription>
            Beyblade X part values are seeded from a curated BeyBrew-based dataset and can be extended in code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Combo name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Phoenix Wing Rush"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bladeId">Blade</Label>
              <Select id="bladeId" name="bladeId" value={bladeId} onChange={(event) => setBladeId(event.target.value)}>
                {beybladeData.blades.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratchetId">Ratchet</Label>
              <Select id="ratchetId" name="ratchetId" value={ratchetId} onChange={(event) => setRatchetId(event.target.value)}>
                {beybladeData.ratchets.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bitId">Bit</Label>
              <Select id="bitId" name="bitId" value={bitId} onChange={(event) => setBitId(event.target.value)}>
                {beybladeData.bits.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.name}
                  </option>
                ))}
              </Select>
            </div>

            <SubmitButton pendingLabel="Saving combo...">Save combo</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-950 text-white">
        <CardHeader>
          <CardTitle className="text-white">Preview</CardTitle>
          <CardDescription className="text-slate-300">
            {comboLabel({ bladeId, ratchetId, bitId })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Parts</div>
            <div className="mt-3">
              <ComboPartsShowcase blade={parts[0]} ratchet={parts[1]} bit={parts[2]} dark />
            </div>
          </div>
          <WeightPanel stats={stats} />
          <StatBar label="Attack" value={stats.attack} max={STAT_CAPS.attack} tone="red" />
          <StatBar label="Defense" value={stats.defense} max={STAT_CAPS.defense} tone="blue" />
          <StatBar label="Stamina" value={stats.stamina} max={STAT_CAPS.stamina} tone="green" />
          <StatBar label="Xtreme Dash" value={stats.xtreme} max={STAT_CAPS.xtreme} tone="amber" />
          <StatBar label="Burst Resistance" value={stats.burst} max={STAT_CAPS.burst} tone="cyan" />
        </CardContent>
      </Card>
    </div>
  );
}
