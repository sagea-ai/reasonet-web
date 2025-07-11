import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.SAGEA_API_KEY,
})

const extractJsonFromMarkdown = (content: string): string => {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  return content.trim()
}

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
          // Phase 1: Forward Reasoning
          const forwardReasoningPrompt = `You are SAGE, conducting forward reasoning for research on: "${query}"

Provide your forward reasoning steps as a JSON array. Think step by step about how you would approach this research:
- What are the key components to analyze?
- What domains are relevant?
- What hypotheses should be tested?
- What data sources are needed?

Return ONLY a JSON array of reasoning steps in this format:
[
  {
    "step": "Your reasoning step description",
    "confidence": 85
  }
]

Focus on 3-5 clear, logical forward reasoning steps.`

          const forwardCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: forwardReasoningPrompt }],
            temperature: 0.3,
            max_tokens: 1000,
          })

          const forwardContent = forwardCompletion.choices[0]?.message?.content
          if (forwardContent) {
            try {
              const cleanedForwardContent = extractJsonFromMarkdown(forwardContent)
              const forwardSteps = JSON.parse(cleanedForwardContent)
              for (const step of forwardSteps) {
                sendEvent('reasoning', {
                  reasoningType: 'forward',
                  step: step.step,
                  confidence: step.confidence
                })
                await new Promise(resolve => setTimeout(resolve, 800))
              }
            } catch (e) {
              console.error('Failed to parse forward reasoning:', e)
              console.error('Raw content:', forwardContent)
            }
          }

          // Phase 2: Backward Reasoning
          const backwardReasoningPrompt = `You are SAGE, conducting backward reasoning for research on: "${query}"

Now work backwards from potential conclusions. Think about:
- What would successful research outcomes look like?
- What evidence would support different conclusions?
- How can we validate our approach?
- What biases or gaps might exist?

Return ONLY a JSON array of reasoning steps in this format:
[
  {
    "step": "Your backward reasoning step description",
    "confidence": 88
  }
]

Focus on 3-4 clear backward reasoning steps.`

          const backwardCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: backwardReasoningPrompt }],
            temperature: 0.3,
            max_tokens: 1000,
          })

          const backwardContent = backwardCompletion.choices[0]?.message?.content
          if (backwardContent) {
            try {
              const cleanedBackwardContent = extractJsonFromMarkdown(backwardContent)
              const backwardSteps = JSON.parse(cleanedBackwardContent)
              for (const step of backwardSteps) {
                sendEvent('reasoning', {
                  reasoningType: 'backward',
                  step: step.step,
                  confidence: step.confidence
                })
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            } catch (e) {
              console.error('Failed to parse backward reasoning:', e)
              console.error('Raw content:', backwardContent)
            }
          }

          // Phase 3: Validation Reasoning
          const validationPrompt = `You are SAGE, conducting validation reasoning for research on: "${query}"

Now validate your research approach:
- How will you ensure source credibility?
- What methods will verify data consistency?
- How will you handle conflicting information?
- What confidence scoring methods will you use?

Return ONLY a JSON array of reasoning steps in this format:
[
  {
    "step": "Your validation reasoning step description",
    "confidence": 92
  }
]

Focus on 2-3 clear validation steps.`

          const validationCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: validationPrompt }],
            temperature: 0.3,
            max_tokens: 800,
          })

          const validationContent = validationCompletion.choices[0]?.message?.content
          if (validationContent) {
            try {
              const cleanedValidationContent = extractJsonFromMarkdown(validationContent)
              const validationSteps = JSON.parse(cleanedValidationContent)
              for (const step of validationSteps) {
                sendEvent('reasoning', {
                  reasoningType: 'validation',
                  step: step.step,
                  confidence: step.confidence
                })
                await new Promise(resolve => setTimeout(resolve, 600))
              }
            } catch (e) {
              console.error('Failed to parse validation reasoning:', e)
              console.error('Raw content:', validationContent)
            }
          }

          // Phase 4: Generate the actual research
          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: 'Synthesizing research findings and generating comprehensive analysis...',
            confidence: 95
          })

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
