'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReactFlowProvider } from '@xyflow/react'
import { SimulateCanvas } from '@/components/simulate/SimulateCanvas'
import { ComponentPalette } from '@/components/simulate/ComponentPalette'
import { SimulateToolbar } from '@/components/simulate/SimulateToolbar'
import { FloatingPromptBar } from '@/components/simulate/FloatingPromptBar'
import { TrialBannerWrapper } from "../trial/trial-banner-wrapper"


export function SimulatePageClient() {
  const router = useRouter()
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGeneratePrompt = (prompt: string) => {
    setIsAnimating(true)
    setCurrentPrompt(prompt)
    setTimeout(() => setIsAnimating(false), prompt.length * 20 + 500)
  }

  const handlePromptSubmit = (prompt: string) => {
    console.log('Submitting prompt:', prompt)
    const encodedPrompt = encodeURIComponent(prompt)
    router.push(`/reason?prompt=${encodedPrompt}`)
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