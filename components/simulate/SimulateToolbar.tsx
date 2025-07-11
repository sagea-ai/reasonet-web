'use client'

import React from 'react'
import { Save, Download, Upload, Play, Trash2, Undo, Redo, FileText } from 'lucide-react'
import { useSimulateStore } from '@/store/simulateStore'

interface SimulateToolbarProps {
  onGeneratePrompt?: (prompt: string) => void
}

export function SimulateToolbar({ onGeneratePrompt }: SimulateToolbarProps) {
  const { clearCanvas, canUndo, canRedo, undo, redo, generateWorkflowPrompt } = useSimulateStore()

  const handleGeneratePrompt = () => {
    const prompt = generateWorkflowPrompt()
    console.log('Generated Prompt:', prompt)
    onGeneratePrompt?.(prompt)
  }

  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <h1 className="text-foreground font-medium text-sm">Simulate Your Idea</h1>
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo className="w-4 h-4" />
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Redo className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <button className="p-2 text-muted-foreground hover:text-foreground">
          <Save className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <button
          onClick={clearCanvas}
          className="p-2 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleGeneratePrompt}
          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center space-x-1"
        >
          <FileText className="w-3 h-3" />
          <span>Run</span>
        </button>
      </div>
    </div>
  )
}