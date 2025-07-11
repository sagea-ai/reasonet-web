'use client'

import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { 
  Bot, 
  Database, 
  MessageSquare, 
  GitBranch,
  Webhook,
  FileText,
  Mail,
  Settings,
  X,
  Edit3,
} from 'lucide-react'
import { useSimulateStore } from '@/store/simulateStore'

const iconMap = {
  'form-trigger': FileText,
  'webhook': Webhook,
  'ai-agent': Bot,
  'condition': GitBranch,
  'database': Database,
  'notification': Mail,
  'slack': MessageSquare,
  'default': Settings,
} as const

const colorMap = {
  'form-trigger': 'bg-orange-500',
  'webhook': 'bg-purple-500',
  'ai-agent': 'bg-blue-500',
  'condition': 'bg-yellow-500',
  'database': 'bg-green-500',
  'notification': 'bg-red-500',
  'slack': 'bg-indigo-500',
  'custom': 'bg-gray-500',
  'default': 'bg-gray-500',
} as const

interface NodeData {
  label: string
  nodeType?: string
  description?: string
  customConfig?: string
  config?: Record<string, any>
  isCustom?: boolean
}

interface CustomNodeProps {
  data: NodeData
  id: string
  selected?: boolean
  onConfigClick?: (nodeId: string, nodeData: NodeData) => void
}

export function CustomNode({ data, id, selected, onConfigClick }: CustomNodeProps) {
  const { removeNode } = useSimulateStore()
  const nodeType = data.nodeType || 'default'
  const isCustomComponent = data.isCustom || nodeType.startsWith('custom-')
  const hasConfiguration = data.description || data.customConfig
  
  // For custom components, use Settings icon, otherwise use mapped icon
  const Icon = isCustomComponent ? Settings : (iconMap[nodeType as keyof typeof iconMap] || iconMap.default)
  const bgColor = isCustomComponent ? 'bg-purple-600' : (colorMap[nodeType as keyof typeof colorMap] || colorMap.default)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeNode(id)
  }

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onConfigClick?.(id, data)
  }

  return (
    <div className={`relative bg-card rounded-lg border-2 ${selected ? 'border-primary' : 'border-border'} min-w-[180px] shadow-sm group`}>
      <button
        onClick={handleDelete}
        className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-all ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ zIndex: 10 }}
      >
        <X className="w-3 h-3" />
      </button>

      <button
        onClick={handleConfigClick}
        className={`absolute -top-2 -right-10 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-all ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ zIndex: 10 }}
        title="Configure Component"
      >
        <Edit3 className="w-3 h-3" />
      </button>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-muted border-2 border-border"
      />
      
      {/* Node Content */}
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`p-2 rounded ${bgColor} text-white`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-foreground font-medium text-sm">{data.label || 'Untitled'}</h3>
              {isCustomComponent && (
                <span className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">
                  Custom
                </span>
              )}
              {hasConfiguration && (
                <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                  ✓
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {data.description || 'No description'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-muted border-2 border-border"
      />
      
      {/* Conditional handles for branching nodes */}
      {nodeType === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 bg-green-400 border-2 border-green-600"
            style={{ left: '25%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 bg-red-400 border-2 border-red-600"
            style={{ left: '75%' }}
          />
        </>
      )}
    </div>
  )
}