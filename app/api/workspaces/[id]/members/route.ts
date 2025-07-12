import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const workspaceId = resolvedParams.id;

    const body = await request.json();
    const validationResult = inviteMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, role } = validationResult.data;

    // Check if user has admin/owner permissions
    const requesterMember = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: {
          clerkId: userId
        },
        role: {
          in: ['OWNER', 'ADMIN']
        }
      }
    });

    if (!requesterMember) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find the user to invite
    const userToInvite = await db.user.findUnique({
      where: { email }
    });

    if (!userToInvite) {
      // Create an invitation instead of requiring the user to exist
      const workspace = await db.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          organization: true
        }
      });

      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }

      // Create workspace invitation
      const token = `ws_inv_${Math.random().toString(36).substr(2, 32)}`;
      const invitation = await db.invitation.create({
        data: {
          email,
          role: 'MEMBER', // Default for workspace invites
          token,
          organizationId: workspace.organizationId,
          organizationName: workspace.organization.name,
          invitedById: requesterMember.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Send invitation email with workspace context
      // (Email sending logic here)

      return NextResponse.json({ 
        message: 'Invitation sent',
        invitation: {
          email: invitation.email,
          role: invitation.role,
          token: invitation.token
        }
      });
    }

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: userToInvite.id
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    // Add user to workspace
    const member = await db.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true
          }
        }
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error adding workspace member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}
