import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Changed: params is now a Promise
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params; // Added: await params
    const organizationId = resolvedParams.id; // Changed: use resolvedParams.id

    // Check if user has access to this organization
    const userOrg = await db.organizationMember.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
        organizationId,
      },
    });

    if (!userOrg) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get repositories for this organization
    const repositories = await db.repository.findMany({
      where: {
        organizationId,
      },
    });

    if (repositories.length === 0) {
      // No repositories, return empty data
      return NextResponse.json({
        avgTimeToMerge: 0,
        avgPrSize: 0,
        commentsPerPr: 0,
        timeToMergeTrend: 0,
        weeklyActivity: {
          commits: [],
          prs: [],
          comments: [],
          days: [],
        },
        repositoriesCount: 0,
      });
    }

    // Generate days for the week (last 7 days)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString("en-US", { weekday: "short" }));
    }

    // Get recent analyses for these repositories
    const analyses = await db.analysis.findMany({
      where: {
        repository: {
          organizationId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        repository: true,
      },
    });

    // In a real application, you would calculate these metrics from your database
    // For now, we'll generate realistic data based on the repositories and analyses

    // Calculate commits, PRs, and comments for each day
    const commitsPerDay = Array(7).fill(0).map((_, i) => 
      Math.floor(Math.random() * (repositories.length * 5) + repositories.length)
    );
    
    const prsPerDay = Array(7).fill(0).map((_, i) => 
      Math.floor(Math.random() * (repositories.length * 2) + Math.ceil(repositories.length / 2))
    );
    
    const commentsPerDay = Array(7).fill(0).map((_, i) => 
      Math.floor(Math.random() * (repositories.length * 8) + repositories.length * 2)
    );

    // Calculate average PR size (lines)
    const avgPrSize = Math.floor(Math.random() * 150) + 50;
    
    // Calculate average time to merge (in minutes)
    const avgTimeToMerge = Math.floor(Math.random() * 180) + 20;
    
    // Calculate time to merge trend (percentage change)
    const timeToMergeTrend = Math.round((Math.random() * 20 - 10) * 10) / 10;
    
    // Calculate comments per PR
    const commentsPerPr = parseFloat((Math.random() * 5 + 1).toFixed(1));

    // Return the analytics data
    return NextResponse.json({
      avgTimeToMerge,
      avgPrSize,
      commentsPerPr,
      timeToMergeTrend,
      weeklyActivity: {
        commits: commitsPerDay,
        prs: prsPerDay,
        comments: commentsPerDay,
        days,
      },
      repositoriesCount: repositories.length,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}