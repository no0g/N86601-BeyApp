"use client";

import { useMemo, useState } from "react";
import { deleteComboAction, updateComboAction } from "@/app/actions/combos";
import { ComboPartsShowcase } from "@/components/ui/combo-parts-showcase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { beybladeData, comboLabel, computeComboStats, getPartById } from "@/lib/beyblade-data";

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
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">
          {value}
          <span className="ml-1 text-xs text-slate-400">/ {max}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={`h-2 rounded-full ${widths[tone]}`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function EditableComboCard({ combo }) {
  const [name, setName] = useState(combo.name);
  const [bladeId, setBladeId] = useState(combo.bladeId);
  const [ratchetId, setRatchetId] = useState(combo.ratchetId);
  const [bitId, setBitId] = useState(combo.bitId);

  const stats = useMemo(
    () => computeComboStats(bladeId, ratchetId, bitId),
    [bladeId, ratchetId, bitId]
  );

  const parts = [getPartById(bladeId), getPartById(ratchetId), getPartById(bitId)];

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{combo.name}</div>
          <div className="text-sm text-muted-foreground">{comboLabel(combo)}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
        <div className="rounded-xl bg-rose-50 p-2 dark:bg-rose-500/15">
          <div className="text-muted-foreground dark:text-rose-100/80">ATK</div>
          <div className="text-sm font-semibold text-foreground dark:text-white">{combo.attack}</div>
        </div>
        <div className="rounded-xl bg-sky-50 p-2 dark:bg-sky-500/15">
          <div className="text-muted-foreground dark:text-sky-100/80">DEF</div>
          <div className="text-sm font-semibold text-foreground dark:text-white">{combo.defense}</div>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-500/15">
          <div className="text-muted-foreground dark:text-emerald-100/80">STA</div>
          <div className="text-sm font-semibold text-foreground dark:text-white">{combo.stamina}</div>
        </div>
        <div className="rounded-xl bg-amber-50 p-2 dark:bg-amber-500/15">
          <div className="text-muted-foreground dark:text-amber-100/80">XTR</div>
          <div className="text-sm font-semibold text-foreground dark:text-white">{combo.xtreme}</div>
        </div>
        <div className="rounded-xl bg-cyan-50 p-2 dark:bg-cyan-500/15">
          <div className="text-muted-foreground dark:text-cyan-100/80">BUR</div>
          <div className="text-sm font-semibold text-foreground dark:text-white">{combo.burst}</div>
        </div>
      </div>

      <div className="mt-4">
        <ComboPartsShowcase blade={parts[0]} ratchet={parts[1]} bit={parts[2]} tiny />
      </div>

      <details className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
        <summary className="cursor-pointer text-sm font-medium">Edit or delete</summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr,0.95fr]">
          <form action={updateComboAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="comboId" value={combo.id} />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`name-${combo.id}`}>Combo name</Label>
              <Input
                id={`name-${combo.id}`}
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`blade-${combo.id}`}>Blade</Label>
              <Select
                id={`blade-${combo.id}`}
                name="bladeId"
                value={bladeId}
                onChange={(event) => setBladeId(event.target.value)}
                required
              >
                {beybladeData.blades.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.altname || part.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`ratchet-${combo.id}`}>Ratchet</Label>
              <Select
                id={`ratchet-${combo.id}`}
                name="ratchetId"
                value={ratchetId}
                onChange={(event) => setRatchetId(event.target.value)}
                required
              >
                {beybladeData.ratchets.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.altname || part.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`bit-${combo.id}`}>Bit</Label>
              <Select
                id={`bit-${combo.id}`}
                name="bitId"
                value={bitId}
                onChange={(event) => setBitId(event.target.value)}
                required
              >
                {beybladeData.bits.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.altname || part.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <SubmitButton pendingLabel="Updating combo...">Save changes</SubmitButton>
              <button
                type="submit"
                formAction={deleteComboAction}
                name="comboId"
                value={combo.id}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
              >
                Delete combo
              </button>
            </div>
          </form>

          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="text-lg font-semibold">Live Preview</div>
            <div className="mt-1 text-sm text-slate-300">
              {comboLabel({ bladeId, ratchetId, bitId })}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Parts</div>
              <div className="mt-3">
                <ComboPartsShowcase blade={parts[0]} ratchet={parts[1]} bit={parts[2]} dark />
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <StatBar label="Attack" value={stats.attack} max={STAT_CAPS.attack} tone="red" />
              <StatBar label="Defense" value={stats.defense} max={STAT_CAPS.defense} tone="blue" />
              <StatBar label="Stamina" value={stats.stamina} max={STAT_CAPS.stamina} tone="green" />
              <StatBar label="Xtreme Dash" value={stats.xtreme} max={STAT_CAPS.xtreme} tone="amber" />
              <StatBar label="Burst Resistance" value={stats.burst} max={STAT_CAPS.burst} tone="cyan" />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
