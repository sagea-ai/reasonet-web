'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { WorkspaceList } from './workspace-list'
import { CreateWorkspaceDialog } from './create-workspace-dialog'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  slug: string
}

interface Workspace {
  id: string
  name: string
  description?: string
  icon: string
  isPrivate: boolean
  slug: string
  createdAt: string
  updatedAt: string
  organization: {
    id: string
    name: string
    slug: string
  }
  creator: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
  _count: {
    members: number
    analyses: number
  }
}

interface WorkspacesPageClientProps {
  organizations: Organization[]
  currentOrganization: Organization
}

export function WorkspacesPageClient({ 
  organizations, 
  currentOrganization: initialOrganization 
}: WorkspacesPageClientProps) {
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { user } = useUser()

  const fetchWorkspaces = async (orgId?: string) => {
    try {
      const url = orgId 
        ? `/api/workspaces?organizationId=${orgId}` 
        : '/api/workspaces'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data)
      } else {
        toast.error('Failed to fetch workspaces')
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      toast.error('Failed to fetch workspaces')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspaces(currentOrganization.id)
  }, [currentOrganization.id])

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrganization(org)
      setIsLoading(true)
      fetchWorkspaces(orgId)
    }
  }

  const handleWorkspaceCreated = () => {
    fetchWorkspaces(currentOrganization.id)
  }

  if (isLoading) {
    return (
      <AppLayout
        organizations={organizations}
        currentOrganization={currentOrganization}
        onOrganizationChange={handleOrganizationChange}
        user={{
          fullName: user?.fullName || undefined,
          firstName: user?.firstName || undefined,
          lastName: user?.lastName || undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      organizations={organizations}
      currentOrganization={currentOrganization}
      onOrganizationChange={handleOrganizationChange}
      user={{
        fullName: user?.fullName || undefined,
        firstName: user?.firstName || undefined,
        lastName: user?.lastName || undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WorkspaceList 
          workspaces={workspaces}
          onCreateWorkspace={() => setShowCreateDialog(true)}
        />
        
        <CreateWorkspaceDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          organizations={organizations}
          onWorkspaceCreated={handleWorkspaceCreated}
        />
      </div>
    </AppLayout>
  )
}
