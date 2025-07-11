import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.SAGEA_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert business strategist and scenario planner that analyzes business ideas and identifies potential gaps and opportunities.

Analyze the given business idea/workflow and provide a JSON response with this exact structure:

{
  "businessSummary": "Brief overview of the business idea",
  "scenarios": [
    {
      "title": "Scenario title",
      "type": "Growth/Challenge/Opportunity/Risk",
      "probability": 75,
      "timeframe": "Short-term/Medium-term/Long-term",
      "description": "Detailed explanation of what could happen"
    }
  ],
  "backwardReasoning": [
    {
      "finalOutcome": "What we're trying to achieve or avoid",
      "requiredConditions": "What needs to be true",
      "causalChain": "Step-by-step reasoning backwards",
      "criticalAssumptions": "Key assumptions this scenario depends on",
      "riskFactors": "What could go wrong"
    }
  ],
  "recommendations": "Key actionable recommendations"
}

Generate exactly 3 scenarios with their corresponding backward reasoning. Be specific and practical. Return only valid JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from AI')
    }

    console.log('Raw AI response:', content)

    try {
      // Try to parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0])
        console.log('Parsed analysis data:', JSON.stringify(analysisData, null, 2))
        return NextResponse.json(analysisData)
      } else {
        console.log('No JSON found in response')
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Reasoning analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze reasoning' },
      { status: 500 }
    )
  }
}