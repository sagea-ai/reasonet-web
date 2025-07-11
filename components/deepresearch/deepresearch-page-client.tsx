'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SessionNavBar } from "@/components/ui/sidebar"
import { useUser } from '@clerk/nextjs'
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

const TypewriterText = ({ text, speed = 30, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
  }, [text])

  return <span>{displayedText}</span>
}

export function DeepResearchPageClient({ organizations, currentOrganization }: DeepResearchPageClientProps) {
  const { user } = useUser()
  const [query, setQuery] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [researchHistory, setResearchHistory] = useState<string[]>([])
  const [reasoning, setReasoning] = useState<ReasoningProcess | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [lastReasoningStep, setLastReasoningStep] = useState<string>('')
  const [reasoningPhase, setReasoningPhase] = useState<'forward' | 'backward' | 'validation' | 'synthesis'>('forward')
  const [currentTypingStep, setCurrentTypingStep] = useState<number | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  const suggestionPrompts = [
    "Digital payment adoption trends in Nepal's rural markets",
    "Impact of cryptocurrency regulations on South Asian fintech",
    "Mobile banking penetration in Nepali agricultural communities",
    "Remittance flow patterns and digital transformation in Nepal",
    "Microfinance digitization opportunities in emerging markets",
    "Cross-border payment solutions for Nepal-India trade",
    "Financial inclusion strategies for unbanked populations",
    "Digital lending platforms in developing economies",
    "Blockchain applications in Nepal's supply chain finance",
    "InsurTech growth potential in South Asian markets",
    "Central bank digital currency implications for Nepal",
    "SME financing gaps in Nepal's digital economy",
    "Financial literacy and digital adoption correlations",
    "Climate finance opportunities in Himalayan regions",
    "Trade finance digitization in landlocked economies"
  ]

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const scrollWidth = carousel.scrollWidth
    const clientWidth = carousel.clientWidth
    
    let animationId: number
    let startTime: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      
      const elapsed = currentTime - startTime
      const progress = (elapsed / 180000) % 1 
      
      const scrollPosition = progress * (scrollWidth - clientWidth)
      carousel.scrollLeft = scrollPosition
      
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

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
    setCurrentTypingStep(null)

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
                    
                    // Set the current typing step to the latest one
                    const allSteps = [
                      ...updated.forwardReasoning,
                      ...updated.backwardReasoning,
                      ...updated.validation
                    ].sort((a, b) => a.timestamp - b.timestamp)
                    setCurrentTypingStep(allSteps.length - 1)
                    
                    return updated
                  })
                } else if (data.type === 'result') {
                  setResult(data.result)
                  setLastReasoningStep('')
                  setCurrentTypingStep(null)
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    const firstName = user?.firstName || 'there'
    
    if (hour >= 5 && hour < 10) {
      return `Good morning, early bird ${firstName}!`
    } else if (hour >= 10 && hour < 12) {
      return `Hello there, ${firstName}!`
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${firstName}!`
    } else if (hour >= 17 && hour < 20) {
      return `Evening vibes, ${firstName}!`
    } else if (hour >= 20 && hour < 23) {
      return `Hey night owl, ${firstName}!`
    } else {
      return `Burning the midnight oil, ${firstName}?`
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
          <h1 className="text-4xl font-bold text-gray-600 dark:text-gray-400 mb-2 tracking-tight">
            {getGreeting()}
          </h1>
        </div>

        {!result && !isResearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 mb-16"
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                Ready to research?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Enter any topic for comprehensive analysis and insights
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleResearch()
                    }
                  }}
                  placeholder="Enter research topic..."
                  className="w-full px-6 py-4 text-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm"
                />
                <button
                  onClick={handleResearch}
                  disabled={!query.trim() || isResearching}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-sky-600 hover:text-sky-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <IoSearchOutline className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Suggestion Pills Carousel */}
            <div className="relative max-w-4xl mx-auto">
              <div 
                ref={carouselRef}
                className="flex gap-3 overflow-x-hidden scrollbar-hide py-2"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                }}
              >
                {[...suggestionPrompts, ...suggestionPrompts].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(prompt)
                      // Optional: automatically focus the search input after setting query
                      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
                      if (searchInput) {
                        searchInput.focus()
                      }
                    }}
                    className="flex-shrink-0 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
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
            <div className="border-l border-gray-200 dark:border-gray-700 pl-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isResearching ? 'Thinking...' : 'Reasoning'}
                </h3>
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <TypewriterText 
                      text={lastReasoningStep} 
                      speed={20}
                    />
                  </p>
                </div>
              )}

              {showReasoning && (
                <div className="space-y-4">
                  {/* All reasoning steps in chronological order */}
                  {[
                    ...reasoning.forwardReasoning,
                    ...reasoning.backwardReasoning,
                    ...reasoning.validation
                  ]
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((step, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                        {currentTypingStep === index ? (
                          <TypewriterText 
                            text={step.step} 
                            speed={15}
                            onComplete={() => setCurrentTypingStep(null)}
                          />
                        ) : (
                          currentTypingStep === null || currentTypingStep < index ? step.step : ''
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
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

      {/* Floating Search Bar for when results are shown */}
      {(result || isResearching) && (
        <DeepResearchSearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleResearch}
          isLoading={isResearching}
        />
      )}
    </div>
  )
}