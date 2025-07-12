import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  organizationId: z.string().min(1, 'Organization ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = acceptInviteSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const { token, organizationId } = validationResult.data
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const result = await db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { token }
      })

      if (!invitation) {
        throw new Error('Invalid invitation token')
      }

      if (invitation.organizationId !== organizationId) {
        throw new Error('Token does not match organization')
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired')
      }

      if (invitation.acceptedAt) {
        throw new Error('Invitation has already been accepted')
      }

      // Fetch organization data separately
      const organization = await tx.organization.findUnique({
        where: { id: invitation.organizationId }
      })

      if (!organization) {
        throw new Error('Organization not found')
      }

      // Check if invitation email matches current user
      if (invitation.email !== clerkUser.emailAddresses?.[0]?.emailAddress) {
        throw new Error('Invitation email does not match your account')
      }

      // Find or create user
      const user = await tx.user.upsert({
        where: { clerkId: userId },
        update: {
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          imageUrl: clerkUser.imageUrl || undefined,
        },
        create: {
          clerkId: userId,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null,
          hasCompletedOnboarding: true, 
          onboardingStep: 3,
        }
      })

      const existingMember = await tx.organizationMember.findFirst({
        where: {
          userId: user.id,
          organizationId: invitation.organizationId
        }
      })

      if (existingMember) {
        throw new Error('You are already a member of this organization')
      }

      const member = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role
        }
      })

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() }
      })

      await tx.activity.create({
        data: {
          type: 'MEMBER_INVITED',
          title: 'Joined organization',
          description: `Joined ${organization.name}`,
          userId: user.id,
          metadata: {
            organizationId: invitation.organizationId,
            organizationName: organization.name,
            invitedBy: invitation.invitedById
          }
        }
      })

      return { 
        user, 
        member, 
        organization
      }
    })

    return NextResponse.json({ 
      success: true,
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug
      },
      message: `Successfully joined ${result.organization.name}!`
    })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to accept invitation'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
