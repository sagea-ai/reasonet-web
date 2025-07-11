'use client'

import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { SimulateCanvas } from '@/components/simulate/SimulateCanvas'
import { ComponentPalette } from '@/components/simulate/ComponentPalette'
import { SimulateToolbar } from '@/components/simulate/SimulateToolbar'
import { FloatingPromptBar } from '@/components/simulate/FloatingPromptBar'
import { TrialBannerWrapper } from "../trial/trial-banner-wrapper"


export function SimulatePageClient() {
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGeneratePrompt = (prompt: string) => {
    setIsAnimating(true)
    setCurrentPrompt(prompt)
    // Reset animation after prompt is fully typed
    setTimeout(() => setIsAnimating(false), prompt.length * 20 + 500)
  }

  const handlePromptSubmit = async (prompt: string) => {
    console.log('Submitting prompt:', prompt)
    setIsLoading(true)
    
    try {
      // TODO: Implement actual prompt submission logic
      // This could send to an AI service, save to database, etc.
      await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate API call
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='h-screen'>
      <TrialBannerWrapper/>
      <div className="h-screen bg-background flex">
        <ReactFlowProvider>
          <div className="flex-1 flex flex-col">
            <SimulateToolbar onGeneratePrompt={handleGeneratePrompt} />
            <SimulateCanvas />
          </div>
          <ComponentPalette />
        </ReactFlowProvider>
        
        <FloatingPromptBar
          prompt={currentPrompt}
          onPromptChange={setCurrentPrompt}
          onSubmit={handlePromptSubmit}
          isAnimating={isAnimating}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
