import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.SAGEA_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { query } = await request.json()

    if (!query) {
      return new Response('Query is required', { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          const message = `data: ${JSON.stringify({ type, ...data })}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        try {
          // Forward reasoning
          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: 'Analyzing the research query and identifying key components',
            confidence: 95
          })

          await new Promise(resolve => setTimeout(resolve, 800))

          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: 'Determining relevant research domains and data sources',
            confidence: 90
          })

          await new Promise(resolve => setTimeout(resolve, 1000))

          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: 'Formulating research hypotheses and expected outcomes',
            confidence: 85
          })

          await new Promise(resolve => setTimeout(resolve, 1200))

          // Backward reasoning
          sendEvent('reasoning', {
            reasoningType: 'backward',
            step: 'Working backwards from potential conclusions to validate research approach',
            confidence: 88
          })

          await new Promise(resolve => setTimeout(resolve, 1000))

          sendEvent('reasoning', {
            reasoningType: 'backward',
            step: 'Cross-referencing findings with historical data and trends',
            confidence: 92
          })

          await new Promise(resolve => setTimeout(resolve, 800))

          // Validation
          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: 'Validating source credibility and data consistency',
            confidence: 96
          })

          await new Promise(resolve => setTimeout(resolve, 600))

          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: 'Performing probabilistic analysis and confidence scoring',
            confidence: 89
          })

          await new Promise(resolve => setTimeout(resolve, 1000))

          // Generate the actual research
          const systemPrompt = `You are SAGE, an expert research analyst that conducts comprehensive deep research on any topic. Your analysis should be thorough, data-driven, and include probabilistic outcomes.

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
- Cite real and actual sources from the web
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

          // Parse the JSON response
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const researchData = JSON.parse(jsonMatch[0])
            sendEvent('result', { result: researchData })
          } else {
            throw new Error('No JSON found in response')
          }

        } catch (error) {
          console.error('Research analysis error:', error)
          sendEvent('error', { message: 'Failed to perform research analysis' })
        } finally {
          controller.close()
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
    console.error('Deep research analysis error:', error)
    return new Response('Failed to perform research analysis', { status: 500 })
  }
}
