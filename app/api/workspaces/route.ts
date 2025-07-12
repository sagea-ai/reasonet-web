import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  isPrivate: z.boolean().default(false),
  organizationId: z.string(),

  prompt: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const whereClause: any = {
      members: {
        some: {
          user: {
            clerkId: userId
          }
        }
      }
    };

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const workspaces = await db.workspace.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            analyses: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createWorkspaceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, description, icon, isPrivate, organizationId, prompt } = validationResult.data;

    // Verify user is a member of the organization
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orgMember = await db.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId
      }
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const randomSuffix = Math.random().toString(36).substr(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    const workspace = await db.workspace.create({
      data: {
        name,
        description,
        slug,
        icon: icon || '📝',
        isPrivate,
        organizationId,
        creatorId: user.id,
        prompt,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            analyses: true
          }
        }
      }
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
