'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, FileText, Users, Plus, Activity } from 'lucide-react'
import {Badge} from '@/components/ui/badge'

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

interface WorkspaceContentProps {
  workspace: Workspace
}

export function WorkspaceContent({ workspace }: WorkspaceContentProps) {
  return (
    <div className="mt-8">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analyses">Analyses</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workspace._count.analyses}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workspace._count.members}</div>
                <p className="text-xs text-muted-foreground">
                  +1 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  2 completed this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New analysis created</p>
                    <p className="text-xs text-gray-500">2 hours ago by John Doe</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Users className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Member added to workspace</p>
                    <p className="text-xs text-gray-500">1 day ago by Admin</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Analyses</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
          
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
              <p className="text-gray-500 text-center mb-6">
                Start your first analysis to begin working with data in this workspace.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Analysis
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Members</h3>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {workspace.creator.firstName?.[0] || workspace.creator.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">
                    {workspace.creator.firstName} {workspace.creator.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{workspace.creator.email}</p>
                </div>
                <div className="ml-auto">
                  <Badge>Owner</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <h3 className="text-lg font-medium">Activity Feed</h3>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center py-8">
                No recent activity to show.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
