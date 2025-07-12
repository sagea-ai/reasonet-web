'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IoBusinessOutline, IoAddOutline, IoCheckmarkCircleOutline } from 'react-icons/io5'

interface Workspace {
  id: string
  name: string
  slug: string
  icon: string
  _count: {
    members: number
    analyses: number
  }
}

interface WorkspaceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onWorkspaceSelect: (workspaceId: string) => void
  currentOrganization: {
    id: string
    name: string
  }
}

export function WorkspaceSelectionModal({
  isOpen,
  onClose,
  onWorkspaceSelect,
  currentOrganization
}: WorkspaceSelectionModalProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces()
    }
  }, [isOpen])

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces?organizationId=${currentOrganization.id}`)
      if (!response.ok) throw new Error('Failed to fetch workspaces')
      
      const data = await response.json()
      setWorkspaces(data)
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      toast.error('Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }

  const handleWorkspaceSelect = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId)
    onWorkspaceSelect(workspaceId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IoBusinessOutline className="w-5 h-5" />
            Select Workspace to Save Scenario
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No workspaces found. Create one first to save scenarios.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {workspaces.map((workspace) => (
                <Card 
                  key={workspace.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                  onClick={() => handleWorkspaceSelect(workspace.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{workspace.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {workspace.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {workspace.slug}
                          </p>
                        </div>
                      </div>
                      <IoAddOutline className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {workspace._count.members} members
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {workspace._count.analyses} analyses
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}