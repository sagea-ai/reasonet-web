'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Mail, UserPlus } from 'lucide-react'

interface InviteWorkspaceMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  workspaceName: string
  onMemberInvited: () => void
}

export function InviteWorkspaceMemberDialog({ 
  open, 
  onOpenChange, 
  workspaceId,
  workspaceName,
  onMemberInvited 
}: InviteWorkspaceMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER' | 'VIEWER'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Invitation sent successfully!')
        onMemberInvited()
        onOpenChange(false)
        setFormData({
          email: '',
          role: 'MEMBER'
        })
      } else {
        toast.error(result.error || 'Failed to send invitation')
      }
    } catch (error) {
      toast.error('Failed to send invitation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite to {workspaceName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isSubmitting}
              className="h-12"
            />
            <p className="text-xs text-gray-500">
              If the person isn't in your organization yet, they'll be invited to join both the organization and this workspace.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Workspace Role *</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'ADMIN' | 'MEMBER' | 'VIEWER' }))}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Viewer</span>
                    <span className="text-xs text-gray-500">Can view analyses and data</span>
                  </div>
                </SelectItem>
                <SelectItem value="MEMBER">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Member</span>
                    <span className="text-xs text-gray-500">Can create and edit analyses</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-gray-500">Can manage workspace and invite members</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
              disabled={isSubmitting || !formData.email.trim()}
              className="flex-1 bg-sky-600 hover:bg-sky-700"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
