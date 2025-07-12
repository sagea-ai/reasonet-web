import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.SAGEA_API_KEY!,
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
      "verifiableFactors": "Concrete data points that can be fact-checked (e.g., market reports, industry surveys, regulatory changes)",
      "reasoningBacktrack": "Brief explanation of how I arrived at this conclusion, working backwards from the outcome to validate my reasoning process"
    }
  ],
  "backwardReasoning": [
    {
      "scenarioTitle": "The scenario this reasoning applies to",
      "howICameToThisConclusion": "Detailed explanation of how I arrived at this analysis based on the specific statistics and data I found. I considered X market data showing Y trend, which led me to conclude Z. My reasoning process involved analyzing [specific data points] and comparing them to [industry benchmarks/historical patterns]. The key statistics that influenced my conclusion were: [list specific numbers, percentages, growth rates]. Working backwards from the outcome, I validated this by checking [validation steps] and found confidence level of [X]%."
    }
  ],
  "recommendations": "Actionable recommendations based on proven market strategies and real industry success cases",
  "dataDisclaimer": "Note: This analysis is based on available market data and industry trends as of the analysis date. All statistics and projections should be verified with current market research and industry reports."
}

BACKWARD REASONING INSTRUCTIONS:
For each scenario, explain your reasoning process by describing:
1. What specific statistics or data points you analyzed
2. How those statistics led to your conclusion
3. What market trends or patterns you identified
4. How you validated your reasoning by working backwards from the conclusion
5. Your confidence level in the analysis

Be specific about the data sources and numbers that influenced your thinking. Show your work like a researcher explaining their methodology.

IMPORTANT GUIDELINES:
- Use specific percentages, dollar amounts, market sizes, and timeframes when available
- Reference real industry benchmarks and competitor performance
- Ground scenarios in actual market conditions and regulatory environments
- Ensure all claims can be researched and verified by human analysts
- Include market data sources context where relevant (e.g., "based on industry reports", "according to market research")
- Avoid speculation without factual basis
- In backward reasoning, explicitly mention the statistics and data that led to your conclusions

Generate exactly 3 scenarios with corresponding backward reasoning explanations. Be specific, factual, and ensure all analysis can be verified through market research. Return only valid JSON.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = completion.choices[0].message.content

    if (!content) {
      throw new Error('No content received from AI')
    }

    console.log('Raw AI response:', content)

    try {
      const analysisData = JSON.parse(content)
      console.log('Parsed analysis data:', JSON.stringify(analysisData, null, 2))
      return NextResponse.json(analysisData)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw content:', content)
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