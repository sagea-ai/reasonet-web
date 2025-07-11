'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Users, Mail, ArrowLeft } from 'lucide-react'

interface InviteTeamStepProps {
  onComplete: (data: { invitedEmails: string[] }) => void
  onBack: () => void
  isSubmitting?: boolean
}

export function InviteTeamStep({ onComplete, onBack, isSubmitting }: InviteTeamStepProps) {
  const [emails, setEmails] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState('')

  const addEmail = () => {
    if (currentEmail && currentEmail.includes('@') && !emails.includes(currentEmail)) {
      setEmails([...emails, currentEmail])
      setCurrentEmail('')
    }
  }

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const handleComplete = () => {
    console.log('Team invite data:', { invitedEmails: emails })
    onComplete({ invitedEmails: emails })
  }

  const handleSkip = () => {
    console.log('Skipping team invite')
    onComplete({ invitedEmails: [] })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-800 dark:to-sky-900 rounded-2xl flex items-center justify-center">
          <Users className="h-8 w-8 text-sky-600 dark:text-sky-400" />
        </div>
        <h2 className="text-2xl font-extralight text-gray-900 dark:text-white mb-3 tracking-tight">
          Invite Your Team
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
          Collaborate with your team on bug detection and fixes
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Mail className="h-4 w-4 text-sky-500" />
            Email addresses
          </Label>
          <div className="flex gap-3">
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addEmail()}
              disabled={isSubmitting}
              className="h-12 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-xl"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addEmail}
              disabled={!currentEmail || !currentEmail.includes('@') || isSubmitting}
              className="h-12 px-4 border-gray-200 dark:border-gray-700 hover:bg-sky-50 hover:border-sky-300 rounded-xl"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {emails.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Invited team members ({emails.length})
            </Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {emails.map((email, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-800">
                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-800 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmail(index)}
                    disabled={isSubmitting}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 h-12 border-gray-200 dark:border-gray-700 hover:bg-gray-50 rounded-xl font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium tracking-wide transition-all duration-200 ease-out hover:shadow-lg hover:shadow-sky-200"
          >
            {isSubmitting ? 'Completing...' : 'Complete Setup'}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
        >
          {isSubmitting ? 'Completing...' : 'Skip for now'}
        </Button>
      </div>
    </div>
  )
}
