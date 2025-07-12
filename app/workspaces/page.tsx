import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WorkspacesPageClient } from "@/components/workspaces/workspaces-page-client";

export default async function WorkspacesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      hasCompletedOnboarding: true,
      organizationMemberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    },
  });

  if (!user || !user.hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  const organizations = user.organizationMemberships.map(membership => membership.organization);
  const currentOrganization = organizations[0];

  if (!currentOrganization) {
    redirect("/onboarding");
  }

  return (
    <WorkspacesPageClient 
      organizations={organizations}
      currentOrganization={currentOrganization}
    />
  );
}
