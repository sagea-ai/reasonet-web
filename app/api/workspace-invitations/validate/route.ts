import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const invitation = await db.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

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
      workspaceName: invitation.workspaceName,
      workspaceId: invitation.workspaceId,
      organizationName: invitation.organizationName,
      organizationId: invitation.organizationId,
      invitedByName,
      expiresAt: invitation.expiresAt.toISOString(),
      isExpired: invitation.expiresAt < new Date(),
      isAccepted: Boolean(invitation.acceptedAt)
    })

  } catch (error) {
    console.error('Error validating workspace invitation:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}
