import { BattleSimulator } from "@/components/features/battle-simulator";
import { requireSession } from "@/lib/auth";
import { computeComboStats, getPartById } from "@/lib/beyblade-data";
import { prisma } from "@/lib/prisma";
import { isBuildPhase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  if (isBuildPhase) {
    return null;
  }

  await requireSession();

  const combos = await prisma.combo.findMany({
    where: {
      archivedAt: null
    },
    include: {
      owner: {
        select: {
          displayName: true,
          username: true
        }
      }
    },
    orderBy: [{ owner: { displayName: "asc" } }, { createdAt: "desc" }]
  });

  const preparedCombos = combos.map((combo) => {
    const stats = computeComboStats(combo.bladeId, combo.ratchetId, combo.bitId);
    const blade = getPartById(combo.bladeId);

    return {
      id: combo.id,
      name: combo.name,
      owner: combo.owner,
      attack: combo.attack,
      defense: combo.defense,
      stamina: combo.stamina,
      xtreme: combo.xtreme,
      burst: combo.burst,
      weight: stats.weight,
      spinType: blade?.spinType || "right"
    };
  });

  return <BattleSimulator combos={preparedCombos} />;
}

