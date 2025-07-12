'use client'

import React, { useState } from 'react'
import { 
  Zap, 
  Bot, 
  Database, 
  MessageSquare, 
  Settings, 
  GitBranch,
  Webhook,
  FileText,
  Users,
  Mail,
  Plus,
  X
} from 'lucide-react'

interface ComponentItem {
  id: string
  type: 'input' | 'processing' | 'output' | 'logic' | 'integration' | 'custom'
  label: string
  icon: React.ReactNode
  description: string
  isCustom?: boolean
}

const defaultComponents: ComponentItem[] = [
  {
    id: 'form-trigger',
    type: 'input',
    label: 'Form Trigger',
    icon: <FileText className="w-4 h-4" />,
    description: 'Trigger on form submission'
  },
  {
    id: 'webhook',
    type: 'input', 
    label: 'Webhook',
    icon: <Webhook className="w-4 h-4" />,
    description: 'Receive external data'
  },
  {
    id: 'ai-agent',
    type: 'processing',
    label: 'AI Agent',
    icon: <Bot className="w-4 h-4" />,
    description: 'Process with AI'
  },
  {
    id: 'condition',
    type: 'logic',
    label: 'Condition',
    icon: <GitBranch className="w-4 h-4" />,
    description: 'Branch logic'
  },
  {
    id: 'database',
    type: 'output',
    label: 'Database',
    icon: <Database className="w-4 h-4" />,
    description: 'Store data'
  },
  {
    id: 'notification',
    type: 'output',
    label: 'Notification',
    icon: <Mail className="w-4 h-4" />,
    description: 'Send notifications'
  },
  {
    id: 'slack',
    type: 'integration',
    label: 'Slack',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Slack integration'
  },
]

export function ComponentPalette() {
  const [componentItems, setComponentItems] = useState<ComponentItem[]>(defaultComponents)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [customType, setCustomType] = useState<'input' | 'processing' | 'output' | 'logic' | 'integration'>('processing')

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('application/label', label)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleCreateCustomComponent = () => {
    if (!customName.trim()) return

    const newComponent: ComponentItem = {
      id: `custom-${Date.now()}`,
      type: customType,
      label: customName,
      icon: <Settings className="w-4 h-4" />,
      description: customDescription || 'Custom component',
      isCustom: true
    }

    setComponentItems([...componentItems, newComponent])
    setCustomName('')
    setCustomDescription('')
    setShowCustomModal(false)
  }

  const removeCustomComponent = (id: string) => {
    setComponentItems(componentItems.filter(item => item.id !== id))
  }

  return (
    <div className="w-72 bg-card border-l border-border p-3 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground text-sm font-semibold">Components</h2>
        <button
          onClick={() => setShowCustomModal(true)}
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded"
          title="Add Custom Component"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        {['input', 'processing', 'logic', 'output', 'integration'].map(category => (
          <div key={category} className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {category}
            </h3>
            <div className="space-y-1">
              {componentItems
                .filter(item => item.type === category)
                .map(item => (
                  <div
                    key={item.id}
                    className="flex items-center p-2 bg-muted rounded-md cursor-move hover:bg-accent transition-colors group"
                    draggable
                    onDragStart={(e) => onDragStart(e, item.id, item.label)}
                  >
                    <div className="text-primary mr-2">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-xs font-medium truncate">{item.label}</div>
                      <div className="text-muted-foreground text-xs truncate">{item.description}</div>
                    </div>
                    {item.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCustomComponent(item.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Component Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-2xl flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-semibold">Create Custom Component</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Component Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="e.g., Email Parser, PDF Generator"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground h-20 resize-none"
                  placeholder="Describe what this component does..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="input">Input</option>
                  <option value="processing">Processing</option>
                  <option value="logic">Logic</option>
                  <option value="output">Output</option>
                  <option value="integration">Integration</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomComponent}
                disabled={!customName.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Component
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}