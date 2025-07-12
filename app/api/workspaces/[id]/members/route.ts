import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Resend } from 'resend';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
});

export async function GET(
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

    // Check if user has access to this workspace
    const userMember = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: {
          clerkId: userId
        }
      }
    });

    if (!userMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const members = await db.workspaceMember.findMany({
      where: {
        workspaceId
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
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER, then VIEWER
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

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
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      try {
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

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.reasonet.sagea.space'}/accept-invite?token=${invitation.token}&org=${workspace.organizationId}`;
        
        await resend.emails.send({
          from: 'Reasonet <noreply@basabjha.com.np>',
          to: email,
          subject: `You're invited to join ${workspace.organization.name} on Reasonet`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0ea5e9; margin: 0;">Reasonet</h1>
              </div>
              
              <h2 style="color: #1f2937; margin-bottom: 20px;">You're invited to join ${workspace.organization.name}</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Hi there! <strong>${inviterName}</strong> has invited you to join the <strong>${workspace.organization.name}</strong> organization on Reasonet through the <strong>${workspace.name}</strong> workspace.
              </p>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
                Reasonet helps teams catch bugs and improve code quality through intelligent analysis and AI-powered insights.
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

        console.log('Organization invitation email sent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to send organization invitation email:', emailError);
        // Don't fail the entire request if email fails
      }

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
