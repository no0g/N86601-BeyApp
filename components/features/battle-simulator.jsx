"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { simulateBattle } from "@/lib/simulator";
import { formatPercent } from "@/lib/utils";

const ROUND_OPTIONS = [100, 300, 500, 1000, 2000];

function formatPoints(value) {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

function formatComboOption(combo) {
  return `${combo.name} - ${combo.owner.displayName}`;
}

export function BattleSimulator({ combos }) {
  const [comboAId, setComboAId] = useState(combos[0]?.id || "");
  const [comboBId, setComboBId] = useState(combos[1]?.id || combos[0]?.id || "");
  const [rounds, setRounds] = useState(500);
  const [runIndex, setRunIndex] = useState(0);

  const comboA = useMemo(() => combos.find((combo) => combo.id === comboAId) || combos[0], [combos, comboAId]);
  const comboB = useMemo(
    () => combos.find((combo) => combo.id === comboBId) || combos[1] || combos[0],
    [combos, comboBId]
  );

  const result = useMemo(() => {
    if (!comboA || !comboB || comboA.id === comboB.id) {
      return null;
    }

    return simulateBattle(comboA, comboB, rounds + runIndex * 0);
  }, [comboA, comboB, rounds, runIndex]);

  if (combos.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Battle Simulator</CardTitle>
          <CardDescription>Save at least two active combos to run simulation.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Battle Simulator</CardTitle>
          <CardDescription>
            Heuristic matchup simulation using combo stats, weight, and finish scoring. Use this for prep and decision support.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="comboA">Combo A</Label>
            <Select
              id="comboA"
              value={comboAId}
              onChange={(event) => setComboAId(event.target.value)}
            >
              {combos.map((combo) => (
                <option key={combo.id} value={combo.id}>
                  {formatComboOption(combo)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="comboB">Combo B</Label>
            <Select
              id="comboB"
              value={comboBId}
              onChange={(event) => setComboBId(event.target.value)}
            >
              {combos.map((combo) => (
                <option key={combo.id} value={combo.id}>
                  {formatComboOption(combo)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rounds">Simulation rounds</Label>
            <Select
              id="rounds"
              value={String(rounds)}
              onChange={(event) => setRounds(Number(event.target.value))}
            >
              {ROUND_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-3 md:flex md:items-end">
            <button
              type="button"
              onClick={() => setRunIndex((value) => value + 1)}
              disabled={!result}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white disabled:opacity-50"
            >
              Re-run simulation
            </button>
          </div>
        </CardContent>
      </Card>

      {!result ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          Select two different combos to run simulation.
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Combo A win rate</CardDescription>
                <CardTitle className="text-3xl">{formatPercent(result.winRateA)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{comboA.name}</div>
                <div>{result.winsA} wins</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Combo B win rate</CardDescription>
                <CardTitle className="text-3xl">{formatPercent(result.winRateB)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{comboB.name}</div>
                <div>{result.winsB} wins</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Expected points (A perspective)</CardDescription>
                <CardTitle className="text-3xl">{formatPoints(result.pointsDelta)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>{result.rounds} rounds</div>
                <div>{result.draws} draws</div>
                <div>{result.averagePointsDelta.toFixed(2)} pts / match</div>
                <div>{Math.round(result.confidence * 100)}% confidence</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Finish Type Projection</CardTitle>
              <CardDescription>
                Distribution of projected finish types across all simulated rounds.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.finishTypesOrder.map((finishType) => {
                const count = result.finishTypes[finishType];
                return (
                  <div key={finishType} className="rounded-2xl bg-muted px-4 py-3">
                    <div className="text-sm text-muted-foreground">{finishType}</div>
                    <div className="mt-1 text-2xl font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground">{formatPercent(count / result.rounds)}</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matchup Notes</CardTitle>
              <CardDescription>
                Fast interpretation to guide testing priorities before real training or tournament logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {result.insights.length ? (
                result.insights.map((insight) => (
                  <div key={insight} className="rounded-2xl border border-border px-4 py-3">
                    {insight}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8">
                  This pairing is very even on the current stat model. Run more training logs to calibrate.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

