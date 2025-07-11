import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { getTrialStatus, getPRReviewLimit } from '@/lib/utils/trial';

// Utility: get plan limit for tier
function getAnalysesLimitForTier(tier: string) {
  if (tier === "FREE" || tier === "TRIAL") return 10;
  if (tier === "PRO") return 1000;
  if (tier === "ENTERPRISE") return -1; // Unlimited
  return 10;
  
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
    }

    const userOrg = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      },
      include: { user: true, organization: true },
    });
    if (!userOrg) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const orgTier = (userOrg.organization as any)?.subscriptionTier;
    const userTier = userOrg.user.subscriptionTier || "FREE";
    const tier = orgTier || userTier || "FREE";
    const trialStatus = await getTrialStatus(userId)
    const analysesLimit = getPRReviewLimit(tier, trialStatus.isTrialActive);

    const analysesRun = await db.analysis.count({
      where: {
        repository: { organizationId },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
    });

    return NextResponse.json({
      analysesRun,
      analysesLimit,
      remaining: analysesLimit === -1 ? -1 : Math.max(0, analysesLimit - analysesRun),
      tier,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
