import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfilePageClient } from "@/components/profile/profile-page-client";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      hasCompletedOnboarding: true,
      referralCode: true,
      createdAt: true,
      organizationMemberships: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
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
  const currentOrganization = organizations[0]; // Default to first organization

  return (
    <ProfilePageClient 
      user={user}
      organizations={organizations}
      currentOrganization={currentOrganization}
    />
  );
}
