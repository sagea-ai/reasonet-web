import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { getTrialStatus, getOrganizationLimit } from '@/lib/utils/trial'

export async function GET(
  request: NextRequest,

  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const resolvedParams = await params; 
    const organizationId = resolvedParams.id;

    const userOrg = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      },
    });
    if (!userOrg) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // --- ENFORCE ORG ACCESS LIMIT FOR FREE TIER ---
    const user = await db.user.findUnique({ where: { clerkId: userId } })
    const trialStatus = await getTrialStatus(userId)
    const orgLimit = getOrganizationLimit(trialStatus.tier, trialStatus.isTrialActive)
    if (!trialStatus.isTrialActive && orgLimit === 1) {
      // Only allow access to the first org
      const userOrgs = await db.organizationMember.findMany({
        where: { user: { clerkId: userId } },
        orderBy: { createdAt: 'asc' }
      })
      if (userOrgs.length > 1 && userOrg.organizationId !== userOrgs[0].organizationId) {
        return NextResponse.json({ error: "Organization limit reached for your plan." }, { status: 403 })
      }
    }

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const analyses = await db.analysis.findMany({
      where: {
        repository: { organizationId },
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    });

    const counts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      counts[key] = 0;
    }
    for (const a of analyses) {
      const key = a.createdAt.toISOString().slice(0, 10);
      if (counts[key] !== undefined) counts[key]++;
    }
    const history = Object.entries(counts).map(([date, analysesRun]) => ({ date, analysesRun }));

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching usage history:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage history" },
      { status: 500 }
    );
  }
}
