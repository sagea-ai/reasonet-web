import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createActivitySchema = z.object({
  content: z.object({
    html: z.string(),
    text: z.string(),
    mentions: z.array(z.string())
  }),
  mentions: z.array(z.string()),
  parentId: z.string().optional(),
  level: z.number().default(0)
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
    const member = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: {
          clerkId: userId
        }
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const activities = await db.workspaceActivity.findMany({
      where: {
        workspaceId,
        parentId: null // Only get top-level activities
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    imageUrl: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching workspace activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
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

    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this workspace
    const member = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createActivitySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { content, mentions, parentId, level } = validationResult.data;

    // Create the activity
    const activity = await db.workspaceActivity.create({
      data: {
        content,
        workspaceId,
        authorId: user.id,
        parentId,
        level
      },
      include: {
        author: {
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
            name: true
          }
        }
      }
    });

    // Create mentions
    if (mentions.length > 0) {
      await db.workspaceActivityMention.createMany({
        data: mentions.map(userId => ({
          activityId: activity.id,
          userId
        }))
      });

      const mentionedMembers = await db.workspaceMember.findMany({
        where: {
          workspaceId,
          userId: { in: mentions }
        },
        include: {
          user: true
        }
      });

      const notifications = mentionedMembers.map(member => ({
        userId: member.userId,
        type: 'WORKSPACE_MENTION' as const,
        title: 'You were mentioned',
        content: `${user.firstName || user.email} mentioned you in ${activity.workspace.name}`,
        workspaceId,
        activityId: activity.id,
        data: {
          authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          workspaceName: activity.workspace.name,
          activityContent: content.text.substring(0, 100)
        }
      }));

      if (notifications.length > 0) {
        await db.userNotification.createMany({
          data: notifications
        });
      }
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error creating workspace activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
