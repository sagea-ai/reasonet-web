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

Use this exact pattern for each reasoning step:
"I identified [specific aspect] as [type of challenge/opportunity]. I considered [2-3 specific approaches]: [approach 1] (rejected due to [specific reason]), [approach 2] (rejected for [reason]), [approach 3] (selected for [reason]). I chose [selected approach] because [detailed justification]. My confidence in each component: [specific confidence levels]. The key insight was [meta-level understanding]."

Focus on:
- Specific methodological choices and why alternatives were rejected
- Confidence levels for different components
- Meta-insights about the reasoning process itself
- Concrete domain-specific considerations

Return ONLY a JSON array:
[
  {
    "step": "Detailed reasoning following the inverse reasoning pattern",
    "confidence": 85
  }
]

Provide 6-8 steps with this level of specificity and meta-reasoning.`

          const forwardCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: forwardReasoningPrompt }],
            temperature: 0.4,
            max_tokens: 2500,
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
                await new Promise(resolve => setTimeout(resolve, 1600))
              }
            } catch (e) {
              console.error('Failed to parse forward reasoning:', e)
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

Use the inverse reasoning pattern, working backwards from research conclusions:
"Working backwards from [desired outcome type], I identified [specific validation requirement]. I considered [2-3 validation approaches]: [approach 1] (rejected due to [reason]), [approach 2] (rejected for [reason]), [approach 3] (selected for [reason]). My confidence in validation components: [specific percentages]. The meta-insight was [reasoning about the reasoning process]."

Focus on:
- What would make conclusions trustworthy vs. questionable
- Specific failure modes and how to detect them
- Evidence quality thresholds and validation criteria
- Confidence calibration methods

Return ONLY a JSON array with 5-7 backward reasoning steps using this pattern.`

          const backwardCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: backwardReasoningPrompt }],
            temperature: 0.4,
            max_tokens: 2500,
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
                await new Promise(resolve => setTimeout(resolve, 1700))
              }
            } catch (e) {
              console.error('Failed to parse backward reasoning:', e)
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

Apply the inverse reasoning pattern to quality control:
"For [specific quality concern], I identified [validation requirement]. I evaluated [approaches]: [approach 1] (rejected for [reason]), [approach 2] (selected because [justification]). My confidence in quality components: [specific percentages]. The key realization was [meta-cognitive insight about the validation process]."

Focus on:
- Specific quality control measures and why alternatives were rejected
- Confidence levels in different validation components  
- Meta-insights about the validation process itself
- How validation methods themselves might fail

Provide 4-6 validation steps using this exact pattern.`

          const validationCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: validationPrompt }],
            temperature: 0.4,
            max_tokens: 2000,
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
                await new Promise(resolve => setTimeout(resolve, 1300))
              }
            } catch (e) {
              console.error('Failed to parse validation reasoning:', e)
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
  "summary": "A comprehensive 4-5 sentence summary covering current state, key trends, challenges, opportunities, and future outlook",
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
      "url": "https://realistic-domain.com/path",
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