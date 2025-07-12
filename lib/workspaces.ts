import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function getWorkspaces(organizationId?: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return [];
  }

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

  return workspaces;
}

export async function getWorkspace(workspaceId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: {
          user: {
            clerkId: userId
          }
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
      members: {
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
      },
      _count: {
        select: {
          analyses: true
        }
      }
    }
  });

  return workspace;
}

export async function getUserWorkspaceRole(workspaceId: string, userId: string) {
  const member = await db.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: {
        clerkId: userId
      }
    },
    select: {
      role: true
    }
  });

  return member?.role || null;
}
