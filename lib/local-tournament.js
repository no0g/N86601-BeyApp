function pairSequential(entries) {
  const matches = [];
  for (let index = 0; index < entries.length; index += 2) {
    matches.push([entries[index] || null, entries[index + 1] || null]);
  }
  return matches;
}

function toPowerOfTwo(value) {
  let result = 1;
  while (result < value) {
    result *= 2;
  }
  return result;
}

function participantDisplayName(participant) {
  return participant.user.displayName || participant.user.username;
}

export function normalizeTopCutSize(value, participantCount) {
  if (participantCount < 2) {
    return 2;
  }

  const parsed = Math.max(2, Number(value) || 2);
  const capped = Math.min(parsed, participantCount);
  let size = 2;
  while (size * 2 <= capped) {
    size *= 2;
  }
  return size;
}

function roundRobinCircle(participants) {
  const list = [...participants];
  const hasBye = list.length % 2 === 1;
  if (hasBye) {
    list.push(null);
  }

  const rounds = list.length - 1;
  const half = list.length / 2;
  const schedule = [];
  let rotation = [...list];

  for (let round = 1; round <= rounds; round += 1) {
    const pairings = [];
    for (let idx = 0; idx < half; idx += 1) {
      const a = rotation[idx];
      const b = rotation[rotation.length - 1 - idx];
      pairings.push([a, b]);
    }
    schedule.push({ round, pairings });

    const fixed = rotation[0];
    const moved = rotation.slice(1);
    moved.unshift(moved.pop());
    rotation = [fixed, ...moved];
  }

  return schedule;
}

export function buildRoundRobinMatches(participants) {
  return roundRobinCircle(participants).flatMap((round) =>
    round.pairings.map((pairing, pairIndex) => ({
      stage: "QUALIFIER",
      roundNumber: round.round,
      tableNumber: pairIndex + 1,
      playerAId: pairing[0]?.id || null,
      playerBId: pairing[1]?.id || null,
      status: pairing[0] && pairing[1] ? "PENDING" : "COMPLETED",
      result: pairing[0] && pairing[1] ? null : "A_WIN",
      winnerId: pairing[0] && pairing[1] ? null : pairing[0]?.id || pairing[1]?.id || null
    }))
  );
}

export function buildQualifierRanking(participants, qualifierMatches) {
  const statsByParticipant = new Map(
    participants.map((participant) => [
      participant.id,
      {
        participant,
        wins: 0,
        losses: 0,
        draws: 0,
        matchPoints: 0,
        opponents: new Set()
      }
    ])
  );

  for (const match of qualifierMatches) {
    if (match.status !== "COMPLETED") {
      continue;
    }

    const a = match.playerAId ? statsByParticipant.get(match.playerAId) : null;
    const b = match.playerBId ? statsByParticipant.get(match.playerBId) : null;
    if (!a && !b) {
      continue;
    }

    if (a && b) {
      a.opponents.add(match.playerBId);
      b.opponents.add(match.playerAId);
    }

    if (match.result === "A_WIN") {
      if (a) {
        a.wins += 1;
        a.matchPoints += 3;
      }
      if (b) {
        b.losses += 1;
      }
    } else if (match.result === "B_WIN") {
      if (b) {
        b.wins += 1;
        b.matchPoints += 3;
      }
      if (a) {
        a.losses += 1;
      }
    } else {
      if (a) {
        a.draws += 1;
        a.matchPoints += 1;
      }
      if (b) {
        b.draws += 1;
        b.matchPoints += 1;
      }
    }
  }

  const list = [...statsByParticipant.values()];

  for (const item of list) {
    item.buchholz = [...item.opponents].reduce(
      (sum, opponentId) => sum + (statsByParticipant.get(opponentId)?.matchPoints || 0),
      0
    );
  }

  list.sort((a, b) => {
    if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    return participantDisplayName(a.participant).localeCompare(participantDisplayName(b.participant));
  });

  return list.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

function hasPlayedAgainst(aId, bId, matches) {
  return matches.some(
    (match) =>
      (match.playerAId === aId && match.playerBId === bId) ||
      (match.playerAId === bId && match.playerBId === aId)
  );
}

export function buildSwissRoundMatches(participants, qualifierMatches, roundNumber) {
  const ranking = buildQualifierRanking(participants, qualifierMatches);
  const buckets = new Map();

  for (const item of ranking) {
    const key = String(item.matchPoints);
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key).push(item.participant);
  }

  const pointGroups = [...buckets.keys()].map(Number).sort((a, b) => b - a);
  const waiting = [];
  const pairings = [];

  for (const points of pointGroups) {
    const group = [...(buckets.get(String(points)) || [])];
    while (group.length) {
      waiting.push(group.shift());
    }
  }

  while (waiting.length) {
    const first = waiting.shift();
    if (!first) break;
    let opponentIndex = waiting.findIndex((candidate) => !hasPlayedAgainst(first.id, candidate.id, qualifierMatches));
    if (opponentIndex < 0) {
      opponentIndex = 0;
    }
    const second = opponentIndex >= 0 ? waiting.splice(opponentIndex, 1)[0] : null;
    pairings.push([first, second || null]);
  }

  return pairings.map((pairing, index) => ({
    stage: "QUALIFIER",
    roundNumber,
    tableNumber: index + 1,
    playerAId: pairing[0]?.id || null,
    playerBId: pairing[1]?.id || null,
    status: pairing[0] && pairing[1] ? "PENDING" : "COMPLETED",
    result: pairing[0] && pairing[1] ? null : "A_WIN",
    winnerId: pairing[0] && pairing[1] ? null : pairing[0]?.id || pairing[1]?.id || null
  }));
}

function computeEliminationLosses(participants, eliminationMatches) {
  const losses = new Map(participants.map((participant) => [participant.id, 0]));

  for (const match of eliminationMatches) {
    if (match.status !== "COMPLETED") continue;
    if (!match.playerAId || !match.playerBId) continue;
    if (match.result === "DRAW") continue;

    const loserId = match.result === "A_WIN" ? match.playerBId : match.playerAId;
    losses.set(loserId, (losses.get(loserId) || 0) + 1);
  }

  return losses;
}

export function buildInitialTopCutMatches(qualifiedParticipants) {
  const totalSlots = toPowerOfTwo(qualifiedParticipants.length);
  const seeded = [...qualifiedParticipants].sort((a, b) => (a.seed || 999) - (b.seed || 999));
  const padded = [...seeded];
  while (padded.length < totalSlots) {
    padded.push(null);
  }

  const pairings = [];
  for (let i = 0; i < totalSlots / 2; i += 1) {
    pairings.push([padded[i], padded[totalSlots - 1 - i]]);
  }

  return pairings.map((pairing, index) => ({
    stage: "UPPER",
    roundNumber: 1,
    tableNumber: index + 1,
    playerAId: pairing[0]?.id || null,
    playerBId: pairing[1]?.id || null,
    status: pairing[0] && pairing[1] ? "PENDING" : "COMPLETED",
    result: pairing[0] && pairing[1] ? null : "A_WIN",
    winnerId: pairing[0] && pairing[1] ? null : pairing[0]?.id || pairing[1]?.id || null
  }));
}

export function buildNextEliminationRound(participants, eliminationMatches) {
  const pending = eliminationMatches.some((match) => match.status === "PENDING");
  if (pending) {
    return { matches: [], completed: false, reason: "Complete pending elimination matches first." };
  }

  const losses = computeEliminationLosses(participants, eliminationMatches);
  const alive = participants.filter((participant) => (losses.get(participant.id) || 0) < 2);
  if (alive.length <= 1) {
    return { matches: [], completed: true, reason: null };
  }

  const upperPool = alive.filter((participant) => (losses.get(participant.id) || 0) === 0);
  const lowerPool = alive.filter((participant) => (losses.get(participant.id) || 0) === 1);

  const lastUpperRound = Math.max(
    0,
    ...eliminationMatches.filter((match) => match.stage === "UPPER").map((match) => match.roundNumber)
  );
  const lastLowerRound = Math.max(
    0,
    ...eliminationMatches.filter((match) => match.stage === "LOWER").map((match) => match.roundNumber)
  );
  const hasGrandFinal = eliminationMatches.some((match) => match.stage === "GRAND_FINAL");

  const nextMatches = [];

  if (upperPool.length === 1 && lowerPool.length === 1 && !hasGrandFinal) {
    nextMatches.push({
      stage: "GRAND_FINAL",
      roundNumber: 1,
      tableNumber: 1,
      playerAId: upperPool[0].id,
      playerBId: lowerPool[0].id,
      status: "PENDING",
      result: null,
      winnerId: null
    });
    return { matches: nextMatches, completed: false, reason: null };
  }

  if (upperPool.length >= 2) {
    const pairs = pairSequential(upperPool);
    pairs.forEach((pair, index) => {
      nextMatches.push({
        stage: "UPPER",
        roundNumber: lastUpperRound + 1,
        tableNumber: index + 1,
        playerAId: pair[0]?.id || null,
        playerBId: pair[1]?.id || null,
        status: pair[0] && pair[1] ? "PENDING" : "COMPLETED",
        result: pair[0] && pair[1] ? null : "A_WIN",
        winnerId: pair[0] && pair[1] ? null : pair[0]?.id || pair[1]?.id || null
      });
    });
  }

  if (lowerPool.length >= 2) {
    const pairs = pairSequential(lowerPool);
    pairs.forEach((pair, index) => {
      nextMatches.push({
        stage: "LOWER",
        roundNumber: lastLowerRound + 1,
        tableNumber: index + 1,
        playerAId: pair[0]?.id || null,
        playerBId: pair[1]?.id || null,
        status: pair[0] && pair[1] ? "PENDING" : "COMPLETED",
        result: pair[0] && pair[1] ? null : "A_WIN",
        winnerId: pair[0] && pair[1] ? null : pair[0]?.id || pair[1]?.id || null
      });
    });
  }

  return { matches: nextMatches, completed: false, reason: null };
}

export function localMatchResultLabel(match) {
  if (match.status !== "COMPLETED") {
    return "Pending";
  }
  if (match.result === "DRAW") {
    return "Draw";
  }
  return match.result === "A_WIN" ? "Player A won" : "Player B won";
}

export function localStageLabel(stage) {
  if (stage === "QUALIFIER") return "Qualifier";
  if (stage === "UPPER") return "Upper Bracket";
  if (stage === "LOWER") return "Lower Bracket";
  return "Grand Final";
}
