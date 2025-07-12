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
  IoBulbOutline,
  IoSearchOutline,
  IoSaveOutline
} from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { TrialProvider } from '../trial/trial-provider'
import { TrialBannerWrapper } from '../trial/trial-banner-wrapper'
import { WorkspaceSelectionModal } from './workspace-selection-modal'

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
  const [isDeepSearching, setIsDeepSearching] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<any>(null)
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [savingScenario, setSavingScenario] = useState(false)
  const [savedScenarios, setSavedScenarios] = useState<Set<string>>(new Set()) // Track saved scenarios
  const router = useRouter()

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

  const handleDeepSearch = async () => {
    if (!query.trim()) {
      toast.error('No prompt available for deep search')
      return
    }

    setIsDeepSearching(true)
    
    try {
      // Store the prompt in sessionStorage for DeepSearch
      sessionStorage.setItem('deepSearchData', JSON.stringify({ 
        prompt: query,
        source: 'reasoning'
      }))
      
      // Navigate to DeepSearch page
      router.push('/deepresearch?autoAnalyze=true')
      
    } catch (error) {
      console.error('Deep search navigation failed:', error)
      toast.error('Failed to start deep search')
      setIsDeepSearching(false)
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

  const handleSaveScenario = async (scenario: any, workspaceId: string) => {
    setSavingScenario(true)
    try {
      const reasoning = result.backwardReasoning?.find(r => r.scenarioTitle === scenario.title)
      
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: scenario.title,
          type: scenario.type,
          probability: scenario.probability,
          timeframe: scenario.timeframe,
          description: scenario.description,
          marketData: scenario.marketData,
          verifiableFactors: scenario.verifiableFactors,
          backwardReasoning: reasoning?.howICameToThisConclusion,
          workspaceId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save scenario')
      }

      setSavedScenarios(prev => new Set(prev).add(scenario.title))
      toast.success('Scenario saved successfully!')
    } catch (error) {
      console.error('Error saving scenario:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save scenario')
    } finally {
      setSavingScenario(false)
    }
  }

  useEffect(() => {
    if (result && currentOrganization.id) {
      checkSavedScenarios()
    }
  }, [result, currentOrganization.id])

  const checkSavedScenarios = async () => {
    if (!currentOrganization.id || !result?.scenarios) return
    
    try {
      const response = await fetch(`/api/workspaces/${currentOrganization.id}/scenarios`)
      if (response.ok) {
        const savedScenarios = await response.json()
        const savedTitles = new Set(savedScenarios.map((s: any) => s.title as string))
        setSavedScenarios(savedTitles as Set<string>)
      }
    } catch (error) {
      console.error('Error checking saved scenarios:', error)
    }
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
    if (probability >= 80) return 'text-green-600'
    if (probability >= 60) return 'text-blue-600'
    if (probability >= 40) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionNavBar />
      <TrialProvider>
        <TrialBannerWrapper />
      </TrialProvider>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
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
                  {/* Business Summary */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IoBusinessOutline className="w-5 h-5 text-blue-600" />
                        Business Analysis Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.businessSummary ? (
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          <ReactMarkdown 
                            components={{
                              p: ({children}) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-justify">{children}</p>,
                              strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                              em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">{children}</ol>,
                              li: ({children}) => <li className="text-gray-700 dark:text-gray-300 leading-relaxed">{children}</li>,
                            }}
                          >
                            {result.businessSummary}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <IoBusinessOutline className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">
                            No business summary available for this analysis.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Scenarios</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {Array.isArray(result.scenarios) ? result.scenarios.length : 0}
                            </p>
                          </div>
                          <IoStatsChartOutline className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Probability</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {Array.isArray(result.scenarios) && result.scenarios.length > 0 
                                ? Math.round(result.scenarios.reduce((sum, s) => sum + (s.probability || 0), 0) / result.scenarios.length)
                                : 0}%
                            </p>
                          </div>
                          <IoAnalyticsOutline className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">High Risk</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {Array.isArray(result.scenarios) ? result.scenarios.filter(s => (s.probability || 0) >= 70).length : 0}
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
                  {!Array.isArray(result.scenarios) || result.scenarios.length === 0 ? (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-8 text-center">
                        <IoAnalyticsOutline className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          No Scenarios Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          No scenarios were generated for this analysis.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
                      {result.scenarios.map((scenario, index) => {
                        // Ensure scenario has required properties
                        const safeScenario = {
                          title: scenario.title || `Scenario ${index + 1}`,
                          type: scenario.type || 'Analysis',
                          probability: scenario.probability || 0,
                          timeframe: scenario.timeframe || 'Unknown',
                          description: scenario.description || 'No description available.',
                          marketData: scenario.marketData,
                          verifiableFactors: scenario.verifiableFactors
                        }
                        
                        const reasoning = Array.isArray(result.backwardReasoning) 
                          ? result.backwardReasoning.find(r => r.scenarioTitle === safeScenario.title)
                          : null
                        const isFlipped = flippedCards.has(index)
                        const isSaved = savedScenarios.has(safeScenario.title)

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
                            <Card className={`absolute inset-0 border-0 shadow-lg bg-white dark:bg-gray-800 backface-hidden overflow-hidden transition-all duration-300 hover:shadow-xl ${
                              isSaved ? 'ring-2 ring-green-200 bg-green-50 dark:bg-green-900/20' : ''
                            }`}>
                              <CardHeader className="pb-4 flex-shrink-0">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${getTypeColor(safeScenario.type)} border text-xs font-medium w-fit`}>
                                      <span className="flex items-center gap-1">
                                        {getTypeIcon(safeScenario.type)}
                                        {safeScenario.type}
                                      </span>
                                    </Badge>
                                    {isSaved && (
                                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-medium">
                                        <IoCheckmarkCircleOutline className="w-3 h-3 mr-1" />
                                        Saved
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <div className={`text-3xl font-bold ${getProbabilityColor(safeScenario.probability)} tracking-tight`}>
                                      {safeScenario.probability}%
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                                      <IoTimeOutline className="w-3 h-3" />
                                      {safeScenario.timeframe}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Professional Save Button */}
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    variant={isSaved ? "default" : "outline"}
                                    onClick={(e) => {
                                      e.stopPropagation() // Prevent card flip
                                      if (!isSaved) {
                                        setSelectedScenario(safeScenario)
                                        setWorkspaceModalOpen(true)
                                      }
                                    }}
                                    disabled={savingScenario || isSaved}
                                    className={`transition-all duration-200 ${
                                      isSaved 
                                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm" 
                                        : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 shadow-sm hover:shadow-md"
                                    }`}
                                  >
                                    {savingScenario && selectedScenario?.title === scenario.title ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                                    ) : isSaved ? (
                                      <IoCheckmarkCircleOutline className="w-4 h-4 mr-2" />
                                    ) : (
                                      <IoSaveOutline className="w-4 h-4 mr-2" />
                                    )}
                                    {isSaved ? 'Saved' : 'Save Scenario'}
                                  </Button>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="flex flex-col h-full overflow-hidden pt-0">
                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-600">
                                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 leading-tight text-lg text-center">
                                    {safeScenario.title}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 text-justify">
                                    {safeScenario.description}
                                  </p>
                                  
                                  {safeScenario.marketData && (
                                    <div className="border-t pt-3 mb-3">
                                      <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2 text-center">
                                        Market Data
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-justify">
                                        {safeScenario.marketData}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {safeScenario.verifiableFactors && (
                                    <div className="border-t pt-3 mb-3">
                                      <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2 text-center">
                                        Verifiable Factors
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-justify">
                                        {safeScenario.verifiableFactors}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-center pt-4 border-t border-gray-100 dark:border-gray-700 mt-4 flex-shrink-0">
                                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                                    <IoBulbOutline className="w-4 h-4" />
                                    Click to see reasoning
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Back of card - Reasoning */}
                            <Card className={`absolute inset-0 border-0 shadow-lg bg-purple-50 dark:bg-purple-950/30 backface-hidden rotate-y-180 overflow-hidden transition-all duration-300 hover:shadow-xl ${
                              isSaved ? 'ring-2 ring-green-200' : ''
                            }`}>
                              <CardHeader className="pb-4 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <IoBulbOutline className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                                      How I Reached This Conclusion
                                    </h4>
                                  </div>
                                  {isSaved && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-medium">
                                      <IoCheckmarkCircleOutline className="w-3 h-3 mr-1" />
                                      Saved
                                    </Badge>
                                  )}
                                </div>
                              </CardHeader>
                              
                              <CardContent className="flex flex-col h-full overflow-hidden">
                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent pr-2 hover:scrollbar-thumb-purple-300 dark:hover:scrollbar-thumb-purple-600">
                                  {reasoning ? (
                                    <div className="text-purple-700 dark:text-purple-300 text-sm leading-relaxed text-justify">
                                      {reasoning.howICameToThisConclusion}
                                    </div>
                                  ) : (
                                    <div className="text-purple-700 dark:text-purple-300 text-sm text-center">
                                      No detailed reasoning available for this scenario.
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-center pt-4 border-t border-purple-200 dark:border-purple-800 mt-4 flex-shrink-0">
                                  <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-lg">
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
                  )}
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600" />
                        Strategic Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                        <ReactMarkdown 
                          components={{
                            h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6 first:mt-0">{children}</h1>,
                            h2: ({children}) => <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-5 first:mt-0">{children}</h2>,
                            h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4 first:mt-0">{children}</h3>,
                            h4: ({children}) => <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2 mt-3 first:mt-0">{children}</h4>,
                            p: ({children}) => <p className="text-gray-700 dark:text-gray-300 mb-4 text-justify leading-relaxed">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">{children}</ol>,
                            li: ({children}) => <li className="text-gray-700 dark:text-gray-300 leading-relaxed">{children}</li>,
                            strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                            em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-green-500 pl-4 py-2 my-4 bg-green-50 dark:bg-green-900/20 italic text-gray-700 dark:text-gray-300">{children}</blockquote>,
                            code: ({children}) => <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">{children}</code>,
                            pre: ({children}) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                          }}
                        >
                          {result.recommendations}
                        </ReactMarkdown>
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

        {/* Workspace Selection Modal */}
        <WorkspaceSelectionModal
          isOpen={workspaceModalOpen}
          onClose={() => {
            setWorkspaceModalOpen(false)
            setSelectedScenario(null)
          }}
          onWorkspaceSelect={(workspaceId) => {
            if (selectedScenario) {
              handleSaveScenario(selectedScenario, workspaceId)
            }
          }}
          currentOrganization={currentOrganization}
        />
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
        
        /* Custom scrollbar styling for better integration */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 2px;
          transition: background 0.2s ease;
        }
        
        .scrollbar-thin:hover::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
        }
        
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
        }
        
        .dark .scrollbar-thin:hover::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
        }
        
        /* Purple scrollbar for reasoning cards */
        .scrollbar-thin[class*="scrollbar-thumb-purple"]::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.2);
        }
        
        .scrollbar-thin[class*="scrollbar-thumb-purple"]:hover::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.4);
        }
        
        .dark .scrollbar-thin[class*="scrollbar-thumb-purple"]::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.2);
        }
        
        .dark .scrollbar-thin[class*="scrollbar-thumb-purple"]:hover::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.4);
        }
      `}</style>
    </div>
  )
}