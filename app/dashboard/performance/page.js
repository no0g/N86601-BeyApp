import { PerformanceBrowser } from "@/components/features/performance-browser";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { comboLabel, computeComboStats, getPartById } from "@/lib/beyblade-data";
import { buildComboPerformance } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;
const BEYBREW_IMAGE_BASE_URL = "https://beybladebrew.com/images";

function pageHref(comboId, comboPage) {
  return `/dashboard/performance?comboId=${comboId}&comboPage=${comboPage}`;
}

export default async function ComboPerformancePage({ searchParams }) {
  if (isBuildPhase) {
    return null;
  }

  const session = await requireSession();
  const params = await searchParams;

  const comboCount = await prisma.combo.count({
    where: session.role === "ADMIN" ? {} : { ownerId: session.sub }
  });

  if (comboCount === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Combo Performance</CardTitle>
            <CardDescription>Create at least one combo to unlock performance tracking.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const requestedPage = Math.max(1, Number(params?.comboPage || 1) || 1);
  const totalPages = Math.max(1, Math.ceil(comboCount / PAGE_SIZE));
  const currentPage = Math.min(totalPages, requestedPage);

  const combos = await prisma.combo.findMany({
    where: session.role === "ADMIN" ? {} : { ownerId: session.sub },
    include: {
      owner: {
        select: {
          displayName: true,
          username: true
        }
      }
    },
    orderBy: [{ owner: { displayName: "asc" } }, { createdAt: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });

  const initialComboId = combos.some((combo) => combo.id === params?.comboId) ? params.comboId : combos[0].id;
  const comboIds = combos.map((combo) => combo.id);

  const [tournamentMatches, trainingMatches] = await Promise.all([
    prisma.match.findMany({
      where: {
        yourComboId: {
          in: comboIds
        }
      },
      include: {
        yourCombo: true
      },
      orderBy: { playedAt: "asc" }
    }),
    prisma.trainingMatch.findMany({
      where: {
        OR: [
          { yourComboId: { in: comboIds } },
          { opponentComboId: { in: comboIds } }
        ]
      },
      include: {
        yourCombo: {
          include: {
            owner: {
              select: {
                displayName: true,
                username: true
              }
            }
          }
        },
        opponentCombo: {
          include: {
            owner: {
              select: {
                displayName: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { playedAt: "asc" }
    })
  ]);

  const tournamentByCombo = new Map(comboIds.map((id) => [id, []]));
  for (const match of tournamentMatches) {
    tournamentByCombo.get(match.yourComboId)?.push(match);
  }

  const trainingByCombo = new Map(comboIds.map((id) => [id, []]));
  for (const match of trainingMatches) {
    trainingByCombo.get(match.yourComboId)?.push(match);
    if (match.opponentComboId !== match.yourComboId) {
      trainingByCombo.get(match.opponentComboId)?.push(match);
    }
  }

  const preparedCombos = combos.map((combo) => {
    const blade = getPartById(combo.bladeId);
    const comboStats = computeComboStats(combo.bladeId, combo.ratchetId, combo.bitId);

    return {
      ...combo,
      label: comboLabel(combo),
      bladeName: blade?.altname || blade?.name || "Blade",
      bladeSource: blade?.source || "BeyBrew",
      bladeLine: blade?.line || "Beyblade X",
      bladeSpinType: blade?.spinType || "right",
      bladeImageSrc: blade?.image ? `${BEYBREW_IMAGE_BASE_URL}/${blade.image}` : null,
      weight: comboStats.weight,
      weightDetails: comboStats.weightDetails,
      weightWarnings: comboStats.weightWarnings
    };
  });

  const performances = Object.fromEntries(
    preparedCombos.map((combo) => [
      combo.id,
      buildComboPerformance({
        comboId: combo.id,
        tournamentMatches: tournamentByCombo.get(combo.id) || [],
        trainingMatches: trainingByCombo.get(combo.id) || []
      })
    ])
  );

  const previousPageHref =
    currentPage > 1 ? pageHref(initialComboId, currentPage - 1) : null;
  const nextPageHref =
    currentPage < totalPages ? pageHref(initialComboId, currentPage + 1) : null;

  return (
    <PerformanceBrowser
      combos={preparedCombos}
      performances={performances}
      currentPage={currentPage}
      totalPages={totalPages}
      initialComboId={initialComboId}
      previousPageHref={previousPageHref}
      nextPageHref={nextPageHref}
    />
  );
}
