'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, BarChart3, Lock, Globe, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface WorkspaceListProps {
  workspaces: Workspace[]
  onCreateWorkspace: () => void
}

export function WorkspaceList({ workspaces, onCreateWorkspace }: WorkspaceListProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Workspaces
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Organize your team's work into focused spaces
          </p>
        </div>
        <Button onClick={onCreateWorkspace} className="bg-sky-600 hover:bg-sky-700">
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
              Create your first workspace to start organizing your team's analyses and projects.
            </p>
            <Button onClick={onCreateWorkspace} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card 
              key={workspace.id} 
              className="hover:shadow-md transition-shadow cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{workspace.icon}</div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {workspace.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {workspace.organization.name}
                        </Badge>
                        {workspace.isPrivate ? (
                          <Lock className="h-3 w-3 text-gray-400" />
                        ) : (
                          <Globe className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/workspaces/${workspace.id}`}>
                          Open workspace
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/workspaces/${workspace.id}/settings`}>
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {workspace.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-2">
                    {workspace.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {workspace._count.members}
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      {workspace._count.analyses}
                    </div>
                  </div>
                  <span>
                    {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
                  </span>
                </div>
                <Link href={`/workspaces/${workspace.id}`}>
                  <Button variant="outline" className="w-full">
                    Open Workspace
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
