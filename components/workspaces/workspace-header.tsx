'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Settings, Users, Lock, Globe, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

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

interface WorkspaceHeaderProps {
  workspace: Workspace
}

export function WorkspaceHeader({ workspace }: WorkspaceHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link 
          href="/workspaces" 
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Workspaces
        </Link>
        <span>/</span>
        <span>{workspace.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{workspace.icon}</div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {workspace.name}
              </h1>
              {workspace.isPrivate ? (
                <Lock className="h-5 w-5 text-gray-400" />
              ) : (
                <Globe className="h-5 w-5 text-gray-400" />
              )}
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <Badge variant="outline">{workspace.organization.name}</Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4" />
                {workspace._count.members} members
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Updated {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
              </span>
            </div>

            {workspace.description && (
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
                {workspace.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
