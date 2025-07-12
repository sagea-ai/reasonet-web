import { create } from 'zustand'
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react'

interface SimulateState {
  nodes: Node[]
  edges: Edge[]
  history: { nodes: Node[]; edges: Edge[] }[]
  historyIndex: number
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: Node) => void
  removeNode: (nodeId: string) => void
  updateNodeData: (nodeId: string, newData: any) => void
  updateEdgeData: (edgeId: string, newData: any) => void
  clearCanvas: () => void
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  saveToHistory: () => void
  generateWorkflowPrompt: () => string
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
}

const initialState = {
  nodes: [],
  edges: [],
  history: [{ nodes: [], edges: [] }],
  historyIndex: 0,
}

const generateNodeId = (nodeType: string) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${nodeType}-${timestamp}-${random}`
}

const generateEdgeId = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `edge-${timestamp}-${random}`
}

export const useSimulateStore = create<SimulateState>((set, get) => ({
  ...initialState,

  setNodes: (nodes) => {
    set({ nodes })
    get().saveToHistory()
  },

  setEdges: (edges) => {
    set({ edges })
    get().saveToHistory()
  },

  onNodesChange: (changes) => {
    console.log('onNodesChange called with:', changes)
    
    const significantChanges = changes.filter(change => 
      change.type !== 'select' && change.type !== 'remove'
    )
    
    if (significantChanges.length === 0) {
      set((state) => {
        const newNodes = applyNodeChanges(changes, state.nodes)
        return { nodes: newNodes }
      })
      return
    }
    
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes)
      console.log('Nodes after change:', newNodes.map(n => ({ id: n.id, label: n.data?.label })))
      return { nodes: newNodes }
    })
  },

  onEdgesChange: (changes) => {
    console.log('onEdgesChange called with:', changes)
    
    const significantChanges = changes.filter(change => 
      change.type !== 'select' && change.type !== 'remove'
    )
    
    if (significantChanges.length === 0) {
      set((state) => {
        const newEdges = applyEdgeChanges(changes, state.edges)
        return { edges: newEdges }
      })
      return
    }
    
    set((state) => {
      const newEdges = applyEdgeChanges(changes, state.edges)
      console.log('Edges after change:', newEdges.map(e => ({ id: e.id, source: e.source, target: e.target })))
      return { edges: newEdges }
    })
  },

  onConnect: (connection) => {
    console.log('onConnect called with:', connection)
    set((state) => {
      const newEdge = {
        ...connection,
        id: generateEdgeId(),
        type: 'custom',
        data: {},
      }
      console.log('Creating new edge:', newEdge)
      const newEdges = [...state.edges, newEdge]
      return { edges: newEdges }
    })
    get().saveToHistory()
  },

  addNode: (node) => {
    console.log('addNode called with:', node)
    
    const nodeWithId = {
      ...node,
      id: node.id || generateNodeId(typeof node.data?.nodeType === 'string' ? node.data.nodeType : 'node')
    }
    
    console.log('Adding node with ID:', nodeWithId.id)
    
    set((state) => {
      const existingNode = state.nodes.find(n => n.id === nodeWithId.id)
      if (existingNode) {
        console.warn('Node already exists:', nodeWithId.id)
        return state
      }
      
      const newNodes = [...state.nodes, nodeWithId]
      console.log('Nodes after add:', newNodes.map(n => ({ id: n.id, label: n.data?.label })))
      return { nodes: newNodes }
    })
    get().saveToHistory()
  },

  removeNode: (nodeId) => {
    console.log('removeNode called with:', nodeId)
    set((state) => {
      const newNodes = state.nodes.filter((node) => node.id !== nodeId)
      const newEdges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      )
      console.log('Nodes after remove:', newNodes.map(n => ({ id: n.id, label: n.data?.label })))
      return { nodes: newNodes, edges: newEdges }
    })
    get().saveToHistory()
  },

  updateNodeData: (nodeId, newData) => {
    console.log('updateNodeData called:', { nodeId, newData })
    
    if (!nodeId || typeof nodeId !== 'string') {
      console.error('Invalid nodeId:', nodeId)
      return
    }
    
    const currentState = get()
    console.log('Current nodes before update:', currentState.nodes.map(n => ({ id: n.id, label: n.data?.label })))
    
    const nodeExists = currentState.nodes.find(node => node.id === nodeId)
    if (!nodeExists) {
      console.error('Node not found:', nodeId)
      console.log('Available nodes:', currentState.nodes.map(n => ({ id: n.id, label: n.data?.label })))
      return false
    }

    try {
      set((state) => {
        const newNodes = state.nodes.map((node) => {
          if (node.id === nodeId) {
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                ...newData,
              },
            }
            console.log('Updated node:', updatedNode)
            return updatedNode
          }
          return node
        })
        
        console.log('New nodes after update:', newNodes.map(n => ({ id: n.id, label: n.data?.label })))
        return { nodes: newNodes }
      })
      
      get().saveToHistory()
      return true
    } catch (error) {
      console.error('Error updating node data:', error)
      return false
    }
  },

  updateEdgeData: (edgeId, newData) => {
    console.log('updateEdgeData called:', { edgeId, newData })
    
    if (!edgeId || typeof edgeId !== 'string') {
      console.error('Invalid edgeId:', edgeId)
      return false
    }
    
    const currentState = get()
    console.log('Current edges before update:', currentState.edges.map(e => ({ id: e.id, source: e.source, target: e.target })))
    
    const edgeExists = currentState.edges.find(edge => edge.id === edgeId)
    if (!edgeExists) {
      console.error('Edge not found:', edgeId)
      console.log('Available edges:', currentState.edges.map(e => ({ id: e.id, source: e.source, target: e.target })))
      
      if (newData && newData.sourceNode && newData.targetNode) {
        console.log('Attempting to recreate edge...')
        const recreatedEdge = {
          id: edgeId,
          source: newData.sourceNode.id,
          target: newData.targetNode.id,
          type: 'custom',
          data: newData,
        }
        
        try {
          set((state) => {
            const newEdges = [...state.edges, recreatedEdge]
            console.log('Recreated edge:', recreatedEdge)
            return { edges: newEdges }
          })
          get().saveToHistory()
          return true
        } catch (error) {
          console.error('Error recreating edge:', error)
          return false
        }
      }
      return false
    }

    try {
      set((state) => {
        const newEdges = state.edges.map((edge) => {
          if (edge.id === edgeId) {
            const updatedEdge = {
              ...edge,
              data: {
                ...edge.data,
                ...newData,
              },
            }
            console.log('Updated edge:', updatedEdge)
            return updatedEdge
          }
          return edge
        })
        
        console.log('New edges after update:', newEdges.map(e => ({ id: e.id, source: e.source, target: e.target })))
        return { edges: newEdges }
      })
      
      get().saveToHistory()
      return true
    } catch (error) {
      console.error('Error updating edge data:', error)
      return false
    }
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [] })
    get().saveToHistory()
  },

  get canUndo() {
    return get().historyIndex > 0
  },

  get canRedo() {
    return get().historyIndex < get().history.length - 1
  },

  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const previousState = state.history[state.historyIndex - 1]
      console.log('Undoing to state:', previousState)
      set({
        nodes: previousState.nodes.map((node) => ({ 
          ...node, 
          data: { ...node.data },
          position: { ...node.position }
        })),
        edges: previousState.edges.map((edge) => ({ 
          ...edge, 
          data: { ...edge.data } 
        })),
        historyIndex: state.historyIndex - 1,
      })
    }
  },

  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1]
      console.log('Redoing to state:', nextState)
      set({
        nodes: nextState.nodes.map((node) => ({ 
          ...node, 
          data: { ...node.data },
          position: { ...node.position }
        })),
        edges: nextState.edges.map((edge) => ({ 
          ...edge, 
          data: { ...edge.data } 
        })),
        historyIndex: state.historyIndex + 1,
      })
    }
  },

  saveToHistory: () => {
    const { nodes, edges, history, historyIndex } = get()
    
    console.log('Saving to history, current state:', {
      nodes: nodes.map(n => ({ id: n.id, label: n.data?.label })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    })

    const nodesCopy = nodes.map((node) => ({
      ...node,
      data: { ...node.data },
      position: { ...node.position }
    }))
    const edgesCopy = edges.map((edge) => ({ 
      ...edge, 
      data: { ...edge.data } 
    }))

    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({
      nodes: nodesCopy,
      edges: edgesCopy,
    })

    if (newHistory.length > 10) {
      newHistory.shift()
    }

    console.log('History saved, new history length:', newHistory.length)

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  generateWorkflowPrompt: () => {
    const { nodes, edges } = get()

    if (nodes.length === 0) {
      return 'No workflow components have been added yet.'
    }

    let prompt = 'Here is my complete workflow:\n\n'

    prompt += '=== COMPONENTS ===\n'
    nodes.forEach((node, index) => {
      const label = node.data?.label || `Node ${index + 1}`
      const nodeType = node.data?.nodeType || 'component'
      prompt += `${index + 1}. ${label} (${nodeType})\n`
      if (node.data?.description) {
        prompt += `   Description: ${node.data.description}\n`
      }
      if (node.data?.customConfig) {
        prompt += `   Configuration: ${node.data.customConfig}\n`
      }
      prompt += '\n'
    })

    if (edges.length > 0) {
      prompt += '=== WORKFLOW STEPS ===\n'
      
      const sortedEdges = edges.sort((a, b) => {
        const aStep = Number(a.data?.stepNumber) || 999
        const bStep = Number(b.data?.stepNumber) || 999
        return aStep - bStep
      })

      sortedEdges.forEach((edge, index) => {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        const targetNode = nodes.find((n) => n.id === edge.target)
        
        const stepNumber = edge.data?.stepNumber || `${index + 1}`
        const sourceLabel = sourceNode?.data?.label || 'Unknown Source'
        const targetLabel = targetNode?.data?.label || 'Unknown Target'
        
        prompt += `Step ${stepNumber}: ${sourceLabel} → ${targetLabel}\n`
        
        if (edge.data?.description) {
          prompt += `   Flow: ${edge.data.description}\n`
        }
        prompt += '\n'
      })
    }

    prompt += '\nPlease help me understand this workflow and suggest improvements.'

    return prompt
  },
}))