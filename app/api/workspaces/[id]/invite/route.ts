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

    // Send invitation email with workspace context
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Get inviter details
      const inviter = await db.user.findUnique({
        where: { id: requesterMember.userId },
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      });

      const inviterName = inviter 
        ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email
        : 'A team member';

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-workspace-invite?token=${invitation.token}&workspace=${workspaceId}`;
      
      await resend.emails.send({
        from: 'Reasonet <noreply@basabjha.com.np>',
        to: email,
        subject: `You're invited to join ${workspace.name} workspace`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0ea5e9; margin: 0;">Reasonet</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">You're invited to join ${workspace.name}</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              Hi there! <strong>${inviterName}</strong> has invited you to join the <strong>${workspace.name}</strong> workspace in <strong>${workspace.organization.name}</strong> on Reasonet.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
              As a workspace member, you'll be able to collaborate on code analyses, review insights, and work together to improve code quality.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Reasonet. All rights reserved.
            </p>
          </div>
        `
      });

      console.log('Workspace invitation email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send workspace invitation email:', emailError);
      // Don't fail the entire request if email fails
    }

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
