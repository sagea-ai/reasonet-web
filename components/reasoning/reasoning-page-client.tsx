'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SessionNavBar } from "@/components/ui/sidebar"
import { FloatingPromptBar } from "@/components/simulate/FloatingPromptBar"
import { 
  IoFlashOutline, 
  IoAnalyticsOutline, 
  IoArrowForward,
  IoTimeOutline,
  IoPersonOutline,
  IoBusinessOutline,
  IoGlobeOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline
} from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { TrialProvider } from '../trial/trial-provider'
import { TrialBannerWrapper } from '../trial/trial-banner-wrapper'

interface Scenario {
  title: string
  type: string
  probability: number
  timeframe: string
  description: string
}

interface BackwardReasoning {
  finalOutcome: string
  requiredConditions: string
  causalChain: string
  criticalAssumptions: string
  riskFactors: string
}

interface ReasoningResult {
  businessSummary: string
  scenarios: Scenario[]
  backwardReasoning: BackwardReasoning[]
  recommendations: string
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface ReasoningPageClientProps {
  organizations: Organization[]
  currentOrganization: Organization
  initialPrompt?: string
}

export function ReasoningPageClient({ organizations, currentOrganization, initialPrompt }: ReasoningPageClientProps) {
  const [query, setQuery] = useState(initialPrompt || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ReasoningResult | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

  const handleAnalyze = async () => {
    if (!query.trim()) return

    setIsAnalyzing(true)
    setResult(null)
    setFlippedCards(new Set())

    try {
      const response = await fetch('/api/reasoning/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze')
      }

      const analysisData = await response.json()
      console.log('Received analysis data:', analysisData)
      
      if (analysisData.error) {
        throw new Error(analysisData.error)
      }
      
      setResult(analysisData)
      toast.success('Analysis completed')

    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Failed to analyze. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleAnalyze()
    }
  }, [initialPrompt])

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'growth': return 'text-green-600 bg-green-50 border-green-200'
      case 'challenge': return 'text-red-600 bg-red-50 border-red-200'
      case 'opportunity': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'risk': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const toggleCard = (index: number) => {
    const newFlippedCards = new Set(flippedCards)
    if (newFlippedCards.has(index)) {
      newFlippedCards.delete(index)
    } else {
      newFlippedCards.add(index)
    }
    setFlippedCards(newFlippedCards)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SessionNavBar />
      <TrialProvider>
        <TrialBannerWrapper />
      </TrialProvider>
      
      <div className="max-w-6xl mx-auto px-8 py-16 pb-32">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-2xl mb-8">
            <IoFlashOutline className="w-8 h-8 text-gray-700 dark:text-gray-300" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">
            Strategic Reasoning
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
            Map downstream consequences of strategic decisions for informed planning
          </p>
        </div>

        {/* Empty State */}
        {!result && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-950 rounded-3xl mx-auto flex items-center justify-center border border-gray-200 dark:border-gray-800">
              <IoAnalyticsOutline className="w-12 h-12 text-gray-400" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                Ready to analyze
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Describe your strategic decision or scenario below to begin the analysis
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/30 rounded-3xl mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <IoFlashOutline className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                Analyzing scenario
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Identifying gaps and mapping potential outcomes
              </p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Business Summary */}
              {result.businessSummary && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                    <IoBusinessOutline className="w-6 h-6" />
                    Business Analysis
                  </h2>
                  <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                    <CardContent className="p-6">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {result.businessSummary}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Scenario Cards */}
              {result.scenarios && result.scenarios.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                    <IoAnalyticsOutline className="w-6 h-6" />
                    Potential Scenarios
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.scenarios.map((scenario, index) => {
                      const backwardReasoning = result.backwardReasoning?.[index] || null
                      const isFlipped = flippedCards.has(index)

                      return (
                        <motion.div
                          key={index}
                          className="relative h-80 cursor-pointer"
                          onClick={() => toggleCard(index)}
                          style={{ perspective: '1000px' }}
                        >
                          <motion.div
                            className="relative w-full h-full transition-transform duration-700 preserve-3d"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            {/* Front of card */}
                            <Card className="absolute inset-0 border-0 shadow-sm bg-white dark:bg-gray-950 backface-hidden">
                              <CardContent className="p-6 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                  <Badge className={`text-xs ${getTypeColor(scenario.type)} border`}>
                                    {scenario.type}
                                  </Badge>
                                  <div className="text-right">
                                    <div className="text-2xl font-light text-gray-900 dark:text-white">
                                      {scenario.probability}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {scenario.timeframe}
                                    </div>
                                  </div>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 leading-tight">
                                  {scenario.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed flex-1">
                                  {scenario.description}
                                </p>
                                <div className="mt-4 flex items-center justify-center">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <IoRefreshOutline className="w-4 h-4" />
                                    Click to see reasoning
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Back of card */}
                            <Card className="absolute inset-0 border-0 shadow-sm bg-blue-50 dark:bg-blue-950/30 backface-hidden rotate-y-180">
                              <CardContent className="p-6 h-full flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                  <IoArrowForward className="w-5 h-5 text-blue-600" />
                                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                    Backward Reasoning
                                  </h4>
                                </div>
                                {backwardReasoning ? (
                                  <div className="space-y-3 text-sm flex-1 overflow-y-auto">
                                    {backwardReasoning.finalOutcome && (
                                      <div>
                                        <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                                          Final Outcome:
                                        </div>
                                        <div className="text-blue-700 dark:text-blue-300">
                                          {backwardReasoning.finalOutcome}
                                        </div>
                                      </div>
                                    )}
                                    {backwardReasoning.requiredConditions && (
                                      <div>
                                        <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                                          Required Conditions:
                                        </div>
                                        <div className="text-blue-700 dark:text-blue-300">
                                          {backwardReasoning.requiredConditions}
                                        </div>
                                      </div>
                                    )}
                                    {backwardReasoning.causalChain && (
                                      <div>
                                        <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                                          Causal Chain:
                                        </div>
                                        <div className="text-blue-700 dark:text-blue-300">
                                          {backwardReasoning.causalChain}
                                        </div>
                                      </div>
                                    )}
                                    {backwardReasoning.criticalAssumptions && (
                                      <div>
                                        <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                                          Critical Assumptions:
                                        </div>
                                        <div className="text-blue-700 dark:text-blue-300">
                                          {backwardReasoning.criticalAssumptions}
                                        </div>
                                      </div>
                                    )}
                                    {backwardReasoning.riskFactors && (
                                      <div>
                                        <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                                          Risk Factors:
                                        </div>
                                        <div className="text-blue-700 dark:text-blue-300">
                                          {backwardReasoning.riskFactors}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-blue-700 dark:text-blue-300 text-sm">
                                    No backward reasoning available for this scenario.
                                  </div>
                                )}
                                <div className="mt-4 flex items-center justify-center">
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <IoRefreshOutline className="w-4 h-4" />
                                    Click to see scenario
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                    <IoCheckmarkCircleOutline className="w-6 h-6" />
                    Key Recommendations
                  </h2>
                  <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                    <CardContent className="p-6">
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                          {result.recommendations}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Prompt Bar */}
      <FloatingPromptBar
        prompt={query}
        onPromptChange={setQuery}
        onSubmit={handleAnalyze}
        isLoading={isAnalyzing}
      />

      <style jsx global>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  )
}