import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const orgId = searchParams.get('org')

    if (!token || !orgId) {
      return NextResponse.json({ error: 'Missing token or organization ID' }, { status: 400 })
    }

    const invitation = await db.invitation.findUnique({
      where: { token }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.organizationId !== orgId) {
      return NextResponse.json({ error: 'Token does not match organization' }, { status: 400 })
    }

    const organization = await db.organization.findUnique({
      where: { id: invitation.organizationId },
      select: {
        id: true,
        name: true
      }
    })

    const invitedBy = await db.user.findUnique({
      where: { id: invitation.invitedById },
      select: {
        firstName: true,
        lastName: true,
        email: true
      }
    })

    const invitedByName = invitedBy 
      ? `${invitedBy.firstName || ''} ${invitedBy.lastName || ''}`.trim() || invitedBy.email
      : 'Unknown'

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationName: organization?.name || 'Unknown Organization',
      organizationId: invitation.organizationId,
      invitedByName,
      expiresAt: invitation.expiresAt.toISOString(),
      isExpired: invitation.expiresAt < new Date(),
      isAccepted: Boolean(invitation.acceptedAt)
    })

  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}
