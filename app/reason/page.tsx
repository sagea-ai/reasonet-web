import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReasoningPageClient } from "@/components/reasoning/reasoning-page-client";

interface ReasonPageProps {
  searchParams: Promise<{ prompt?: string }>
}

export default async function ReasonPage({ searchParams }: ReasonPageProps) {
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

  const resolvedSearchParams = await searchParams;

  return (
    <ReasoningPageClient 
      organizations={organizations}
      currentOrganization={currentOrganization}
      initialPrompt={resolvedSearchParams.prompt}
    />
  );
}
