'use client'

import React, { useState } from 'react'
import { 
  BaseEdge, 
  EdgeProps, 
  getStraightPath,
  EdgeLabelRenderer,
} from '@xyflow/react'
import { Edit3 } from 'lucide-react'

interface CustomEdgeData extends Record<string, unknown> {
  stepNumber?: number
  description?: string
}

interface CustomEdgeProps extends Omit<EdgeProps, 'data'> {
  data?: CustomEdgeData
}

export function CustomEdge({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition,
  data,
  selected 
}: CustomEdgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  const hasConfiguration = data?.stepNumber || data?.description

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        className={`${selected ? 'stroke-primary' : 'stroke-border'} ${hasConfiguration ? 'stroke-2' : ''}`}
      />
      
      {/* Edge Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div 
            className={`flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1 shadow-sm text-xs group ${
              selected ? 'ring-2 ring-primary' : ''
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {data?.stepNumber && (
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                {data.stepNumber}
              </span>
            )}
            {hasConfiguration && (
              <span className="text-green-600">✓</span>
            )}
            <button
              className={`text-muted-foreground hover:text-foreground transition-opacity ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                const event = new CustomEvent('configureEdge', { detail: { edgeId: id } })
                window.dispatchEvent(event)
              }}
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}