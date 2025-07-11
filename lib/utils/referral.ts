import { db } from '@/lib/db'

export function generateReferralCode(): string {
  // Generate 8 character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function validateReferralCode(code: string): Promise<boolean> {
  if (!code || code.length !== 8) return false
  
  const user = await db.user.findUnique({
    where: { referralCode: code.toUpperCase() }
  })
  
  return !!user
}

export async function getUserByReferralCode(code: string) {
  return await db.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    }
  })
}

export async function getUserCredits(userId: string) {
  const credits = await db.credit?.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  }) || [];
  
  const totalAmount = credits.reduce((sum, credit) => sum + credit.amount, 0)
  
  return {
    credits,
    totalAmount
  }
}
