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

    const systemPrompt = `You are an expert strategic reasoning AI that maps out the downstream consequences of decisions across law, policy, and product domains for startup founders and VCs.

Analyze the given strategic decision and provide a JSON response with this exact structure:
{
  "stakeholders": [
    {
      "name": "Stakeholder name",
      "impact": "high|medium|low",
      "type": "individual|organization|government|market"
    }
  ],
  "outcomes": [
    {
      "id": "unique_id",
      "title": "Outcome title",
      "probability": 75,
      "impact": "positive|negative|neutral",
      "description": "Detailed description",
      "timeline": "Timeline estimate",
      "stakeholders": ["affected stakeholder names"]
    }
  ],
  "causalChains": [
    {
      "id": "chain_id",
      "sequence": [
        {
          "step": 1,
          "event": "What happens",
          "reasoning": "Why this happens",
          "confidence": 85
        }
      ]
    }
  ],
  "riskMatrix": [
    {
      "category": "Risk category",
      "probability": 60,
      "impact": 7,
      "mitigation": "How to mitigate"
    }
  ],
  "reasoning": "Explanation of your thought process and methodology",
  "confidence": 80
}

Focus on business implications, regulatory considerations, market dynamics, and competitive responses. Be concise and actionable. Return only valid JSON.`

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

    // Try to parse the JSON response
    try {
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