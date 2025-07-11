import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ChatUI } from '@/components/chat/chat-ui';
import { db } from '@/lib/db';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { AppLayout } from '@/components/layouts/app-layout';

export default async function ChatPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Verify db is defined
  if (!db) {
    console.error("Database connection failed to initialize");
    return <div className="p-4">Error: Unable to connect to database. Please try again later.</div>;
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
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
    }
  });

  if (!user) {
    redirect('/sign-in');
  }

  // Get user's organizations for the sidebar
  const organizations = user.organizationMemberships.map(membership => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug
  }));

  // Fetch chat sessions
  const chatSessions = await db.chatSession.findMany({
    where: {
      userId: user.id  // Use user.id instead of nested user query
    },
    orderBy: {
      updatedAt: 'desc'
    },
    include: {
      repository: {
        select: {
          name: true,
          fullName: true
        }
      }
    },
    take: 15
  });

  // Transform the sessions to convert null to undefined for prNumber
  const formattedSessions = chatSessions.map(session => ({
    ...session,
    prNumber: session.prNumber === null ? undefined : session.prNumber
  }));

  return (
    <AppLayout
      organizations={organizations}
      currentOrganization={organizations[0]}
      user={{
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      }}
    >
      <div className="flex h-full">
        <div className="flex-1 h-full">
          <ChatUI />
        </div>
        <ChatHistorySidebar 
          sessions={formattedSessions} 
          organizations={organizations}
          currentOrganization={organizations[0]}
          user={{
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined
          }}
        />
      </div>
    </AppLayout>
  );
}
