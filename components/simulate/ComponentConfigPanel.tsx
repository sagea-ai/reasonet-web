'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, FileText, Settings as SettingsIcon } from 'lucide-react'
import { useSimulateStore } from '@/store/simulateStore'

interface ComponentConfigPanelProps {
  nodeId: string
  nodeData: any
  onClose: () => void
}

export function ComponentConfigPanel({ nodeId, nodeData, onClose }: ComponentConfigPanelProps) {
  const { updateNodeData, nodes } = useSimulateStore()
  const [description, setDescription] = useState(nodeData.description || '')
  const [customConfig, setCustomConfig] = useState(nodeData.customConfig || '')
  const [isValid, setIsValid] = useState(true)

  // Validate that the node still exists when component mounts
  useEffect(() => {
    const nodeExists = nodes.find(node => node.id === nodeId)
    if (!nodeExists) {
      console.warn('Node no longer exists:', nodeId)
      setIsValid(false)
    }
  }, [nodeId, nodes])

  const handleSave = () => {
    if (!isValid) {
      console.error('Cannot save: node is invalid')
      onClose()
      return
    }

    console.log('Saving component configuration:', { nodeId, description, customConfig })
    
    const updateData = {
      description: description.trim() || nodeData.description,
      customConfig: customConfig.trim() || nodeData.customConfig,
    }

    updateNodeData(nodeId, updateData)
    onClose()
  }

  if (!isValid) {
    return (
      <div className="fixed inset-0 bg-black/10 backdrop-blur-2xl flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-lg p-6 w-[600px] max-w-[90vw]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded text-white">
                <X className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-lg">Component Not Found</h3>
                <p className="text-muted-foreground text-sm">This component no longer exists</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            The component you were trying to configure has been removed or is no longer available.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-2xl flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded text-primary-foreground">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-lg">Configure Component</h3>
              <p className="text-muted-foreground text-sm">{nodeData.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Component Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Component Description
            </label>
            <div className="mb-2 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> {getComponentHelp(nodeData.nodeType)}
              </p>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-border rounded-md bg-background text-foreground h-24 resize-none"
              placeholder="Describe what this component does in your workflow..."
            />
          </div>

          {/* Custom Configuration */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Additional Configuration
            </label>
            <div className="mb-2 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Add any specific settings, parameters, or conditions for this component.
              </p>
            </div>
            <textarea
              value={customConfig}
              onChange={(e) => setCustomConfig(e.target.value)}
              className="w-full p-3 border border-border rounded-md bg-background text-foreground h-20 resize-none"
              placeholder="e.g., API endpoints, field mappings, conditions..."
            />
          </div>

          {/* Example Section */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <h4 className="font-medium text-sky-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Example Description
            </h4>
            <p className="text-sm text-sky-800">
              {nodeData.nodeType === 'form-trigger' && 
                '"This component receives data when a user submits our contact form. It captures name, email, subject, and message fields. This triggers our customer support workflow."'
              }
              {nodeData.nodeType === 'ai-agent' && 
                '"This AI agent analyzes the incoming support ticket to determine urgency level and categorize the issue type (billing, technical, general). It also extracts customer sentiment."'
              }
              {nodeData.nodeType === 'condition' && 
                '"Check if the issue is marked as high priority OR if the customer is a premium subscriber. If either condition is true, route to priority support queue."'
              }
              {nodeData.nodeType === 'database' && 
                '"Store the support ticket in our database with fields: ticket_id, customer_id, issue_type, priority, status, created_at, and assigned_agent."'
              }
              {!['form-trigger', 'ai-agent', 'condition', 'database'].includes(nodeData.nodeType) &&
                '"Provide a clear, specific description of what this component does and how it fits into your overall workflow."'
              }
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
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )

  function getComponentHelp(nodeType: string) {
    const helpText = {
      'form-trigger': 'Describe what form data this component receives and what triggers it (e.g., "User submits contact form with name, email, and message")',
      'webhook': 'Explain what external system sends data here and what data it contains (e.g., "Stripe webhook sends payment confirmation with customer ID and amount")',
      'ai-agent': 'Detail what AI processing happens here (e.g., "Analyze customer sentiment and extract key issues from support ticket")',
      'condition': 'Specify the conditions being checked (e.g., "If customer is premium user and issue severity is high")',
      'database': 'Describe what data is stored or retrieved (e.g., "Save customer support ticket to database with timestamp and priority")',
      'notification': 'Explain what notification is sent and to whom (e.g., "Send email confirmation to customer with ticket number")',
      'slack': 'Detail what message is posted to Slack (e.g., "Post urgent support alert to #customer-success channel")',
    }
    
    return helpText[nodeType as keyof typeof helpText] || 'Describe what this custom component does in your workflow'
  }
}