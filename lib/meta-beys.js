const META_BEYS_EVENTS_URL = "https://beydecks-production.up.railway.app/api/events";

function normalizeName(value) {
  return (value || "").trim().toLowerCase();
}

export async function fetchMetaRecommendationsForBlade(bladeName) {
  const normalizedBlade = normalizeName(bladeName);

  if (!normalizedBlade) {
    return [];
  }

  const response = await fetch(META_BEYS_EVENTS_URL, {
    next: { revalidate: 21600 }
  });

  if (!response.ok) {
    throw new Error("Failed to load Meta Beys events.");
  }

  const events = await response.json();
  const combos = new Map();
  const now = Date.now();

  for (const event of events) {
    if (!Array.isArray(event?.topCut)) {
      continue;
    }

    for (const placement of event.topCut) {
      if (!Array.isArray(placement?.combos)) {
        continue;
      }

      for (const combo of placement.combos) {
        if (normalizeName(combo?.blade) !== normalizedBlade) {
          continue;
        }

        const ratchet = combo?.ratchet?.trim();
        const bit = combo?.bit?.trim();

        if (!ratchet || !bit) {
          continue;
        }

        const key = `${normalizeName(ratchet)}::${normalizeName(bit)}`;
        const entry = combos.get(key) || {
          ratchet,
          bit,
          usageCount: 0,
          lastSeenAt: null
        };

        entry.usageCount += 1;

        const eventTime = event?.endTime || event?.startTime || null;
        if (eventTime) {
          const current = new Date(eventTime).getTime();
          const previous = entry.lastSeenAt ? new Date(entry.lastSeenAt).getTime() : 0;

          if (!Number.isNaN(current) && current <= now && current > previous) {
            entry.lastSeenAt = eventTime;
          }
        }

        combos.set(key, entry);
      }
    }
  }

  return [...combos.values()]
    .sort((a, b) => {
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }

      return (b.lastSeenAt || "").localeCompare(a.lastSeenAt || "");
    })
    .slice(0, 5);
}
