'use client'

import React, { useRef, useState } from 'react'
import { Save, Download, Upload, Play, Trash2, Undo, Redo, FileText } from 'lucide-react'
import { useSimulateStore } from '@/store/simulateStore'
import { toast } from 'sonner'

interface SimulateToolbarProps {
  onGeneratePrompt?: (prompt: string) => void
}

export function SimulateToolbar({ onGeneratePrompt }: SimulateToolbarProps) {
  const { 
    clearCanvas, 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    generateWorkflowPrompt,
    nodes,
    edges
  } = useSimulateStore()
  
  const [workflowName, setWorkflowName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGeneratePrompt = () => {
    const prompt = generateWorkflowPrompt()
    console.log('Generated Prompt:', prompt)
    onGeneratePrompt?.(prompt)
  }

  const handleSaveWorkflow = () => {
    if (!nodes || nodes.length === 0) {
      toast.error('No workflow to save')
      return
    }

    const workflow = {
      nodes,
      edges,
      metadata: {
        name: workflowName || 'workflow',
        created: new Date().toISOString(),
        version: '1.0'
      }
    }

    const dataStr = JSON.stringify(workflow, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = workflowName || 'workflow'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', `${exportFileDefaultName}.json`)
    linkElement.click()
    
    toast.success('Workflow saved successfully!')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      toast.error('Please upload a valid JSON file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const workflowData = JSON.parse(content)
        
        if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
          toast.error('Invalid workflow format. Missing nodes array.')
          return
        }
        useSimulateStore.setState({ nodes: workflowData.nodes, edges: workflowData.edges || [] })
      } catch (error) {
        toast.error('Invalid JSON format. Please check your file.')
      }
    }
    reader.readAsText(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
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
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <button 
          onClick={handleUploadClick}
          className="p-2 text-muted-foreground hover:text-foreground"
          title="Upload Workflow"
        >
          <Upload className="w-4 h-4" />
        </button>
        
        <button 
          onClick={handleSaveWorkflow}
          className="p-2 text-muted-foreground hover:text-foreground"
          title="Save Workflow"
        >
          <Save className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <button
          onClick={clearCanvas}
          className="p-2 text-muted-foreground hover:text-destructive"
          title="Clear Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleGeneratePrompt}
          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center space-x-1"
          title="Run Workflow"
        >
          <FileText className="w-3 h-3" />
          <span>Run</span>
        </button>
      </div>
      
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}