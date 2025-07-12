'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  slug: string
}

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  onWorkspaceCreated: () => void
}

const WORKSPACE_ICONS = [
  '📝', '📊', '🚀', '💡', '🔬', '📈', '🎯', '💻', 
  '🏗️', '🎨', '📱', '🌟', '🔧', '📋', '💼', '🎪'
]

export function CreateWorkspaceDialog({ 
  open, 
  onOpenChange, 
  organizations, 
  onWorkspaceCreated 
}: CreateWorkspaceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📝',
    isPrivate: false,
    organizationId: organizations[0]?.id || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a workspace name')
      return
    }

    if (!formData.organizationId) {
      toast.error('Please select an organization')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Workspace created successfully!')
        onWorkspaceCreated()
        onOpenChange(false)
        setFormData({
          name: '',
          description: '',
          icon: '📝',
          isPrivate: false,
          organizationId: organizations[0]?.id || ''
        })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create workspace')
      }
    } catch (error) {
      toast.error('Failed to create workspace. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name *</Label>
            <Input
              id="name"
              placeholder="My Awesome Project"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's this workspace for?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2">
              {WORKSPACE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  disabled={isSubmitting}
                  className={`
                    p-2 text-xl rounded-lg border transition-colors
                    ${formData.icon === icon 
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization *</Label>
            <Select 
              value={formData.organizationId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Private Workspace</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Only invited members can access this workspace
              </p>
            </div>
            <Switch
              checked={formData.isPrivate}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 bg-sky-600 hover:bg-sky-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
