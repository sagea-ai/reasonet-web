import { db } from '@/lib/db'

export interface TrialStatus {
  isTrialActive: boolean
  daysRemaining: number
  trialEndsAt: Date | null
  tier: 'FREE' | 'PRO' | 'TRIAL' | 'ENTERPRISE'
}

export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      subscriptionTier: true,
      trialStartedAt: true,
      trialEndsAt: true,
      isTrialActive: true
    }
  })

  if (!user) {
    return {
      isTrialActive: false,
      daysRemaining: 0,
      trialEndsAt: null,
      tier: 'FREE'
    }
  }

  const now = new Date()
  
  if (user.isTrialActive && user.trialEndsAt) {
    const daysRemaining = Math.max(0, Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    
    if (daysRemaining > 0) {
      return {
        isTrialActive: true,
        daysRemaining,
        trialEndsAt: user.trialEndsAt,
        tier: user.subscriptionTier
      }
    } else {
      // Trial has expired, expire it
      await expireTrial(userId)
      return {
        isTrialActive: false,
        daysRemaining: 0,
        trialEndsAt: user.trialEndsAt,
        tier: 'FREE'
      }
    }
  }

  return {
    isTrialActive: false,
    daysRemaining: 0,
    trialEndsAt: user.trialEndsAt,
    tier: user.subscriptionTier
  }
}

export async function startTrial(userId: string): Promise<void> {
  const trialStartedAt = new Date()
  const trialEndsAt = new Date(trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000)

  await db.user.update({
    where: { clerkId: userId },
    data: {
      subscriptionTier: 'TRIAL',
      trialStartedAt,
      trialEndsAt,
      isTrialActive: true
    }
  })
}

export async function expireTrial(userId: string): Promise<void> {
  await db.user.update({
    where: { clerkId: userId },
    data: {
      subscriptionTier: 'FREE',
      isTrialActive: false
    }
  })
}

export function canCreateOrganization(tier: string, organizationCount: number, isTrialActive: boolean): boolean {
  if (isTrialActive) return true; 
  if (tier === 'FREE' || tier === 'PRO') {
    return organizationCount < 1
  }
  return true
}

export function getOrganizationLimit(tier: string, isTrialActive: boolean): number {
  if (isTrialActive) return -1 
  if (tier === 'FREE' || tier === 'PRO') return 1
  return -1 // Unlimited for ENTERPRISE
}

export function getPRReviewLimit(tier: string, isTrialActive: boolean): number {
  if (isTrialActive) return -1 // Unlimited during trial
  if (tier === 'FREE') return 5
  if (tier === 'PRO') return 100
  if (tier === 'ENTERPRISE') return -1
  return 5
}
