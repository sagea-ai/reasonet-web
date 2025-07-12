import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WorkspaceDetailClient } from "@/components/workspaces/workspace-detail-client";

interface WorkspacePageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const resolvedParams = await params;
  const workspace = await db.workspace.findFirst({
    where: {
      id: resolvedParams.workspaceId,
      OR: [
        { creatorId: user.id },
        {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      ]
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

  if (!workspace) {
    redirect("/workspaces");
  }

  const organizations = await db.organization.findMany({
    where: {
      members: {
        some: {
          userId: user.id
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  const transformedWorkspace = {
    ...workspace,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString()
  };

  return (
    <WorkspaceDetailClient 
      workspace={transformedWorkspace}
      organizations={organizations}
      currentOrganization={workspace.organization}
    />
  );
}
