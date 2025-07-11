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

    const systemPrompt = `You are an expert research analyst that conducts comprehensive deep research on any topic. Your analysis should be thorough, data-driven, and include probabilistic outcomes.

Analyze the given topic and provide a JSON response with this exact structure:
{
  "query": "The research query",
  "summary": "A comprehensive 2-3 sentence summary of your findings",
  "insights": [
    {
      "id": "unique_id",
      "category": "Research category",
      "finding": "Key finding or insight",
      "confidence": 85,
      "impact": "high|medium|low",
      "sources": ["source1", "source2"]
    }
  ],
  "trends": [
    {
      "trend": "Trend name",
      "direction": "up|down|stable",
      "magnitude": 15,
      "timeframe": "6-12 months",
      "description": "Description of the trend"
    }
  ],
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "relevance": 90,
      "type": "research|news|academic|government|industry"
    }
  ],
  "probabilisticOutcomes": [
    {
      "scenario": "Scenario description",
      "probability": 75,
      "timeframe": "1-2 years",
      "factors": ["factor1", "factor2", "factor3"]
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ],
  "confidence": 80,
  "researchDepth": 8
}

Focus on:
- Current state and recent developments
- Market trends and statistics
- Future projections with probabilities
- Risk factors and opportunities
- Data-driven insights
- cite real and actual sources. you need to perform and get data fom the web.
- Actionable recommendations

Be thorough, accurate, and provide realistic probability estimates. Return only valid JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Conduct comprehensive research on: ${query}` }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from AI')
    }

    // Try to parse the JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const researchData = JSON.parse(jsonMatch[0])
        return NextResponse.json(researchData)
      } else {
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
    console.error('Deep research analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to perform research analysis' },
      { status: 500 }
    )
  }
}
