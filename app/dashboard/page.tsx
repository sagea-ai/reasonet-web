import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { 
        hasCompletedOnboarding: true,
        id: true,
        firstName: true,
        lastName: true,
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

    // If user doesn't exist or hasn't completed onboarding, redirect to onboarding
    if (!user || !user.hasCompletedOnboarding) {
      redirect("/onboarding");
    }

    const organizations = user.organizationMemberships.map(membership => membership.organization);
    
    if (organizations.length === 0) {
      // User completed onboarding but has no organizations - redirect back to onboarding
      redirect("/onboarding");
    }
    
    const currentOrganization = organizations[0];

    return (
      <DashboardClientWrapper 
        organizations={organizations}
        currentOrganization={currentOrganization}
      />
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    redirect("/onboarding");
  }
}
