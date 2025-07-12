'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, MoreHorizontal } from 'lucide-react'
import { RichTextEditor } from './rich-text-editor'
import { toast } from 'sonner'

interface WorkspaceActivity {
  id: string
  content: {
    html: string
    text: string
    mentions: string[]
  }
  level: number
  createdAt: string
  author: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    imageUrl?: string
  }
  replies?: WorkspaceActivity[]
}

interface Member {
  id: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    imageUrl?: string
  }
}

interface WorkspaceActivityFeedProps {
  workspaceId: string
  members: Member[]
}

export function WorkspaceActivityFeed({ workspaceId, members }: WorkspaceActivityFeedProps) {
  const [activities, setActivities] = useState<WorkspaceActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/activities`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        toast.error('Failed to load activities')
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [workspaceId])

  const handlePostActivity = async (content: any, mentions: string[], parentId?: string, level = 0) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          mentions,
          parentId,
          level
        }),
      })

      if (response.ok) {
        toast.success('Activity posted!')
        fetchActivities()
        setReplyingTo(null)
      } else {
        toast.error('Failed to post activity')
      }
    } catch (error) {
      console.error('Error posting activity:', error)
      toast.error('Failed to post activity')
    }
  }

  const renderActivity = (activity: WorkspaceActivity) => {
    const authorName = `${activity.author.firstName || ''} ${activity.author.lastName || ''}`.trim() || 'Unnamed User'
    
    return (
      <div key={activity.id} className="space-y-4">
        <div className={`flex gap-3 ${activity.level > 0 ? `ml-${activity.level * 6}` : ''}`}>
          <Avatar className="h-8 w-8 mt-1">
            <AvatarImage src={activity.author.imageUrl} />
            <AvatarFallback className="text-xs">
              {activity.author.firstName?.[0] || activity.author.email[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{authorName}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: activity.content.html }}
              />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === activity.id ? null : activity.id)}
                className="h-7 px-2 text-xs text-gray-500"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
            
            {replyingTo === activity.id && (
              <div className="mt-3">
                <RichTextEditor
                  onSubmit={(content, mentions) => 
                    handlePostActivity(content, mentions, activity.id, activity.level + 1)
                  }
                  members={members}
                  placeholder="Write a reply..."
                  level={activity.level + 1}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Render replies */}
        {activity.replies && activity.replies.map(reply => renderActivity(reply))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mt-1" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Activity Editor */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h3 className="text-lg font-medium mb-4">Share an update</h3>
        <RichTextEditor
          onSubmit={handlePostActivity}
          members={members}
          placeholder="What's happening in this workspace?"
        />
      </div>

      {/* Activities Feed */}
      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No activities yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to share an update in this workspace.
            </p>
          </div>
        ) : (
          activities.map(activity => renderActivity(activity))
        )}
      </div>
    </div>
  )
}
