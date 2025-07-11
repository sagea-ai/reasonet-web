import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(
 request: NextRequest,
 { params }: { params: Promise<{ organizationId: string }> }
) {
 try {
   const { userId } = await auth();

   if (!userId) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const resolvedParams = await params;
   const { organizationId } = resolvedParams;

   const user = await db.user.findUnique({
     where: { clerkId: userId }
   });

   if (!user) {
     return NextResponse.json({ error: 'User not found' }, { status: 404 });
   }

   const userMembership = await db.organizationMember.findFirst({
     where: {
       userId: user.id,
       organizationId
     }
   });

   if (!userMembership) {
     return NextResponse.json({ error: 'Access denied' }, { status: 403 });
   }

   const analyses = await db.analysis.findMany({
     where: {
       userId: user.id,
       repository: {
         organizationId
       }
     },
     include: {
       repository: {
         select: {
           id: true,
           name: true,
           fullName: true,
           language: true,
           githubInstallationId: true
         }
       },
       _count: {
         select: {
           results: true
         }
       }
     },
     orderBy: {
       createdAt: 'desc'
     },
     take: 50
   });

   const  transformed = analyses.map(analysis => ({
     id: analysis.id,
     name: analysis.name,
     status: analysis.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
     type: analysis.type,
     prNumber: analysis.prNumber,
     branch: analysis.branch,
     commit: analysis.commit,
     createdAt: analysis.createdAt.toISOString(),
     updatedAt: analysis.updatedAt.toISOString(),
     completedAt: analysis.completedAt?.toISOString() || null,
     repository: analysis.repository,
     _count: analysis._count,
     options: analysis.options ? {
       gistUrl: (analysis.options as any)?.gistUrl,
       prGist: (analysis.options as any)?.prGist
     } : undefined,
   }));

   return NextResponse.json(transformed);
 } catch (error) {
   console.error('Error fetching organization analyses:', error);
   return NextResponse.json(
     { error: 'Internal server error' },
     { status: 500 }
   );
 }
}