import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { TrialProvider } from '@/components/trial/trial-provider';
import { SimulateClientWrapper } from '@/components/simulate/SimulateClientWrapper';

export default async function SimulatePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
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
    }
  });

  if (!user || !user.hasCompletedOnboarding) {
    redirect('/onboarding');
  }

  const organizations = user.organizationMemberships.map(membership => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug
  }));

  if (organizations.length === 0) {
    redirect('/onboarding');
  }

  return (
    <TrialProvider>
      <SimulateClientWrapper
        organizations={organizations}
        currentOrganization={organizations[0]}
        //@ts-ignore
        user={{
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        }}
      />
    </TrialProvider>
  );
}

