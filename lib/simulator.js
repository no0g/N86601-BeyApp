const FINISH_POINTS = {
  XTREME: 3,
  BURST: 2,
  OVER: 2,
  SPIN: 1
};

const FINISH_TYPES = ["XTREME", "BURST", "OVER", "SPIN"];

function weightedPick(weightMap, randomValue = Math.random()) {
  const entries = Object.entries(weightMap);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const threshold = randomValue * total;
  let cursor = 0;

  for (const [key, value] of entries) {
    cursor += value;
    if (threshold <= cursor) {
      return key;
    }
  }

  return entries[entries.length - 1]?.[0] || "SPIN";
}

function safeDivide(a, b) {
  if (!b) {
    return 0;
  }
  return a / b;
}

function chanceNoise(scale = 1) {
  return (Math.random() - 0.5) * scale;
}

function softStat(value) {
  return Math.sqrt(Math.max(0, value || 0)) * 10;
}

function probabilityFromDelta(delta, steepness = 11) {
  return 1 / (1 + Math.exp(-delta / steepness));
}

function buildCombatProfile(combo) {
  const attack = softStat(combo.attack);
  const defense = softStat(combo.defense);
  const stamina = softStat(combo.stamina);
  const xtreme = softStat(combo.xtreme);
  const burst = softStat(combo.burst);
  const weight = softStat((combo.weight || 0) * 3);

  const offense = attack * 0.58 + xtreme * 0.42;
  const endurance = stamina * 0.56 + defense * 0.2 + burst * 0.24;
  const stability = defense * 0.45 + burst * 0.34 + weight * 0.21;
  const pressure = attack * 0.46 + weight * 0.34 + xtreme * 0.2;

  return { offense, endurance, stability, pressure };
}

function spinBonus(spinA, spinB) {
  if (!spinA || !spinB) {
    return 0;
  }
  return spinA !== spinB ? 2.5 : 0;
}

function resolveFinishType(winnerProfile, loserProfile) {
  const aggressionEdge = winnerProfile.offense - loserProfile.stability;
  const staminaEdge = winnerProfile.endurance - loserProfile.endurance;

  if (aggressionEdge > 28) {
    return weightedPick({ XTREME: 0.48, BURST: 0.26, OVER: 0.16, SPIN: 0.1 });
  }

  if (aggressionEdge > 14) {
    return weightedPick({ XTREME: 0.38, BURST: 0.22, OVER: 0.2, SPIN: 0.2 });
  }

  if (staminaEdge > 16) {
    return weightedPick({ XTREME: 0.14, BURST: 0.16, OVER: 0.28, SPIN: 0.42 });
  }

  return weightedPick({ XTREME: 0.22, BURST: 0.2, OVER: 0.24, SPIN: 0.34 });
}

function resolveSingleRound(comboA, comboB) {
  const profileA = buildCombatProfile(comboA);
  const profileB = buildCombatProfile(comboB);

  const controlA = profileA.stability - profileB.pressure * 0.24 + chanceNoise(18);
  const controlB = profileB.stability - profileA.pressure * 0.24 + chanceNoise(18);
  const tempoA = profileA.offense * 0.36 + profileA.endurance * 0.24 + chanceNoise(16);
  const tempoB = profileB.offense * 0.36 + profileB.endurance * 0.24 + chanceNoise(16);

  const scoreA =
    profileA.offense * 0.32 +
    profileA.endurance * 0.28 +
    controlA * 0.22 +
    tempoA * 0.18 +
    spinBonus(comboA.spinType, comboB.spinType);
  const scoreB =
    profileB.offense * 0.32 +
    profileB.endurance * 0.28 +
    controlB * 0.22 +
    tempoB * 0.18 +
    spinBonus(comboB.spinType, comboA.spinType);

  const delta = scoreA - scoreB + chanceNoise(6);
  const drawChance = Math.max(0.04, Math.min(0.28, 0.2 - Math.abs(delta) / 40));
  if (Math.random() < drawChance) {
    return {
      winner: "DRAW",
      finishType: weightedPick({ SPIN: 0.74, OVER: 0.18, BURST: 0.08 }),
      pointsDelta: 0
    };
  }

  const probabilityA = probabilityFromDelta(delta, 12);
  const winner = Math.random() < probabilityA ? "A" : "B";
  const finishType =
    winner === "A" ? resolveFinishType(profileA, profileB) : resolveFinishType(profileB, profileA);
  const points = FINISH_POINTS[finishType] || 0;

  return {
    winner,
    finishType,
    pointsDelta: winner === "A" ? points : -points
  };
}

function buildInsights(comboA, comboB, summary) {
  const insights = [];
  const offenseGap = comboA.attack + comboA.xtreme - (comboB.attack + comboB.xtreme);
  const staminaGap = comboA.stamina - comboB.stamina;
  const weightGap = comboA.weight - comboB.weight;

  if (offenseGap > 18) {
    insights.push(`${comboA.name} has a strong attack tempo edge and tends to force faster finishes.`);
  } else if (offenseGap < -18) {
    insights.push(`${comboB.name} pressures harder on contact and can overwhelm on aggressive exchanges.`);
  }

  if (staminaGap > 14) {
    insights.push(`${comboA.name} has better late-round endurance and should convert more spin finishes.`);
  } else if (staminaGap < -14) {
    insights.push(`${comboB.name} has better late-round endurance and can outlast in neutral rounds.`);
  }

  if (weightGap > 2.5) {
    insights.push(`${comboA.name} is meaningfully heavier and usually keeps better ring stability.`);
  } else if (weightGap < -2.5) {
    insights.push(`${comboB.name} is meaningfully heavier and can absorb recoil more consistently.`);
  }

  if (summary.draws > summary.rounds * 0.18) {
    insights.push("This matchup is volatile and close, with a high draw rate from balanced exchanges.");
  }

  return insights.slice(0, 3);
}

export function simulateBattle(comboA, comboB, rounds = 500) {
  const roundCount = Math.max(10, Math.min(5000, Number(rounds) || 500));
  const finishTypes = {
    XTREME: 0,
    BURST: 0,
    OVER: 0,
    SPIN: 0
  };

  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let pointsDelta = 0;

  for (let index = 0; index < roundCount; index += 1) {
    const round = resolveSingleRound(comboA, comboB);
    pointsDelta += round.pointsDelta;
    finishTypes[round.finishType] += 1;

    if (round.winner === "A") {
      winsA += 1;
      continue;
    }
    if (round.winner === "B") {
      winsB += 1;
      continue;
    }
    draws += 1;
  }

  const decisiveMatches = winsA + winsB;
  const winRateA = safeDivide(winsA, decisiveMatches);
  const winRateB = safeDivide(winsB, decisiveMatches);
  const averagePointsDelta = safeDivide(pointsDelta, roundCount);
  const confidence =
    Math.min(0.98, 0.55 + Math.min(0.35, Math.log10(roundCount) / 5) + Math.min(0.08, Math.abs(winRateA - 0.5)));

  const summary = {
    rounds: roundCount,
    winsA,
    winsB,
    draws,
    decisiveMatches,
    winRateA,
    winRateB,
    pointsDelta,
    averagePointsDelta,
    finishTypes,
    confidence
  };

  return {
    ...summary,
    insights: buildInsights(comboA, comboB, summary),
    finishPointMap: FINISH_POINTS,
    finishTypesOrder: FINISH_TYPES
  };
}
