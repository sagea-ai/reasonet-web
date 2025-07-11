import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OrganizationPageClient } from "@/components/organization/organization-page-client";

export default async function OrganizationPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      organizationMemberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              website: true,
              companySize: true,
              industry: true,
              createdAt: true,
              _count: {
                select: {
                  members: true,
                  repositories: true,
                }
              }
            }
          }
        }
      }
    },
  });

  if (!user || !user.hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  const organizations = user.organizationMemberships.map(membership => ({
    ...membership.organization,
    userRole: membership.role
  }));
  const currentOrganization = organizations[0]; // Default to first organization

  if (!currentOrganization) {
    redirect("/onboarding");
  }

  return (
    <OrganizationPageClient 
      organization={currentOrganization}
      organizations={organizations}
      currentOrganization={currentOrganization}
    />
  );
}

