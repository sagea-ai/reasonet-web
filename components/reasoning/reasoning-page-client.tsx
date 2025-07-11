'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SessionNavBar } from "@/components/ui/sidebar"
import { FaNetworkWired } from "react-icons/fa6";
import { 
  IoSend, 
  IoFlashOutline, 
  IoAnalyticsOutline, 
  IoArrowForward,
  IoArrowBack,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoBusinessOutline,
  IoGlobeOutline,
  IoPauseOutline,
  IoPlayOutline,
  IoStopOutline
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

export function ReasoningPageClient({ organizations, currentOrganization }: ReasoningPageClientProps) {
  const [query, setQuery] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ReasoningResult | null>(null)
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [showInverseReasoning, setShowInverseReasoning] = useState(false)
  const [history, setHistory] = useState<Array<{ query: string; result: ReasoningResult; timestamp: Date }>>([])
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentThought: '',
    thoughtProcess: {
      thinking: '',
      stakeholder_analysis: '',
      outcome_modeling: '',
      causal_reasoning: '',
      risk_assessment: ''
    },
    currentSection: null
  })
  const [isPaused, setIsPaused] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleAnalyze = async () => {
    if (!query.trim()) return

    setIsAnalyzing(true)
    setResult(null)
    setStreamingState({
      isStreaming: true,
      currentThought: '',
      thoughtProcess: {
        thinking: '',
        stakeholder_analysis: '',
        outcome_modeling: '',
        causal_reasoning: '',
        risk_assessment: ''
      },
      currentSection: null
    })

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/reasoning/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentSection: keyof ThoughtProcess | null = null
      let thoughtProcess = { ...streamingState.thoughtProcess }
      let jsonBuffer = ''
      let isCollectingJson = false

      if (reader) {
        while (true) {
          if (isPaused) {
            await new Promise(resolve => {
              const checkPause = () => {
                if (!isPaused) {
                  resolve(undefined)
                } else {
                  setTimeout(checkPause, 100)
                }
              }
              checkPause()
            })
          }

          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                setStreamingState(prev => ({ ...prev, isStreaming: false }))
                
                if (jsonBuffer) {
                  try {
                    const result = JSON.parse(jsonBuffer)
                    setResult(result)
                    setHistory(prev => [...prev, { query, result, timestamp: new Date() }])
                    toast.success('Analysis completed')
                  } catch (e) {
                    toast.error('Failed to parse analysis results')
                  }
                }
                continue
              }

              try {
                const chunk = JSON.parse(data)
                const content = chunk.content

                // Check for JSON start
                if (content.includes('{') && !isCollectingJson) {
                  isCollectingJson = true
                  jsonBuffer = content
                } else if (isCollectingJson) {
                  jsonBuffer += content
                } else {
                  // Process thinking sections
                  if (content.includes('<thinking>')) {
                    currentSection = 'thinking'
                    thoughtProcess.thinking = content.replace('<thinking>', '')
                  } else if (content.includes('<stakeholder_analysis>')) {
                    currentSection = 'stakeholder_analysis'
                    thoughtProcess.stakeholder_analysis = content.replace('<stakeholder_analysis>', '')
                  } else if (content.includes('<outcome_modeling>')) {
                    currentSection = 'outcome_modeling'
                    thoughtProcess.outcome_modeling = content.replace('<outcome_modeling>', '')
                  } else if (content.includes('<causal_reasoning>')) {
                    currentSection = 'causal_reasoning'
                    thoughtProcess.causal_reasoning = content.replace('<causal_reasoning>', '')
                  } else if (content.includes('<risk_assessment>')) {
                    currentSection = 'risk_assessment'
                    thoughtProcess.risk_assessment = content.replace('<risk_assessment>', '')
                  } else if (content.includes('</thinking>') || content.includes('</stakeholder_analysis>') || 
                           content.includes('</outcome_modeling>') || content.includes('</causal_reasoning>') || 
                           content.includes('</risk_assessment>')) {
                    currentSection = null
                  } else if (currentSection) {
                    thoughtProcess[currentSection] += content
                  }

                  setStreamingState(prev => ({
                    ...prev,
                    currentThought: prev.currentThought + content,
                    thoughtProcess: { ...thoughtProcess },
                    currentSection
                  }))
                }
              } catch (e) {
                // Continue processing
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Analysis failed:', error)
        toast.error('Failed to analyze. Please try again.')
      }
    } finally {
      setIsAnalyzing(false)
      setStreamingState(prev => ({ ...prev, isStreaming: false }))
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsAnalyzing(false)
    setStreamingState(prev => ({ ...prev, isStreaming: false }))
  }

  const ThoughtProcessDisplay = () => {
    if (!streamingState.isStreaming && !streamingState.currentThought) return null

    const sections = [
      { key: 'thinking', title: 'Initial Analysis', icon: IoFlashOutline, color: 'text-blue-600' },
      { key: 'stakeholder_analysis', title: 'Stakeholder Mapping', icon: IoPersonOutline, color: 'text-green-600' },
      { key: 'outcome_modeling', title: 'Outcome Modeling', icon: IoAnalyticsOutline, color: 'text-purple-600' },
      { key: 'causal_reasoning', title: 'Causal Chain Analysis', icon: IoArrowForward, color: 'text-orange-600' },
      { key: 'risk_assessment', title: 'Risk Assessment', icon: IoWarningOutline, color: 'text-red-600' },
    ]

    return (
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Live Reasoning
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isPaused ? <IoPlayOutline className="h-4 w-4" /> : <IoPauseOutline className="h-4 w-4" />}
              </Button>
              {streamingState.isStreaming && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStop}
                  className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <IoStopOutline className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map(({ key, title, icon: Icon, color }) => {
            const content = streamingState.thoughtProcess[key as keyof ThoughtProcess]
            const isActive = streamingState.currentSection === key
            const isCompleted = content && !isActive
            
            if (!content && !isActive) return null

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 
                    isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 
                    'bg-gray-50 dark:bg-gray-900'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-600'
                    }`}>
                      {title}
                    </span>
                    {isActive && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">Analyzing...</span>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="flex items-center gap-2 mt-1">
                        <IoCheckmarkCircleOutline className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Complete</span>
                      </div>
                    )}
                  </div>
                </div>
                {content && (
                  <div className="ml-12 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {content}
                      {isActive && <span className="animate-pulse">|</span>}
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  const getStakeholderIcon = (type: string) => {
    switch (type) {
      case 'individual': return <IoPersonOutline className="h-4 w-4" />
      case 'organization': return <IoBusinessOutline className="h-4 w-4" />
      case 'government': return <IoGlobeOutline className="h-4 w-4" />
      case 'market': return <IoAnalyticsOutline className="h-4 w-4" />
      default: return <IoPersonOutline className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getOutcomeColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200'
      case 'negative': return 'bg-red-100 text-red-800 border-red-200'
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionNavBar />
      <TrialProvider>
        <TrialBannerWrapper />
      </TrialProvider>
      
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <FaNetworkWired className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Strategic Reasoning
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Map downstream consequences of strategic decisions for informed planning
          </p>
        </div>

        {/* Query Input */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Input
                placeholder="What happens if Khalti expands into crypto remittances?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
                className="flex-1 h-10 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !query.trim()}
                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <IoSend className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Thought Process */}
        <ThoughtProcessDisplay />

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Analysis Toggle */}
              <div className="flex justify-center">
                <div className="flex bg-white dark:bg-gray-950 p-1 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                  <Button
                    variant={!showInverseReasoning ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowInverseReasoning(false)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      !showInverseReasoning 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IoArrowForward className="h-4 w-4 mr-1" />
                    Analysis Results
                  </Button>
                  <Button
                    variant={showInverseReasoning ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowInverseReasoning(true)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      showInverseReasoning 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IoArrowBack className="h-4 w-4 mr-1" />
                    Methodology
                  </Button>
                </div>
              </div>

              {/* Results Grid */}
              {!showInverseReasoning && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Stakeholders */}
                  <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <IoPersonOutline className="h-5 w-5" />
                        Key Stakeholders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.stakeholders.map((stakeholder, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800"
                          >
                            <div className="p-2 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
                              {getStakeholderIcon(stakeholder.type)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white text-sm">{stakeholder.name}</div>
                              <Badge
                                variant="secondary"
                                className={`text-xs mt-1 ${getImpactColor(stakeholder.impact)}`}
                              >
                                {stakeholder.impact} impact
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Outcomes */}
                  <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <IoAnalyticsOutline className="h-5 w-5" />
                        Potential Outcomes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.outcomes.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">{outcome.title}</h3>
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${getOutcomeColor(outcome.impact)}`}
                                  >
                                    {outcome.impact}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                  {outcome.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <IoTimeOutline className="h-3 w-3" />
                                    {outcome.timeline}
                                  </span>
                                  <span>Probability: {outcome.probability}%</span>
                                </div>
                              </div>
                              <div className="ml-4 w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-800">
                                <span className="text-xs font-medium text-blue-600">
                                  {outcome.probability}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Causal Chains & Risk Assessment */}
              {!showInverseReasoning && (
                <div className="space-y-6">
                  {/* Causal Chains */}
                  <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <IoArrowForward className="h-5 w-5" />
                        Causal Chains
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {result.causalChains.map((chain) => (
                          <div key={chain.id} className="space-y-4">
                            {chain.sequence.map((step, index) => (
                              <div key={step.step} className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-800">
                                  <span className="text-xs font-medium text-blue-600">
                                    {step.step}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">{step.event}</div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    {step.reasoning}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    Confidence: {step.confidence}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Assessment */}
                  <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <IoWarningOutline className="h-5 w-5" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.riskMatrix.map((risk, index) => (
                          <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">{risk.category}</div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{risk.mitigation}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Badge variant="outline" className="text-xs">
                                  {risk.probability}%
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Impact: {risk.impact}/10
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Methodology */}
              {showInverseReasoning && (
                <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <IoInformationCircleOutline className="h-5 w-5" />
                      Analysis Methodology
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Reasoning Process</h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {result.reasoning}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                            <IoCheckmarkCircleOutline className="h-4 w-4" />
                            Methodology
                          </h4>
                          <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                            <li>• Market dynamics analysis</li>
                            <li>• Stakeholder impact mapping</li>
                            <li>• Regulatory environment review</li>
                            <li>• Competitive response modeling</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2">
                            <IoWarningOutline className="h-4 w-4" />
                            Limitations
                          </h4>
                          <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                            <li>• Based on current market conditions</li>
                            <li>• Assumes rational market behavior</li>
                            <li>• Cannot predict external shocks</li>
                            <li>• Confidence: {result.confidence}%</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}