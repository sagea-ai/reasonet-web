'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SessionNavBar } from "@/components/ui/sidebar"
import { 
  IoSearchOutline, 
  IoAnalyticsOutline, 
  IoTimeOutline,
  IoDocumentTextOutline,
  IoTrendingUpOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoFlashOutline
} from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { TrialProvider } from '../trial/trial-provider'
import { TrialBannerWrapper } from '../trial/trial-banner-wrapper'
import { DeepResearchSearchBar } from './deepresearch-search-bar'

interface Source {
  title: string
  url: string
  relevance: number
  type: 'research' | 'news' | 'academic' | 'government' | 'industry'
}

interface ResearchInsight {
  id: string
  category: string
  finding: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  sources: string[]
}

interface TrendAnalysis {
  trend: string
  direction: 'up' | 'down' | 'stable'
  magnitude: number
  timeframe: string
  description: string
}

interface ResearchResult {
  query: string
  summary: string
  insights: ResearchInsight[]
  trends: TrendAnalysis[]
  sources: Source[]
  probabilisticOutcomes: Array<{
    scenario: string
    probability: number
    timeframe: string
    factors: string[]
  }>
  recommendations: string[]
  confidence: number
  researchDepth: number
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface DeepResearchPageClientProps {
  organizations: Organization[]
  currentOrganization: Organization
}

interface ReasoningStep {
  type: 'forward' | 'backward' | 'validation'
  step: string
  confidence: number
  timestamp: number
}

interface ReasoningProcess {
  userPrompt: string
  forwardReasoning: ReasoningStep[]
  backwardReasoning: ReasoningStep[]
  validation: ReasoningStep[]
}

export function DeepResearchPageClient({ organizations, currentOrganization }: DeepResearchPageClientProps) {
  const [query, setQuery] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [researchHistory, setResearchHistory] = useState<string[]>([])
  const [reasoning, setReasoning] = useState<ReasoningProcess | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [lastReasoningStep, setLastReasoningStep] = useState<string>('')
  const [reasoningPhase, setReasoningPhase] = useState<'forward' | 'backward' | 'validation' | 'synthesis'>('forward')

  const handleResearch = async () => {
    if (!query.trim()) return

    setIsResearching(true)
    setResult(null)
    setReasoning({
      userPrompt: query,
      forwardReasoning: [],
      backwardReasoning: [],
      validation: []
    })
    setLastReasoningStep('Initializing research process...')
    setReasoningPhase('forward')

    try {
      const response = await fetch('/api/deepresearch/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Failed to perform research')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'reasoning') {
                  setLastReasoningStep(data.step)
                  setReasoningPhase(data.reasoningType)
                  setReasoning(prev => {
                    if (!prev) return prev
                    const newStep: ReasoningStep = {
                      type: data.reasoningType,
                      step: data.step,
                      confidence: data.confidence || 0,
                      timestamp: Date.now()
                    }
                    
                    const updated = { ...prev }
                    if (data.reasoningType === 'forward') {
                      updated.forwardReasoning = [...prev.forwardReasoning, newStep]
                    } else if (data.reasoningType === 'backward') {
                      updated.backwardReasoning = [...prev.backwardReasoning, newStep]
                    } else if (data.reasoningType === 'validation') {
                      updated.validation = [...prev.validation, newStep]
                    }
                    return updated
                  })
                } else if (data.type === 'result') {
                  setResult(data.result)
                  setLastReasoningStep('')
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e)
              }
            }
          }
        }
      }

      setResearchHistory(prev => [query, ...prev.slice(0, 9)])
      toast.success('Research completed')
    } catch (error) {
      console.error('Research failed:', error)
      toast.error('Failed to perform research. Please try again.')
    } finally {
      setIsResearching(false)
    }
  }

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'forward': return 'Analyzing forward reasoning'
      case 'backward': return 'Validating backward reasoning'
      case 'validation': return 'Performing validation checks'
      case 'synthesis': return 'Synthesizing findings'
      default: return 'Processing'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <IoWarningOutline className="w-4 h-4 text-red-500" />
      case 'medium': return <IoInformationCircleOutline className="w-4 h-4 text-yellow-500" />
      case 'low': return <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500" />
      default: return <IoInformationCircleOutline className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '→'
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SessionNavBar 
        organizations={organizations}
        currentOrganization={currentOrganization}
      />
      <TrialProvider>
        <TrialBannerWrapper />
      </TrialProvider>
      
      <div className="max-w-6xl mx-auto px-8 py-16 pb-32">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-2xl mb-8">
            <IoSearchOutline className="w-8 h-8 text-gray-700 dark:text-gray-300" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-4 tracking-tight">
            Deep Research
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
            Comprehensive analysis and probabilistic insights on any topic
          </p>
        </div>

        {/* User Query Display */}
        {reasoning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-medium">Q</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Research Query</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {reasoning.userPrompt}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reasoning Process */}
        {reasoning && (isResearching || reasoning.forwardReasoning.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isResearching ? 'Thinking...' : 'Reasoning'}
                </h3>
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showReasoning ? (
                    <IoChevronUpOutline className="w-4 h-4" />
                  ) : (
                    <IoChevronDownOutline className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Current step when processing */}
              {isResearching && lastReasoningStep && (
                <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {lastReasoningStep}
                  </p>
                </div>
              )}

              {showReasoning && (
                <div className="space-y-3">
                  {/* All reasoning steps in chronological order */}
                  {[
                    ...reasoning.forwardReasoning,
                    ...reasoning.backwardReasoning,
                    ...reasoning.validation
                  ]
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((step, index) => (
                      <div key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {step.step}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!result && !isResearching && (
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
                Ready to research
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Enter any topic for comprehensive analysis and insights
              </p>
            </div>

            {/* Recent Searches */}
            {researchHistory.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent searches</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {researchHistory.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {isResearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-24 h-24 bg-sky-50 dark:bg-sky-950/30 rounded-3xl mx-auto flex items-center justify-center border border-sky-200 dark:border-sky-800">
              <IoSearchOutline className="w-12 h-12 text-sky-600 animate-pulse" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                Researching topic
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Analyzing data sources and generating insights
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
              {/* Summary */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                    Research Summary
                  </h2>
                  <div className="flex items-center gap-4">
                    <Badge className={`${getConfidenceColor(result.confidence)} border`}>
                      {result.confidence}% confidence
                    </Badge>
                    <Badge variant="outline">
                      Depth: {result.researchDepth}/10
                    </Badge>
                  </div>
                </div>
                <Card className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                  <CardContent className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {result.summary}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoAnalyticsOutline className="w-6 h-6" />
                  Key Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.insights.map((insight) => (
                    <Card key={insight.id} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-3">
                          {getImpactIcon(insight.impact)}
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                              {insight.category}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                              {insight.finding}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                            {insight.confidence}% confidence
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {insight.sources.length} sources
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoTrendingUpOutline className="w-6 h-6" />
                  Trend Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.trends.map((trend, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{getTrendIcon(trend.direction)}</span>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {trend.trend}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed">
                          {trend.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Magnitude: {trend.magnitude}%</span>
                          <span>{trend.timeframe}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Probabilistic Outcomes */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoTimeOutline className="w-6 h-6" />
                  Probabilistic Outcomes
                </h2>
                <div className="space-y-4">
                  {result.probabilisticOutcomes.map((outcome, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                              {outcome.scenario}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {outcome.factors.map((factor, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{outcome.timeframe}</span>
                          </div>
                          <div className="ml-6 text-center">
                            <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-800">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {outcome.probability}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoDocumentTextOutline className="w-6 h-6" />
                  Sources
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.sources.map((source, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">
                              {source.title}
                            </h4>
                            <a 
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-sky-600 hover:text-sky-800 break-all"
                            >
                              {source.url}
                            </a>
                          </div>
                          <div className="ml-3 flex flex-col items-end">
                            <Badge variant="outline" className="text-xs mb-1">
                              {source.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {source.relevance}% relevance
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                  Recommendations
                </h2>
                <div className="space-y-3">
                  {result.recommendations.map((recommendation, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
                              {index + 1}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Search Bar */}
      <DeepResearchSearchBar
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleResearch}
        isLoading={isResearching}
      />
    </div>
  )
}