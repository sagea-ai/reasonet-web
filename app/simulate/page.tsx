'use client'

import { ReactFlowProvider } from '@xyflow/react'
import { SimulateCanvas } from '@/components/simulate/SimulateCanvas'
import { ComponentPalette } from '@/components/simulate/ComponentPalette'
import { SimulateToolbar } from '@/components/simulate/SimulateToolbar'

export default function SimulatePage() {
  return (
    <div className="h-screen bg-background flex">
      <ReactFlowProvider>
        <ComponentPalette />
        <div className="flex-1 flex flex-col">
          <SimulateToolbar />
          <SimulateCanvas />
        </div>
      </ReactFlowProvider>
    </div>
  )
}