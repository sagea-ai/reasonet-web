import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMemberships: {
          include: {
            organization: true
          }
        }
      }
    })

    // Create user if doesn't exist (but don't set trial here)
    if (!user) {
      const clerkUser = await currentUser()
      if (clerkUser) {
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            imageUrl: clerkUser.imageUrl || null,
            hasCompletedOnboarding: false,
            onboardingStep: 1,
            // Don't set trial status here - only in onboarding completion
          },
          include: {
            organizationMemberships: {
              include: {
                organization: true
              }
            }
          }
        })
      } else {
        return NextResponse.json({ 
          hasCompletedOnboarding: false,
          userId,
          isNewUser: true,
          onboardingStep: 1
        })
      }
    }

    return NextResponse.json({ 
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      userId,
      isNewUser: false,
      onboardingStep: user.onboardingStep || 1
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check onboarding status', 
        hasCompletedOnboarding: false,
        onboardingStep: 1
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
