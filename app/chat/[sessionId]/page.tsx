import { redirect, notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ChatUI } from '@/components/chat/chat-ui';
import { db } from '@/lib/db';
import { getChatSession } from '@/lib/chat';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { AppLayout } from '@/components/layouts/app-layout';

interface ChatSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = await params;
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

  // Get the chat session
  const session = await getChatSession(sessionId, user.id);
  
  if (!session) {
    notFound();
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
      userId: user.id
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
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 flex h-screen">
        <div className="flex-1 overflow-hidden">
          <ChatUI initialSession={session} />
        </div>
        <ChatHistorySidebar 
          sessions={formattedSessions} 
          organizations={organizations}
          currentOrganization={organizations[0]}
          user={{
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined
          }}
          currentSessionId={sessionId}
        />
      </main>
    </div>
    </AppLayout>
  );
}
