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

Your task is to analyze the given strategic decision and provide a structured thought process followed by the analysis.

First, show your thinking process step by step using these markers:
- <thinking>Your step-by-step reasoning</thinking>
- <stakeholder_analysis>How you identify key stakeholders</stakeholder_analysis>
- <outcome_modeling>How you model potential outcomes</outcome_modeling>
- <causal_reasoning>How you build causal chains</causal_reasoning>
- <risk_assessment>How you assess risks</risk_assessment>

Then provide the final analysis as a JSON object with this structure:
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
      "probability": 0-100,
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
          "confidence": 0-100
        }
      ]
    }
  ],
  "riskMatrix": [
    {
      "category": "Risk category",
      "probability": 0-100,
      "impact": 1-10,
      "mitigation": "How to mitigate"
    }
  ],
  "reasoning": "Explanation of your thought process and methodology",
  "confidence": 0-100
}

Focus on business implications, regulatory considerations, market dynamics, and competitive responses. Be concise and actionable.`

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query }
            ],
            temperature: 0.7,
            max_tokens: 4000,
            stream: true,
          })

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Reasoning analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze reasoning' },
      { status: 500 }
    )
  }
}
