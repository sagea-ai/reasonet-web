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
  IoCheckmarkCircleOutline
} from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { TrialProvider } from '../trial/trial-provider'
import { TrialBannerWrapper } from '../trial/trial-banner-wrapper'

interface Stakeholder {
  name: string
  impact: 'high' | 'medium' | 'low'
  type: 'individual' | 'organization' | 'government' | 'market'
}

interface Outcome {
  id: string
  title: string
  probability: number
  impact: 'positive' | 'negative' | 'neutral'
  description: string
  timeline: string
  stakeholders: string[]
}

interface CausalChain {
  id: string
  sequence: Array<{
    step: number
    event: string
    reasoning: string
    confidence: number
  }>
}

interface RiskMatrix {
  category: string
  probability: number
  impact: number
  mitigation: string
}

interface ReasoningResult {
  stakeholders: Stakeholder[]
  outcomes: Outcome[]
  causalChains: CausalChain[]
  riskMatrix: RiskMatrix[]
  reasoning: string
  confidence: number
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

interface ThoughtProcess {
  thinking: string
  stakeholder_analysis: string
  outcome_modeling: string
  causal_reasoning: string
  risk_assessment: string
}

interface StreamingState {
  isStreaming: boolean
  currentThought: string
  thoughtProcess: ThoughtProcess
  currentSection: keyof ThoughtProcess | null
}

export function ReasoningPageClient({ organizations, currentOrganization, initialPrompt }: ReasoningPageClientProps) {
  const [query, setQuery] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ReasoningResult | null>(null)

  const handleAnalyze = async () => {
    if (!query.trim()) return

    setIsAnalyzing(true)
    setResult(null)

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

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Parse the accumulated content to extract JSON
              const thinkingMatch = accumulatedContent.match(/<thinking>(.*?)<\/thinking>/)
              const jsonMatch = accumulatedContent.match(/\{[\s\S]*\}/)
              
              if (jsonMatch) {
                try {
                  const analysisData = JSON.parse(jsonMatch[0])
                  setResult(analysisData)
                  toast.success('Analysis completed')
                } catch (parseError) {
                  console.error('Failed to parse JSON:', parseError)
                  toast.error('Failed to parse analysis results')
                }
              }
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedContent += parsed.content
              }
            } catch (e) {
              // Ignore parsing errors for individual chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Failed to analyze. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getStakeholderIcon = (type: string) => {
    switch (type) {
      case 'individual': return <IoPersonOutline className="w-4 h-4" />
      case 'organization': return <IoBusinessOutline className="w-4 h-4" />
      case 'government': return <IoGlobeOutline className="w-4 h-4" />
      case 'market': return <IoAnalyticsOutline className="w-4 h-4" />
      default: return <IoPersonOutline className="w-4 h-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getOutcomeColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50'
      case 'negative': return 'text-red-600 bg-red-50'
      case 'neutral': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
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
            <div className="w-24 h-24 bg-sky-50 dark:bg-sky-950/30 rounded-3xl mx-auto flex items-center justify-center border border-sky-200 dark:border-sky-800">
              <IoFlashOutline className="w-12 h-12 text-sky-600 animate-pulse" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                Analyzing scenario
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Mapping stakeholders, outcomes, and causal relationships
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
              {/* Key Stakeholders */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoPersonOutline className="w-6 h-6" />
                  Key Stakeholders
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.stakeholders.map((stakeholder, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                            {getStakeholderIcon(stakeholder.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2 leading-tight">
                              {stakeholder.name}
                            </h3>
                            <Badge className={`text-xs ${getImpactColor(stakeholder.impact)} border`}>
                              {stakeholder.impact} impact
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Potential Outcomes */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoAnalyticsOutline className="w-6 h-6" />
                  Potential Outcomes
                </h2>
                <div className="space-y-4">
                  {result.outcomes.map((outcome) => (
                    <Card key={outcome.id} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {outcome.title}
                              </h3>
                              <Badge className={`text-xs ${getOutcomeColor(outcome.impact)}`}>
                                {outcome.impact}
                              </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                              {outcome.description}
                            </p>
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <span className="flex items-center gap-2">
                                <IoTimeOutline className="w-4 h-4" />
                                {outcome.timeline}
                              </span>
                              <span>Probability: {outcome.probability}%</span>
                            </div>
                          </div>
                          <div className="ml-6 text-right">
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

              {/* Causal Chains */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoArrowForward className="w-6 h-6" />
                  Causal Analysis
                </h2>
                <div className="space-y-8">
                  {result.causalChains.map((chain) => (
                    <Card key={chain.id} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {chain.sequence.map((step, index) => (
                            <div key={step.step} className="flex items-start gap-6">
                              <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-800">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {step.step}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                  {step.event}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                                  {step.reasoning}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  Confidence: {step.confidence}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                  <IoWarningOutline className="w-6 h-6" />
                  Risk Assessment
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {result.riskMatrix.map((risk, index) => (
                    <Card key={index} className="border-0 shadow-sm bg-gray-50/50 dark:bg-gray-950/50">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {risk.category}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {risk.mitigation}
                          </p>
                          <div className="flex gap-3">
                            <Badge variant="outline" className="text-xs">
                              Probability: {risk.probability}%
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Impact: {risk.impact}/10
                            </Badge>
                          </div>
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

      {/* Floating Prompt Bar */}
      <FloatingPromptBar
        prompt={query}
        onPromptChange={setQuery}
        onSubmit={handleAnalyze}
        isLoading={isAnalyzing}
      />
    </div>
  )
}