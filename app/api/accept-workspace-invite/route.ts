import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const acceptInviteSchema = z.object({
  token: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = acceptInviteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // Get user details
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the invitation
    const invitation = await db.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Check if invitation has already been accepted
    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 409 });
    }

    // Check if the invitation is for the current user's email
    if (invitation.email !== user.email) {
      return NextResponse.json({ error: 'Invitation email does not match user email' }, { status: 403 });
    }

    // Check if user is already a member of the workspace
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: invitation.workspaceId
        }
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 });
    }

    // Ensure user is a member of the organization first
    let orgMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: invitation.organizationId
        }
      }
    });

    if (!orgMember) {
      // Add user to organization first
      orgMember = await db.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: 'MEMBER'
        }
      });
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Add user to workspace
      const workspaceMember = await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role
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
          },
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      });

      // Mark invitation as accepted
      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() }
      });

      return workspaceMember;
    });

    return NextResponse.json({
      success: true,
      member: result,
      workspace: result.workspace,
      message: 'Successfully joined workspace'
    });

  } catch (error) {
    console.error('Error accepting workspace invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
