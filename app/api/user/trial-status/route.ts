import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getTrialStatus } from '@/lib/utils/trial'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trialStatus = await getTrialStatus(userId)
    return NextResponse.json(trialStatus)
  } catch (error) {
    console.error('Trial status fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trial status' },
      { status: 500 }
    )
  }
}
