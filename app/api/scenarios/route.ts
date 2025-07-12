import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createScenarioSchema = z.object({
  title: z.string().min(1),
  type: z.string(),
  probability: z.number().int().min(0).max(100),
  timeframe: z.string(),
  description: z.string(),
  marketData: z.string().optional(),
  verifiableFactors: z.string().optional(),
  backwardReasoning: z.string().optional(),
  workspaceId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createScenarioSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const {
      title,
      type,
      probability,
      timeframe,
      description,
      marketData,
      verifiableFactors,
      backwardReasoning,
      workspaceId
    } = validationResult.data

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user has access to the workspace
    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId: user.id
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
    }

    // Check if scenario already exists for this workspace
    const existingScenario = await db.scenario.findFirst({
      where: {
        workspaceId,
        title
      }
    })

    if (existingScenario) {
      return NextResponse.json({ error: 'Scenario already saved to this workspace' }, { status: 409 })
    }

    // Create the scenario
    const scenario = await db.scenario.create({
      data: {
        title,
        type,
        probability,
        timeframe,
        description,
        marketData,
        verifiableFactors,
        backwardReasoning,
        workspaceId
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(scenario)
  } catch (error) {
    console.error('Scenario creation error:', error)
    return NextResponse.json(
      { error: 'Failed to save scenario' },
      { status: 500 }
    )
  }
}