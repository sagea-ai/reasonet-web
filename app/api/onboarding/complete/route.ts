import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const prisma = new PrismaClient()

const onboardingSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  website: z.string().url('Valid website URL is required'),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  invitedEmails: z.array(z.string().email()).optional().default([]),
  referralCode: z.string().optional()
})

const mapCompanySize = (size: string) => {
  switch (size) {
    case 'Just me': return 'JUST_ME'
    case '2-10': return 'TWO_TO_TEN'  
    case '11-50': return 'ELEVEN_TO_FIFTY'
    case '51-200': return 'FIFTY_ONE_TO_TWO_HUNDRED'
    case '200+': return 'TWO_HUNDRED_PLUS'
    case '1000+': return 'THOUSAND_PLUS'
    default: return 'JUST_ME'
  }
}

// Helper to determine if user can create another organization
function canCreateOrganization(
  tier: string,
  orgCount: number,
  isTrialActive: boolean
): boolean {
  if (tier === 'PAID') return true
  if (isTrialActive || tier === 'TRIAL') return orgCount < 1
  return orgCount < 1
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = onboardingSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const { invitedEmails, companyName, website, companySize, industry, referralCode } = validationResult.data
    const clerkUser = await currentUser()

    // --- ENFORCE ORG CREATION LIMIT ---
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    let isTrialActive = false
    let tier = 'FREE'
    if (dbUser) {
      tier = dbUser.subscriptionTier || 'FREE'
      isTrialActive = Boolean(dbUser.isTrialActive && dbUser.trialEndsAt && dbUser.trialEndsAt > new Date())
    }
    const orgCount = await prisma.organizationMember.count({ where: { user: { clerkId: userId } } })
    // Use helper logic
    // If not allowed, block
    if (!canCreateOrganization(tier, orgCount, isTrialActive)) {
      return NextResponse.json({ error: 'Organization limit reached for your plan.' }, { status: 403 })
    }

    console.log('Onboarding data received:', { invitedEmails, companyName, website, companySize, industry })

    const result = await prisma.$transaction(async (tx) => {
      let referrer = null
      if (referralCode) {
        referrer = await tx.user.findUnique({
          where: { referralCode: referralCode.toUpperCase() }
        })
      }

      const trialStartedAt = new Date()
      const trialEndsAt = new Date(trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000)

      const user = await tx.user.upsert({
        where: { clerkId: userId },
        update: {
          hasCompletedOnboarding: true,
          onboardingStep: 3,
          referredById: referrer?.id || undefined,
          subscriptionTier: 'TRIAL',
          trialStartedAt,
          trialEndsAt,
          isTrialActive: true
        },
        create: {
          clerkId: userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
          firstName: clerkUser?.firstName || null,
          lastName: clerkUser?.lastName || null,
          imageUrl: clerkUser?.imageUrl || null,
          hasCompletedOnboarding: true,
          onboardingStep: 3,
          referredById: referrer?.id || undefined,
          subscriptionTier: 'TRIAL',
          trialStartedAt,
          trialEndsAt,
          isTrialActive: true
        }
      })

      // create organization with unique slug
      const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const randomSuffix = Math.random().toString(36).substr(2, 9)
      const slug = `${baseSlug}-${randomSuffix}`

      const organization = await tx.organization.create({
        data: {
          name: companyName,
          website: website || null,
          companySize: companySize ? mapCompanySize(companySize) : null,
          industry: industry || null,
          slug,
          creatorId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          },
          settings: {
            create: {}
          }
        }
      })

      let invitationTokens: string[] = []
      if (invitedEmails && invitedEmails.length > 0) {
        const invitationData = invitedEmails.map(email => {
          const token = `inv_${Math.random().toString(36).substr(2, 32)}`
          invitationTokens.push(token)
          return {
            email,
            organizationId: organization.id,
            organizationName: organization.name,
            invitedById: user.id,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        })
        
        await tx.invitation.createMany({
          data: invitationData
        })
      }

      if (referrer && referrer.id !== user.id) {
        await tx.credit.create({
          data: {
            userId: referrer.id,
            amount: 5.00,
            type: 'REFERRAL_BONUS',
            description: `Referral bonus for inviting ${user.email}`,
            referralId: user.id,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          }
        })

        await tx.credit.create({
          data: {
            userId: user.id,
            amount: 5.00,
            type: 'REFERRED_BONUS',
            description: `Welcome bonus for being referred by ${referrer.email}`,
            referralId: referrer.id,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          }
        })

        await tx.activity.create({
          data: {
            type: 'MEMBER_INVITED',
            title: 'Referral bonus earned',
            description: `Earned $5 credit for referring ${user.email}`,
            userId: referrer.id,
            metadata: {
              referralId: user.id,
              creditAmount: 5.00
            }
          }
        })
      }

      await tx.activity.create({
        data: {
          type: 'ORGANIZATION_CREATED',
          title: 'Organization created',
          description: `Created organization "${organization.name}"`,
          userId: user.id,
          metadata: {
            organizationId: organization.id,
            organizationName: organization.name
          }
        }
      })

      return { user, organization, referrer }
    }, {
      timeout: 10000 // Increase timeout to 10 seconds
    })

    const resend = new Resend(process.env.RESEND_API_KEY)
    
    if (invitedEmails && invitedEmails.length > 0) {
      for (const email of invitedEmails) {
        try {
          await resend.emails.send({
            from: 'Reasonet <noreply@Reasonet.com>',
            to: email,
            subject: `You're invited to join ${result.organization.name} on Reasonet`,
            html: `
              <p>Hi there,</p>
              <p>You have been invited to join <b>${result.organization.name}</b> on Reasonet.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.Reasonet.com'}/accept-invite?email=${encodeURIComponent(email)}">Accept your invitation</a></p>
              <p>If you did not expect this, you can ignore this email.</p>
              <p>—ciao, The Reasonet Team</p>
            `
          })
        } catch (err) {
          console.error('Failed to send invite email to', email, err)
        }
      }
    }

    // Send welcome email to user
    try {
      await resend.emails.send({
        from: 'Reasonet <noreply@Reasonet.com>',
        to: result.user.email,
        subject: 'Welcome to Reasonet!',
        html: `
          <p>Hi ${result.user.firstName || ''},</p>
          <p>Howdy, Partner! <br> Welcome to Reasonet! Your organization <b>${result.organization.name}</b> has been created.</p>
          <p>Get started by connecting your repositories and running your first analysis.</p>
          <p> we're glad to have you onboard, Partner!</p>
          <p>—ciao, The Reasonet Team</p>
        `
      })
    } catch (err) {
      console.error('Failed to send welcome email to', result.user.email, err)
    }

    console.log('Onboarding completed successfully:', { organizationId: result.organization.id })

    return NextResponse.json({ 
      success: true,
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug
      }
    })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to complete onboarding', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
