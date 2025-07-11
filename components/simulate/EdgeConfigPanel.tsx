'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, ArrowRight, Hash } from 'lucide-react'
import { useSimulateStore } from '@/store/simulateStore'

interface EdgeConfigPanelProps {
  edgeId: string
  edgeData: any
  sourceNode: any
  targetNode: any
  onClose: () => void
}

export function EdgeConfigPanel({ edgeId, edgeData, sourceNode, targetNode, onClose }: EdgeConfigPanelProps) {
  const { updateEdgeData, edges } = useSimulateStore()
  const [stepNumber, setStepNumber] = useState(edgeData?.stepNumber?.toString() || '')
  const [description, setDescription] = useState(edgeData?.description || '')

  const handleSave = () => {
    console.log('Saving edge configuration:', { edgeId, stepNumber, description })
    
    const updateData = {
      stepNumber: stepNumber ? parseInt(stepNumber) : undefined,
      description: description.trim() || undefined,
      sourceNode,
      targetNode,
    }

    updateEdgeData(edgeId, updateData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-[500px] max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded text-white">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-lg">Configure Connection</h3>
              <p className="text-muted-foreground text-sm">
                {sourceNode?.data?.label} → {targetNode?.data?.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Step Number (Optional)
            </label>
            <div className="mb-2 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Assign a number to this step to show the order in your workflow (e.g., 1, 2, 3...)
              </p>
            </div>
            <input
              type="number"
              value={stepNumber}
              onChange={(e) => setStepNumber(e.target.value)}
              className="w-full p-3 border border-border rounded-md bg-background text-foreground"
              placeholder="e.g., 1"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Connection Description
            </label>
            <div className="mb-2 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Describe what happens when data flows from {sourceNode?.data?.label} to {targetNode?.data?.label}
              </p>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-border rounded-md bg-background text-foreground h-20 resize-none"
              placeholder="e.g., When form is submitted, data is passed to AI agent for processing..."
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Example
            </h4>
            <p className="text-sm text-green-800">
              "Step 1: When the contact form is submitted, the form data (name, email, message) is immediately sent to the AI Agent for sentiment analysis and categorization before being stored."
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Connection
          </button>
        </div>
      </div>
    </div>
  )
}