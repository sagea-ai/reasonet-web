'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReactFlowProvider } from '@xyflow/react'
import { SimulateCanvas } from '@/components/simulate/SimulateCanvas'
import { ComponentPalette } from '@/components/simulate/ComponentPalette'
import { SimulateToolbar } from '@/components/simulate/SimulateToolbar'
import { FloatingPromptBar } from '@/components/simulate/FloatingPromptBar'
import { TrialBannerWrapper } from "../trial/trial-banner-wrapper"
import { Button } from '@/components/ui/button'

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}


interface SimulatePageClientProps {
  organizations: Organization[];
  currentOrganization: Organization;
  user: User;
  onRunWorkflow: (workflow: any) => void;
  isRunningWorkflow: boolean;
}

export function SimulatePageClient({ 
  organizations, 
  currentOrganization, 
  user,
  onRunWorkflow,
  isRunningWorkflow
}: SimulatePageClientProps) {
  const router = useRouter()
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [workflow, setWorkflow] = useState<any>(null)

  const handleGeneratePrompt = (prompt: string) => {
    setIsAnimating(true)
    setCurrentPrompt(prompt)
    // Reset animation after prompt is fully typed
    setTimeout(() => setIsAnimating(false), prompt.length * 20 + 500)
  }

  const handlePromptSubmit = (prompt: string) => {
    console.log('Submitting prompt:', prompt)
    // Redirect to reason page with the prompt
    const encodedPrompt = encodeURIComponent(prompt)
    router.push(`/reason?prompt=${encodedPrompt}`)
  }

  const handleRunWorkflow = () => {
    if (workflow) {
      onRunWorkflow(workflow);
    }
  };

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
      <div className="p-8">
        <Button 
          onClick={handleRunWorkflow}
          disabled={!workflow || isRunningWorkflow}
          className="..."
        >
          {isRunningWorkflow ? 'Running...' : 'Run Workflow'}
        </Button>
      </div>
    </div>
  )
}