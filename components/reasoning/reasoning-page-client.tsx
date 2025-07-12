'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionNavBar } from "@/components/ui/sidebar"
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
  IoRefreshOutline,
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoShieldCheckmarkOutline,
  IoAlertCircleOutline,
  IoDocumentTextOutline,
  IoBarChartOutline,
  IoBulbOutline
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
  marketData?: string
  verifiableFactors?: string
  reasoningBacktrack?: string
}

interface BackwardReasoning {
  scenarioTitle: string
  howICameToThisConclusion: string
}

interface ReasoningResult {
  businessSummary: string
  scenarios: Scenario[]
  backwardReasoning: BackwardReasoning[]
  recommendations: string
  dataDisclaimer?: string
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
  autoAnalyze?: boolean
}

export function ReasoningPageClient({ 
  organizations, 
  currentOrganization, 
  initialPrompt, 
  autoAnalyze = false 
}: ReasoningPageClientProps) {
  const [query, setQuery] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ReasoningResult | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

  // Handle workflow data from sessionStorage
  useEffect(() => {
    const workflowData = sessionStorage.getItem('workflowData')
    if (workflowData) {
      try {
        const data = JSON.parse(workflowData)
        setQuery(data.prompt)
        // Clear the data after using it
        sessionStorage.removeItem('workflowData')
        
        // Auto-trigger analysis if autoAnalyze is true
        if (autoAnalyze) {
          // Small delay to ensure state is set
          setTimeout(() => {
            handleAnalyzeWithPrompt(data.prompt)
          }, 100)
        }
      } catch (error) {
        console.error('Error parsing workflow data:', error)
      }
    } else if (initialPrompt) {
      setQuery(initialPrompt)
      if (autoAnalyze) {
        setTimeout(() => {
          handleAnalyzeWithPrompt(initialPrompt)
        }, 100)
      }
    }
  }, [initialPrompt, autoAnalyze])

  const handleAnalyzeWithPrompt = async (promptText: string) => {
    if (!promptText.trim()) return

    setIsAnalyzing(true)
    setResult(null)
    setFlippedCards(new Set())

    try {
      const response = await fetch('/api/reasoning/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: promptText }),
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

  const toggleCard = (index: number) => {
    const newFlippedCards = new Set(flippedCards)
    if (newFlippedCards.has(index)) {
      newFlippedCards.delete(index)
    } else {
      newFlippedCards.add(index)
    }
    setFlippedCards(newFlippedCards)
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'growth': return <IoTrendingUpOutline className="w-5 h-5" />
      case 'challenge': return <IoAlertCircleOutline className="w-5 h-5" />
      case 'opportunity': return <IoCheckmarkCircleOutline className="w-5 h-5" />
      case 'risk': return <IoWarningOutline className="w-5 h-5" />
      default: return <IoAnalyticsOutline className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'growth': return 'bg-green-50 text-green-700 border-green-200'
      case 'challenge': return 'bg-red-50 text-red-700 border-red-200'
      case 'opportunity': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'risk': return 'bg-orange-50 text-orange-700 border-orange-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-red-600'
    if (probability >= 60) return 'text-orange-600'
    if (probability >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionNavBar />
      <TrialProvider>
        <TrialBannerWrapper />
      </TrialProvider>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <IoFlashOutline className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Strategic Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                AI-powered workflow scenario analysis and recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <IoFlashOutline className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analyzing Your Workflow
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Processing scenarios and generating insights...
            </p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <IoBusinessOutline className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="scenarios" className="flex items-center gap-2">
                    <IoBarChartOutline className="w-4 h-4" />
                    Scenarios & Reasoning
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="flex items-center gap-2">
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    Actions
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {result.businessSummary && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IoBusinessOutline className="w-5 h-5 text-blue-600" />
                          Business Analysis Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {result.businessSummary}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Scenarios</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {result.scenarios?.length || 0}
                            </p>
                          </div>
                          <IoStatsChartOutline className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Probability</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {result.scenarios?.length > 0 
                                ? Math.round(result.scenarios.reduce((sum, s) => sum + s.probability, 0) / result.scenarios.length)
                                : 0}%
                            </p>
                          </div>
                          <IoAnalyticsOutline className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">High Risk</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {result.scenarios?.filter(s => s.probability >= 70).length || 0}
                            </p>
                          </div>
                          <IoWarningOutline className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Scenarios & Reasoning Tab */}
                <TabsContent value="scenarios" className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
                    {result.scenarios?.map((scenario, index) => {
                      const reasoning = result.backwardReasoning?.find(r => r.scenarioTitle === scenario.title)
                      const isFlipped = flippedCards.has(index)

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative cursor-pointer h-[500px]"
                          onClick={() => toggleCard(index)}
                          style={{ perspective: '1000px' }}
                        >
                          <motion.div
                            className="relative w-full h-full transition-transform duration-700 preserve-3d"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            {/* Front of card - Scenario */}
                            <Card className="absolute inset-0 border-0 shadow-sm bg-white dark:bg-gray-800 backface-hidden overflow-hidden">
                              <CardHeader className="pb-4 flex-shrink-0">
                                <div className="flex items-start justify-between">
                                  <Badge className={`${getTypeColor(scenario.type)} border text-xs font-medium w-fit`}>
                                    <span className="flex items-center gap-1">
                                      {getTypeIcon(scenario.type)}
                                      {scenario.type}
                                    </span>
                                  </Badge>
                                  <div className="text-right">
                                    <div className={`text-xl font-bold ${getProbabilityColor(scenario.probability)}`}>
                                      {scenario.probability}%
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <IoTimeOutline className="w-3 h-3" />
                                      {scenario.timeframe}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="flex flex-col h-full overflow-hidden">
                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 leading-tight">
                                    {scenario.title}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                                    {scenario.description}
                                  </p>
                                  
                                  {scenario.marketData && (
                                    <div className="border-t pt-3 mb-3">
                                      <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                                        Market Data
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {scenario.marketData}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {scenario.verifiableFactors && (
                                    <div className="border-t pt-3 mb-3">
                                      <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                                        Verifiable Factors
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {scenario.verifiableFactors}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-center pt-4 border-t mt-4 flex-shrink-0">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <IoBulbOutline className="w-4 h-4" />
                                    Click to see reasoning
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Back of card - Reasoning */}
                            <Card className="absolute inset-0 border-0 shadow-sm bg-purple-50 dark:bg-purple-950/30 backface-hidden rotate-y-180 overflow-hidden">
                              <CardHeader className="pb-4 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                  <IoBulbOutline className="w-5 h-5 text-purple-600" />
                                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                                    How I Reached This Conclusion
                                  </h4>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="flex flex-col h-full overflow-hidden">
                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-600 scrollbar-track-transparent pr-2">
                                  {reasoning ? (
                                    <div className="text-purple-700 dark:text-purple-300 text-sm leading-relaxed">
                                      {reasoning.howICameToThisConclusion}
                                    </div>
                                  ) : (
                                    <div className="text-purple-700 dark:text-purple-300 text-sm">
                                      No detailed reasoning available for this scenario.
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-center pt-4 border-t border-purple-200 dark:border-purple-800 mt-4 flex-shrink-0">
                                  <div className="flex items-center gap-2 text-sm text-purple-600">
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
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600" />
                        Strategic Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                          {result.recommendations}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {result.dataDisclaimer && (
                    <Card className="border-0 shadow-sm bg-amber-50 dark:bg-amber-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <IoShieldCheckmarkOutline className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                              Data Verification Notice
                            </h4>
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              {result.dataDisclaimer}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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