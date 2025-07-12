'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { InviteWorkspaceMemberDialog } from './invite-workspace-member-dialog'
import { WorkspaceActivityFeed } from './workspace-activity-feed'
import { RichTextEditor } from './rich-text-editor'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { 
  BarChart3, 
  FileText, 
  Users, 
  Plus, 
  Activity, 
  Mail,
  TrendingUp,
  AlertTriangle,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Bell,
  Send,
  X
} from 'lucide-react'

interface WorkspaceMember {
  id: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  createdAt: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    imageUrl?: string
  }
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

interface WorkspaceContentProps {
  workspace: Workspace
}

interface Scenario {
  id: string
  title: string
  type: string
  probability: number
  timeframe: string
  description: string
  marketData?: string
  verifiableFactors?: string
  backwardReasoning?: string
  createdAt: string
  workspace: {
    id: string
    name: string
    slug: string
    icon: string
  }
}

export function WorkspaceContent({ workspace }: WorkspaceContentProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loadingScenarios, setLoadingScenarios] = useState(true)
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set())
  const [pingingScenario, setPingingScenario] = useState<string | null>(null)
  const [pingMessage, setPingMessage] = useState('')

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      } else {
        toast.error('Failed to load members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [workspace.id])

  const handleMemberInvited = () => {
    fetchMembers()
  }

  // Fetch scenarios for this workspace
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspace.id}/scenarios`)
        if (response.ok) {
          const data = await response.json()
          setScenarios(data)
        }
      } catch (error) {
        console.error('Error fetching scenarios:', error)
      } finally {
        setLoadingScenarios(false)
      }
    }

    fetchScenarios()
  }, [workspace.id])

  const getScenarioIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'growth':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'challenge':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'opportunity':
        return <Zap className="h-4 w-4 text-blue-500" />
      case 'risk':
        return <Shield className="h-4 w-4 text-yellow-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getScenarioColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'growth':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'challenge':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'opportunity':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const toggleScenarioExpansion = (scenarioId: string) => {
    setExpandedScenarios(prev => {
      const newSet = new Set(prev)
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId)
      } else {
        newSet.add(scenarioId)
      }
      return newSet
    })
  }

  const getUserInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`
    }
    if (firstName) {
      return firstName[0]
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const handlePingClick = (scenarioId: string) => {
    setPingingScenario(scenarioId)
    setPingMessage('')
  }

  const handlePingSubmit = async (content: any, mentions: string[], scenarioId: string, scenarioTitle: string) => {
    if (!content.text.trim()) {
      toast.error('Please enter a message to ping')
      return
    }

    try {
      // Here you would normally send the ping to your API with rich content
      // For now, we'll just show a toast
      const mentionCount = mentions.length
      const mentionText = mentionCount > 0 ? ` (mentioning ${mentionCount} member${mentionCount > 1 ? 's' : ''})` : ''
      toast.success(`Pinged scenario: ${scenarioTitle}${mentionText}`)
      
      // Reset the ping state
      setPingingScenario(null)
      setPingMessage('')
    } catch (error) {
      console.error('Error sending ping:', error)
      toast.error('Failed to send ping')
    }
  }

  const handlePingCancel = () => {
    setPingingScenario(null)
    setPingMessage('')
  }

  return (
    <div className="mt-8">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analyses">Analyses</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Feed</TabsTrigger>
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
                <CardTitle className="text-sm font-medium">Saved Scenarios</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scenarios.length}</div>
                <p className="text-xs text-muted-foreground">
                  From workflow analyses
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
            <h3 className="text-lg font-medium">Members ({members.length})</h3>
            <Button onClick={() => setShowInviteDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
          
          {loadingMembers ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 py-2">
                      <Avatar>
                        <AvatarImage src={member.user.imageUrl} />
                        <AvatarFallback>
                          {getUserInitials(member.user.firstName, member.user.lastName, member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                      <Badge className={getScenarioColor(member.role)}>
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="space-y-6">
            {/* Scenarios Section */}
            {loadingScenarios ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Saved Scenarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : scenarios.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Saved Scenarios ({scenarios.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scenarios.map((scenario) => {
                      const isExpanded = expandedScenarios.has(scenario.id)
                      const isPinging = pingingScenario === scenario.id
                      
                      return (
                        <div key={scenario.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getScenarioIcon(scenario.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                                    {scenario.title}
                                  </h4>
                                  <Badge className={`${getScenarioColor(scenario.type)} text-xs`}>
                                    {scenario.type}
                                  </Badge>
                                  <span className="text-sm font-semibold text-green-600">
                                    {scenario.probability}%
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePingClick(scenario.id)}
                                  className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                                  disabled={isPinging}
                                >
                                  <Bell className="h-3 w-3 mr-1" />
                                  Ping
                                </Button>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {isExpanded 
                                      ? scenario.description 
                                      : `${scenario.description.substring(0, 120)}...`
                                    }
                                  </p>
                                </div>

                                {isExpanded && (
                                  <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    {scenario.marketData && (
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                          Market Data
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {scenario.marketData}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {scenario.verifiableFactors && (
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                          Verifiable Factors
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {scenario.verifiableFactors}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {scenario.backwardReasoning && (
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                          Reasoning Process
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {scenario.backwardReasoning}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isPinging && (
                                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Bell className="h-4 w-4 text-blue-600" />
                                      <h6 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Add a note to this ping
                                      </h6>
                                    </div>
                                    
                                    <div className="mb-3">
                                      <RichTextEditor
                                        onSubmit={(content, mentions) => 
                                          handlePingSubmit(content, mentions, scenario.id, scenario.title)
                                        }
                                        members={members.map(member => ({
                                          id: member.id,
                                          user: member.user
                                        }))}
                                        placeholder="Type @ to mention someone..."
                                        className="border-blue-200 dark:border-blue-700"
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePingCancel}
                                        className="h-7 px-3 text-xs"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>{scenario.timeframe}</span>
                                  <span>{formatDistanceToNow(new Date(scenario.createdAt), { addSuffix: true })}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleScenarioExpansion(scenario.id)}
                                  className="h-7 px-3 text-xs"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      Less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      More
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Saved Scenarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No scenarios yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Run workflow analyses to generate and save scenarios here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkspaceActivityFeed 
                  workspaceId={workspace.id} 
                  members={members.map(member => ({
                    id: member.id,
                    user: member.user
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <InviteWorkspaceMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        onMemberInvited={handleMemberInvited}
      />
    </div>
  )
}