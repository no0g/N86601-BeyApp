function safeWinRate(wins, losses) {
  return wins + losses === 0 ? 0 : wins / (wins + losses);
}

function computeOverallScore(points, totalMatches, winRate) {
  if (totalMatches === 0) {
    return 0;
  }

  const pointsPerMatch = points / totalMatches;
  return Number(((pointsPerMatch * 70) + (winRate * 20) + (Math.min(totalMatches, 30) * 0.5)).toFixed(2));
}

export function buildTournamentComboRecords(matches) {
  const records = new Map();

  for (const match of matches) {
    const comboId = match.yourCombo.id;

    if (!records.has(comboId)) {
      records.set(comboId, { combo: match.yourCombo, wins: 0, losses: 0, draws: 0, points: 0 });
    }

    const entry = records.get(comboId);

    if (match.winner === "YOUR") {
      entry.wins += 1;
    } else if (match.winner === "OPPONENT") {
      entry.losses += 1;
    } else {
      entry.draws += 1;
    }

    entry.points += match.pointsDelta;
  }

  return [...records.values()].map((entry) => {
    const total = entry.wins + entry.losses + entry.draws;
    const winRate = safeWinRate(entry.wins, entry.losses);

    return {
      ...entry,
      total,
      winRate,
      overallScore: computeOverallScore(entry.points, total, winRate)
    };
  });
}

export function buildTrainingComboRecords(trainingMatches) {
  const records = new Map();

  for (const match of trainingMatches) {
    const yourComboId = match.yourCombo.id;
    const opponentComboId = match.opponentCombo.id;

    if (!records.has(yourComboId)) {
      records.set(yourComboId, { combo: match.yourCombo, wins: 0, losses: 0, draws: 0, points: 0 });
    }
    if (!records.has(opponentComboId)) {
      records.set(opponentComboId, { combo: match.opponentCombo, wins: 0, losses: 0, draws: 0, points: 0 });
    }

    const yourEntry = records.get(yourComboId);
    const opponentEntry = records.get(opponentComboId);

    if (match.winner === "YOUR") {
      yourEntry.wins += 1;
      opponentEntry.losses += 1;
    } else if (match.winner === "OPPONENT") {
      yourEntry.losses += 1;
      opponentEntry.wins += 1;
    } else {
      yourEntry.draws += 1;
      opponentEntry.draws += 1;
    }

    yourEntry.points += match.pointsDelta;
    opponentEntry.points -= match.pointsDelta;
  }

  return [...records.values()].map((entry) => {
    const total = entry.wins + entry.losses + entry.draws;
    const winRate = safeWinRate(entry.wins, entry.losses);

    return {
      ...entry,
      total,
      winRate,
      overallScore: computeOverallScore(entry.points, total, winRate)
    };
  });
}

export function withRanking(records) {
  return records.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

export function buildRankings(records) {
  return {
    overall: withRanking(
      [...records].sort(
        (a, b) =>
          b.overallScore - a.overallScore ||
          b.points - a.points ||
          b.total - a.total ||
          b.winRate - a.winRate
      )
    ),
    winRate: withRanking(
      [...records].sort(
        (a, b) =>
          b.winRate - a.winRate ||
          b.total - a.total ||
          b.points - a.points ||
          b.wins - a.wins
      )
    ),
    points: withRanking(
      [...records].sort(
        (a, b) =>
          b.points - a.points ||
          b.wins - a.wins ||
          b.winRate - a.winRate ||
          b.total - a.total
      )
    )
  };
}

export function summarizeFinishTypes(matches) {
  return matches.reduce(
    (summary, match) => {
      summary[match.finishType] = (summary[match.finishType] || 0) + 1;
      return summary;
    },
    { XTREME: 0, BURST: 0, OVER: 0, SPIN: 0 }
  );
}

function normalizeTournamentMatch(match, comboId) {
  const didWin = match.winner === "YOUR";
  const didLose = match.winner === "OPPONENT";
  return {
    id: match.id,
    mode: "TOURNAMENT",
    playedAt: match.playedAt,
    finishType: match.finishType,
    points: match.pointsDelta,
    result: didWin ? "WIN" : didLose ? "LOSS" : "DRAW",
    label: match.opponentComboName || "Opponent combo"
  };
}

function normalizeTrainingMatch(match, comboId) {
  const isYourSide = match.yourComboId === comboId;
  const opponent = isYourSide ? match.opponentCombo : match.yourCombo;
  const didWin =
    match.winner === "DRAW"
      ? false
      : isYourSide
        ? match.winner === "YOUR"
        : match.winner === "OPPONENT";
  const didLose =
    match.winner === "DRAW"
      ? false
      : isYourSide
        ? match.winner === "OPPONENT"
        : match.winner === "YOUR";

  return {
    id: match.id,
    mode: "TRAINING",
    playedAt: match.playedAt,
    finishType: match.finishType,
    points: isYourSide ? match.pointsDelta : -match.pointsDelta,
    result: didWin ? "WIN" : didLose ? "LOSS" : "DRAW",
    label: opponent?.name || "Training combo"
  };
}

function buildWorstMatchup(comboId, trainingMatches) {
  const matchupMap = new Map();

  for (const match of trainingMatches) {
    const isYourSide = match.yourComboId === comboId;
    const opponent = isYourSide ? match.opponentCombo : match.yourCombo;
    const opponentId = opponent?.id;

    if (!opponentId) {
      continue;
    }

    if (!matchupMap.has(opponentId)) {
      matchupMap.set(opponentId, {
        opponent,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        total: 0
      });
    }

    const entry = matchupMap.get(opponentId);

    if (match.winner === "DRAW") {
      entry.draws += 1;
    } else if ((isYourSide && match.winner === "YOUR") || (!isYourSide && match.winner === "OPPONENT")) {
      entry.wins += 1;
    } else {
      entry.losses += 1;
    }

    entry.points += isYourSide ? match.pointsDelta : -match.pointsDelta;
    entry.total += 1;
  }

  const matchups = [...matchupMap.values()].map((entry) => ({
    ...entry,
    winRate: safeWinRate(entry.wins, entry.losses)
  }));

  return matchups.sort(
    (a, b) =>
      a.winRate - b.winRate ||
      b.total - a.total ||
      a.points - b.points ||
      a.wins - b.wins
  )[0] || null;
}

export function buildComboPerformance({ comboId, tournamentMatches, trainingMatches }) {
  const tournamentHistory = tournamentMatches.map((match) => normalizeTournamentMatch(match, comboId));
  const trainingHistory = trainingMatches.map((match) => normalizeTrainingMatch(match, comboId));
  const combinedHistory = [...tournamentHistory, ...trainingHistory].sort(
    (a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
  );

  let tournamentCumulative = 0;
  let trainingCumulative = 0;

  const timeline = combinedHistory.map((entry) => {
    if (entry.mode === "TOURNAMENT") {
      tournamentCumulative += entry.points;
    } else {
      trainingCumulative += entry.points;
    }

    return {
      ...entry,
      tournamentCumulative,
      trainingCumulative,
      combinedCumulative: tournamentCumulative + trainingCumulative
    };
  });

  const tournamentRecords = buildTournamentComboRecords(
    tournamentMatches.map((match) => ({
      ...match,
      yourCombo: match.yourCombo
    }))
  );
  const trainingRecords = buildTrainingComboRecords(
    trainingMatches.map((match) => ({
      ...match,
      yourCombo: match.yourCombo,
      opponentCombo: match.opponentCombo
    }))
  );

  const tournamentEntry = tournamentRecords.find((entry) => entry.combo.id === comboId) || {
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    total: 0,
    winRate: 0,
    overallScore: 0
  };
  const trainingEntry = trainingRecords.find((entry) => entry.combo.id === comboId) || {
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    total: 0,
    winRate: 0,
    overallScore: 0
  };

  return {
    tournament: {
      ...tournamentEntry,
      finishTypes: summarizeFinishTypes(tournamentMatches)
    },
    training: {
      ...trainingEntry,
      finishTypes: summarizeFinishTypes(trainingMatches)
    },
    combined: {
      wins: tournamentEntry.wins + trainingEntry.wins,
      losses: tournamentEntry.losses + trainingEntry.losses,
      draws: tournamentEntry.draws + trainingEntry.draws,
      points: tournamentEntry.points + trainingEntry.points,
      total: tournamentEntry.total + trainingEntry.total,
      winRate: safeWinRate(
        tournamentEntry.wins + trainingEntry.wins,
        tournamentEntry.losses + trainingEntry.losses
      ),
      overallScore: computeOverallScore(
        tournamentEntry.points + trainingEntry.points,
        tournamentEntry.total + trainingEntry.total,
        safeWinRate(
          tournamentEntry.wins + trainingEntry.wins,
          tournamentEntry.losses + trainingEntry.losses
        )
      )
    },
    worstMatchup: buildWorstMatchup(comboId, trainingMatches),
    timeline,
    recentHistory: [...combinedHistory].reverse().slice(0, 10)
  };
}
