'use client'

import React, { useCallback, useRef, DragEvent, useEffect, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSimulateStore } from '@/store/simulateStore'
import { CustomNode } from './nodes/CustomNode'
import { CustomEdge } from './edges/CustomEdge'
import { ComponentConfigPanel } from './ComponentConfigPanel'
import { EdgeConfigPanel } from './EdgeConfigurationPanel'

const nodeTypes = {
  custom: CustomNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

export function SimulateCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, removeNode } = useSimulateStore()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)
  const [configNode, setConfigNode] = useState<{ id: string; data: any } | null>(null)
  const [configEdge, setConfigEdge] = useState<{ id: string; data: any; sourceNode: any; targetNode: any } | null>(null)

  useEffect(() => {
    const handleConfigureEdge = (event: any) => {
      const edgeId = event.detail.edgeId
      const edge = edges.find(e => e.id === edgeId)
      if (edge) {
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)
        setConfigEdge({
          id: edgeId,
          data: edge.data || {},
          sourceNode,
          targetNode,
        })
      }
    }

    window.addEventListener('configureEdge', handleConfigureEdge)
    return () => {
      window.removeEventListener('configureEdge', handleConfigureEdge)
    }
  }, [edges, nodes])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(node => node.selected)
        selectedNodes.forEach(node => {
          removeNode(node.id)
        })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [nodes, removeNode])

  const handleConfigClick = useCallback((nodeId: string, nodeData: any) => {
    // Verify the node still exists before opening config
    const nodeExists = nodes.find(node => node.id === nodeId)
    if (!nodeExists) {
      console.warn('Cannot configure node - node not found:', nodeId)
      return
    }
    setConfigNode({ id: nodeId, data: nodeData })
  }, [nodes])

  const getNodeDescription = (nodeType: string) => {
    const descriptions = {
      'form-trigger': 'Triggers when form is submitted',
      'webhook': 'Receives external HTTP requests',
      'ai-agent': 'Processes data with AI',
      'condition': 'Branches based on conditions',
      'database': 'Stores or retrieves data',
      'notification': 'Sends notifications',
      'slack': 'Integrates with Slack',
    }
    
    if (nodeType.startsWith('custom-')) {
      return 'Custom component'
    }
    
    return descriptions[nodeType as keyof typeof descriptions] || 'Custom node'
  }

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const nodeType = event.dataTransfer.getData('application/reactflow')
      const label = event.dataTransfer.getData('application/label')

      if (typeof nodeType === 'undefined' || !nodeType || !reactFlowInstance.current) {
        return
      }

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const uniqueId = `${nodeType}-${timestamp}-${random}`

      const newNode = {
        id: uniqueId,
        type: 'custom',
        position,
        data: {
          label,
          nodeType,
          description: getNodeDescription(nodeType),
          isCustom: nodeType.startsWith('custom-'),
        },
      }

      console.log('Creating new node:', newNode)
      addNode(newNode)
    },
    [addNode]
  )

  const customNodeTypes = {
    custom: (props: any) => <CustomNode {...props} onConfigClick={handleConfigClick} />,
  }

  return (
    <div className="flex-1 bg-background relative pb-32" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => {
          reactFlowInstance.current = instance
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={customNodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="oklch(0.922 0 0)"
        />
        <Controls className="bg-card border-border text-foreground" />
      </ReactFlow>

      {configNode && (
        <ComponentConfigPanel
          nodeId={configNode.id}
          nodeData={configNode.data}
          onClose={() => setConfigNode(null)}
        />
      )}

      {configEdge && (
        <EdgeConfigPanel
          edgeId={configEdge.id}
          edgeData={configEdge.data}
          sourceNode={configEdge.sourceNode}
          targetNode={configEdge.targetNode}
          onClose={() => setConfigEdge(null)}
        />
      )}
    </div>
  )
}