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

    const systemPrompt = `You are an expert business strategist and scenario planner with access to real market data and industry insights. You must analyze business ideas/workflows with factual precision and verifiable information.

CRITICAL REQUIREMENTS:
- Base ALL analysis on real market data, industry statistics, and verifiable facts
- Cite specific data points, percentages, market sizes, and timeframes where possible
- Reference actual industry trends, competitor performance, and market conditions
- Provide scenarios that can be fact-checked and verified by human analysts
- Avoid generic statements - be specific about numbers, dates, and sources when possible
- Ground predictions in actual market evidence and historical patterns

Analyze the given business idea/workflow and provide a JSON response with this exact structure:

{
  "businessSummary": "Brief overview with specific market context and relevant industry data",
  "scenarios": [
    {
      "title": "Specific scenario title based on real market conditions",
      "type": "Growth/Challenge/Opportunity/Risk",
      "probability": 75,
      "timeframe": "Short-term/Medium-term/Long-term",
      "description": "Detailed explanation backed by real market data, industry statistics, and verifiable trends",
      "marketData": "Specific statistics, market size, growth rates, or industry benchmarks supporting this scenario",
      "verifiableFactors": "Concrete data points that can be fact-checked (e.g., market reports, industry surveys, regulatory changes)"
    }
  ],
  "backwardReasoning": [
    {
      "finalOutcome": "Specific measurable outcome with quantifiable metrics",
      "requiredConditions": "Conditions backed by industry data and market realities",
      "causalChain": "Step-by-step reasoning with specific data points and market evidence",
      "criticalAssumptions": "Assumptions that can be validated against real market data",
      "riskFactors": "Specific risks backed by industry failure rates, market volatility data, or regulatory precedents",
      "dataSupport": "Key statistics, market research, or industry reports that support this reasoning"
    }
  ],
  "recommendations": "Actionable recommendations based on proven market strategies and real industry success cases",
  "dataDisclaimer": "Note: This analysis is based on available market data and industry trends as of the analysis date. All statistics and projections should be verified with current market research and industry reports."
}

IMPORTANT GUIDELINES:
- Use specific percentages, dollar amounts, market sizes, and timeframes when available
- Reference real industry benchmarks and competitor performance
- Ground scenarios in actual market conditions and regulatory environments
- Ensure all claims can be researched and verified by human analysts
- Include market data sources context where relevant (e.g., "based on industry reports", "according to market research")
- Avoid speculation without factual basis

Generate exactly 3 scenarios with their corresponding backward reasoning. Be specific, factual, and ensure all analysis can be verified through market research. Return only valid JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3, // Reduced temperature for more factual, less creative responses
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