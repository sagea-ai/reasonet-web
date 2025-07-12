import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const inviteToWorkspaceSchema = z.object({
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
    const validationResult = inviteToWorkspaceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, role } = validationResult.data;

    // Check if user has admin/owner permissions in the workspace
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

    // Get workspace details
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        organization: true
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check if user exists and is already a member of the organization
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        organizationMemberships: {
          where: {
            organizationId: workspace.organizationId
          }
        },
        workspaceMemberships: {
          where: {
            workspaceId
          }
        }
      }
    });

    if (existingUser) {
      // If user exists and is already in the organization
      if (existingUser.organizationMemberships.length > 0) {
        // Check if already a workspace member
        if (existingUser.workspaceMemberships.length > 0) {
          return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 });
        }

        // Add directly to workspace
        const member = await db.workspaceMember.create({
          data: {
            workspaceId,
            userId: existingUser.id,
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

        return NextResponse.json({ 
          success: true,
          member,
          message: 'User added to workspace successfully'
        });
      }
    }

    // Check if there's already a pending workspace invitation
    const existingInvitation = await db.workspaceInvitation.findFirst({
      where: {
        email,
        workspaceId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'User already has a pending invitation to this workspace' }, { status: 409 });
    }

    // Create workspace invitation
    const token = `ws_inv_${Math.random().toString(36).substr(2, 32)}`;
    const invitation = await db.workspaceInvitation.create({
      data: {
        email,
        role,
        token,
        workspaceId,
        workspaceName: workspace.name,
        organizationId: workspace.organizationId,
        organizationName: workspace.organization.name,
        invitedById: requesterMember.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // TODO: Send invitation email with workspace context
    // Email should mention they're being invited to join the workspace

    return NextResponse.json({ 
      success: true,
      invitation: {
        email: invitation.email,
        token: invitation.token,
        workspaceName: workspace.name,
        organizationName: workspace.organization.name,
        workspaceRole: role
      },
      message: 'Invitation sent successfully'
    });

  } catch (error) {
    console.error('Error inviting user to workspace:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
