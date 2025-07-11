'use client'

import { ReactFlowProvider } from '@xyflow/react'
import { SimulateCanvas } from '@/components/simulate/SimulateCanvas'
import { ComponentPalette } from '@/components/simulate/ComponentPalette'
import { SimulateToolbar } from '@/components/simulate/SimulateToolbar'
import { TrialBannerWrapper } from "../trial/trial-banner-wrapper"


export function SimulatePageClient() {
  return (
    <div>
    <TrialBannerWrapper/>
    <div className="h-screen bg-background flex">
      <ReactFlowProvider>
        <div className="flex-1 flex flex-col">
          <SimulateToolbar />
          <SimulateCanvas />
        </div>
        <ComponentPalette />
      </ReactFlowProvider>
    </div>
    </div>
  )
}
