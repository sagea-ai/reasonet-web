'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { WorkspaceHeader } from './workspace-header'
import { WorkspaceContent } from './workspace-content'
import { useUser } from '@clerk/nextjs'

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
  organization: Organization
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

interface WorkspaceDetailClientProps {
  workspace: Workspace
  organizations: Organization[]
  currentOrganization: Organization
}

export function WorkspaceDetailClient({ 
  workspace, 
  organizations, 
  currentOrganization 
}: WorkspaceDetailClientProps) {
  const { user } = useUser()

  const handleOrganizationChange = (orgId: string) => {
    // Navigate to workspaces page with new organization
    window.location.href = '/workspaces'
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
        <WorkspaceHeader workspace={workspace} />
        <WorkspaceContent workspace={workspace} />
      </div>
    </AppLayout>
  )
}
