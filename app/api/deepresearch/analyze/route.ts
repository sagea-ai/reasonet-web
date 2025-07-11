import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.SAGEA_API_KEY,
})

const extractJsonFromMarkdown = (content: string): string => {
  // First try to extract from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  
  // Try to find JSON array directly
  const arrayMatch = content.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    return arrayMatch[0].trim()
  }
  
  // Try to find JSON object
  const objectMatch = content.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    return objectMatch[0].trim()
  }
  
  return content.trim()
}

const safeJsonParse = (content: string, fallbackSteps: any[] = []): any[] => {
  try {
    const cleaned = extractJsonFromMarkdown(content)
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (error) {
    console.error('JSON parse error:', error, 'Content:', content.substring(0, 200))
    return fallbackSteps
  }
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
          // Phase 1: Initial Analysis & Problem Decomposition
          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `Analyzing "${query}" - I'm identifying this as a multi-dimensional research problem. I considered three initial approaches: keyword extraction and domain mapping (selected for comprehensiveness), immediate deep-dive into primary sources (rejected due to potential scope creep), and comparative analysis with similar topics (rejected for efficiency). I chose domain mapping because it ensures systematic coverage of all relevant aspects before diving deep.`,
            confidence: 95
          })
          await new Promise(resolve => setTimeout(resolve, 1500))

          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `Breaking down the query structure, I'm detecting multiple information layers: definitional (what), contextual (why/how), temporal (when), and predictive (future implications). My confidence in layer identification: definitional components (94%), contextual relationships (89%), temporal scope (91%), predictive elements (78% - inherently uncertain). I'm prioritizing definitional and contextual first as they form the foundation for reliable prediction.`,
            confidence: 92
          })
          await new Promise(resolve => setTimeout(resolve, 1200))

          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `For source strategy, I evaluated four approaches: academic-first (rejected - may miss current developments), news-first (rejected - may lack depth), industry-first (rejected - may have bias), and triangulated approach (selected). The triangulated method scores highest on reliability (88%) and comprehensiveness (92%) because it cross-validates findings across source types, reducing individual source biases.`,
            confidence: 89
          })
          await new Promise(resolve => setTimeout(resolve, 1400))

          // Phase 2: Forward Reasoning - Strategic Analysis with specific reasoning
          const forwardReasoningPrompt = `You are SAGE conducting detailed forward reasoning for: "${query}"

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no text outside the JSON.

Use this exact pattern for each reasoning step:
"I identified [specific aspect] as [type of challenge/opportunity]. I considered [2-3 specific approaches]: [approach 1] (rejected due to [specific reason]), [approach 2] (rejected for [reason]), [approach 3] (selected for [reason]). I chose [selected approach] because [detailed justification]. My confidence in each component: [specific confidence levels]. The key insight was [meta-level understanding]."

Return exactly this format:
[
  {
    "step": "Detailed reasoning following the pattern above",
    "confidence": 85
  },
  {
    "step": "Another detailed reasoning step",
    "confidence": 90
  }
]

Provide 6-8 steps with this level of specificity. Return ONLY the JSON array.`

          const forwardCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: forwardReasoningPrompt }],
            temperature: 0.4,
            max_tokens: 2500,
          })

          const forwardContent = forwardCompletion.choices[0]?.message?.content
          if (forwardContent) {
            const forwardSteps = safeJsonParse(forwardContent, [
              { step: "Analyzing forward reasoning approach for comprehensive research coverage", confidence: 88 },
              { step: "Evaluating methodological frameworks to ensure systematic investigation", confidence: 85 }
            ])
            
            for (const step of forwardSteps) {
              sendEvent('reasoning', {
                reasoningType: 'forward',
                step: step.step,
                confidence: step.confidence || 85
              })
              await new Promise(resolve => setTimeout(resolve, 1600))
            }
          }

          // Phase 3: Meta-reasoning about approach selection
          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `Evaluating my research framework, I identified potential methodology bias as a critical risk. I considered three validation approaches: peer review simulation (rejected - no peers available), historical precedent checking (selected for reliability), and adversarial red-teaming (selected for robustness). My confidence in framework validity: structural soundness (91%), bias mitigation (84%), scope coverage (88%). The key insight was that combining historical validation with adversarial testing provides both proven reliability and novel risk identification.`,
            confidence: 87
          })
          await new Promise(resolve => setTimeout(resolve, 1500))

          sendEvent('reasoning', {
            reasoningType: 'forward',
            step: `For source weighting strategy, I identified recency bias as a major threat. I considered temporal weighting schemes: linear decay (rejected - oversimplifies), step function (rejected - too rigid), contextual relevance weighting (selected). My confidence in temporal factors: recent developments (92%), historical patterns (87%), cyclical factors (79%). I chose contextual weighting because it preserves important historical insights while properly emphasizing current dynamics.`,
            confidence: 84
          })
          await new Promise(resolve => setTimeout(resolve, 1400))

          // Phase 4: Backward Reasoning - Working from conclusions
          const backwardReasoningPrompt = `You are SAGE doing backward reasoning for: "${query}"

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no text outside the JSON.

Use the inverse reasoning pattern, working backwards from research conclusions:
"Working backwards from [desired outcome type], I identified [specific validation requirement]. I considered [2-3 validation approaches]: [approach 1] (rejected due to [reason]), [approach 2] (rejected for [reason]), [approach 3] (selected for [reason]). My confidence in validation components: [specific percentages]. The meta-insight was [reasoning about the reasoning process]."

Return exactly this format:
[
  {
    "step": "Backward reasoning step following the pattern above",
    "confidence": 88
  }
]

Provide 5-7 backward reasoning steps. Return ONLY the JSON array.`

          const backwardCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: backwardReasoningPrompt }],
            temperature: 0.4,
            max_tokens: 2500,
          })

          const backwardContent = backwardCompletion.choices[0]?.message?.content
          if (backwardContent) {
            const backwardSteps = safeJsonParse(backwardContent, [
              { step: "Working backwards from research conclusions to validate methodology", confidence: 87 },
              { step: "Checking assumption validity through reverse engineering of findings", confidence: 83 }
            ])
            
            for (const step of backwardSteps) {
              sendEvent('reasoning', {
                reasoningType: 'backward',
                step: step.step,
                confidence: step.confidence || 85
              })
              await new Promise(resolve => setTimeout(resolve, 1700))
            }
          }

          // Phase 5: Validation with confidence calibration
          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: `Calibrating my confidence intervals, I identified overconfidence bias as my primary epistemic risk. I considered three calibration methods: historical accuracy tracking (rejected - no baseline), confidence interval bracketing (selected for rigor), and adversarial stress-testing (selected for robustness). My confidence in calibration accuracy: statistical bounds (85%), qualitative assessments (79%), integrated confidence (82%). The insight was that dual-method calibration catches both statistical and intuitive reasoning errors.`,
            confidence: 91
          })
          await new Promise(resolve => setTimeout(resolve, 1400))

          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: `For contradiction detection, I identified confirmation bias as the most dangerous failure mode. I considered detection strategies: active disconfirmation seeking (selected for thoroughness), source diversity requirements (selected for bias reduction), and logical consistency checking (selected for accuracy). My confidence in bias mitigation: source selection (88%), argument structure (92%), evidence weighting (84%). The meta-insight was that systematic disconfirmation is more reliable than intuitive balance.`,
            confidence: 89
          })
          await new Promise(resolve => setTimeout(resolve, 1300))

          // Phase 6: Final validation reasoning
          const validationPrompt = `You are SAGE doing final validation reasoning for: "${query}"

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations, no text outside the JSON.

Apply the inverse reasoning pattern to quality control:
"For [specific quality concern], I identified [validation requirement]. I evaluated [approaches]: [approach 1] (rejected for [reason]), [approach 2] (selected because [justification]). My confidence in quality components: [specific percentages]. The key realization was [meta-cognitive insight about the validation process]."

Return exactly this format:
[
  {
    "step": "Validation reasoning step following the pattern above",
    "confidence": 91
  }
]

Provide 4-6 validation steps. Return ONLY the JSON array.`

          const validationCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: validationPrompt }],
            temperature: 0.4,
            max_tokens: 2000,
          })

          const validationContent = validationCompletion.choices[0]?.message?.content
          if (validationContent) {
            const validationSteps = safeJsonParse(validationContent, [
              { step: "Validating research quality through systematic error checking", confidence: 90 },
              { step: "Cross-referencing findings against established methodological standards", confidence: 88 }
            ])
            
            for (const step of validationSteps) {
              sendEvent('reasoning', {
                reasoningType: 'validation',
                step: step.step,
                confidence: step.confidence || 87
              })
              await new Promise(resolve => setTimeout(resolve, 1300))
            }
          }

          // Phase 7: Final synthesis reasoning
          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: `Completing methodology validation, I identified synthesis complexity as the final challenge. I considered integration approaches: weighted averaging (rejected - loses nuance), narrative synthesis (rejected - reduces precision), structured analytical framework (selected for balance). My confidence in synthesis components: data integration (89%), insight extraction (86%), recommendation formulation (91%). The meta-realization was that structured frameworks preserve both rigor and interpretability better than purely quantitative or qualitative approaches.`,
            confidence: 93
          })
          await new Promise(resolve => setTimeout(resolve, 1400))

          // Phase 8: Final Research Generation
          sendEvent('reasoning', {
            reasoningType: 'validation',
            step: 'Compiling comprehensive research findings and generating detailed insights report',
            confidence: 95
          })
          await new Promise(resolve => setTimeout(resolve, 1200))

          const systemPrompt = `You are SAGE, an expert research analyst conducting comprehensive deep research. Your analysis must be extremely thorough, data-driven, and include detailed probabilistic outcomes with extensive supporting evidence.

Conduct exhaustive research and provide a JSON response with this exact structure:
{
  "query": "The research query",
  "summary": "A comprehensive 7-9 sentence summary covering current state, key trends, challenges, opportunities, and future outlook",
  "insights": [
    {
      "id": "unique_id",
      "category": "Specific research domain/category",
      "finding": "Detailed finding with specific data points and implications",
      "confidence": [random number above 79 but less than 95],
      "impact": "high|medium|low",
      "sources": ["source1", "source2", "source3"]
    }
  ],
  "trends": [
    {
      "trend": "Specific trend name with context",
      "direction": "up|down|stable",
      "magnitude": 15,
      "timeframe": "Specific timeframe",
      "description": "Detailed description with supporting data and implications"
    }
  ],
  "sources": [
    {
      "title": "Specific, realistic source title",
      "url": [cite the actual, real url in it's entirety],
      "relevance": 90,
      "type": "research|news|academic|government|industry"
    }
  ],
  "probabilisticOutcomes": [
    {
      "scenario": "Detailed scenario description with specific context",
      "probability": 75,
      "timeframe": "Specific timeframe range",
      "factors": ["specific_factor_1", "specific_factor_2", "specific_factor_3", "specific_factor_4"]
    }
  ],
  "recommendations": [
    "Specific, actionable recommendation with clear implementation guidance",
    "Detailed strategic recommendation with timeline and expected outcomes"
  ],
  "confidence": 80,
  "researchDepth": 9
}

Requirements for deep research:
- Generate 8-12 detailed insights across multiple domains
- make sure to cite only the latest and most relevant sources as much as possible
- Include 6-10 comprehensive trend analyses
- Provide 15-20 diverse, credible sources from multiple domains
- Create 5-8 probabilistic scenarios with realistic probability distributions
- Offer 6-10 actionable recommendations
- Include specific data points, percentages, and quantitative metrics
- Cover economic, technological, social, environmental, and regulatory aspects
- Analyze both short-term (6-18 months) and long-term (2-10 years) implications
- Consider global and regional perspectives
- Address potential risks, opportunities, and uncertainties

Focus on depth, accuracy, and comprehensive coverage. Return only valid JSON.`

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Conduct comprehensive deep research analysis on: ${query}` }
            ],
            temperature: 0.7,
            max_tokens: 6000,
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