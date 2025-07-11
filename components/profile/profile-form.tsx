'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserCircle, Mail, Calendar, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  referralCode: string;
  createdAt: Date;
}

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim() || null,
          lastName: formData.lastName.trim() || null,
        }),
      })

      if (response.ok) {
        toast.success("Your profile has been updated successfully.")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update profile")
      }
    } catch (error) {
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(user.referralCode)
      setCopied(true)
      toast.success("Referral code copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy referral code")
    }
  }

  const getReferralUrl = () => {
    return `${window.location.origin}/onboarding?ref=${user.referralCode}`
  }

  const copyReferralUrl = async () => {
    try {
      await navigator.clipboard.writeText(getReferralUrl())
      toast.success("Referral URL copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy referral URL")
    }
  }

  const hasChanges = formData.firstName !== (user.firstName || '') || 
                    formData.lastName !== (user.lastName || '')

  return (
    <div className="space-y-10 p-0">
      {/* Profile Information */}
      <div className="border-b border-gray-100 dark:border-gray-800 px-8 pt-8 pb-10 bg-gradient-to-r from-sky-50 to-white dark:from-sky-950/10 dark:to-gray-950 rounded-t-lg">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <Avatar className="h-24 w-24 shadow-lg border-4 border-sky-100 dark:border-sky-900">
            <AvatarImage src={user.imageUrl || undefined} />
            <AvatarFallback className="bg-sky-100 text-sky-600 text-2xl">
              {(formData.firstName?.[0] || user.email[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {formData.firstName || formData.lastName 
                ? `${formData.firstName} ${formData.lastName}`.trim()
                : 'User'
              }
            </h3>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
            </div>
            <Badge variant="secondary" className="mt-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-200 border-none">
              Member since {format(new Date(user.createdAt), 'MMM yyyy')}
            </Badge>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Enter your first name"
              disabled={isSubmitting}
              className="bg-white dark:bg-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Enter your last name"
              disabled={isSubmitting}
              className="bg-white dark:bg-gray-900"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-50 dark:bg-gray-800"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Email address cannot be changed. Contact support if you need to update this.
            </p>
          </div>
          <div className="flex md:col-span-2 justify-end">
            <Button
              type="submit"
              disabled={!hasChanges || isSubmitting}
              className="bg-sky-600 hover:bg-sky-700 text-white px-6"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Referral Information */}
      <div className="px-8 pb-8 pt-6 bg-white dark:bg-gray-950 rounded-b-lg">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-sky-600" />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Referral Program</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Your referral code</Label>
            <div className="flex gap-2">
              <Input
                value={user.referralCode}
                readOnly
                className="bg-gray-50 dark:bg-gray-800 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyReferralCode}
                className="shrink-0 border-sky-200 dark:border-sky-700"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Referral URL</Label>
            <div className="flex gap-2">
              <Input
                value={getReferralUrl()}
                readOnly
                className="bg-gray-50 dark:bg-gray-800 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyReferralUrl}
                className="shrink-0 border-sky-200 dark:border-sky-700"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-lg border border-sky-200 dark:border-sky-800 mt-4">
          <h4 className="font-medium text-sky-900 dark:text-sky-100 mb-1">
            How it works
          </h4>
          <ul className="text-sm text-sky-700 dark:text-sky-300 space-y-1">
            <li>• Share your referral code or URL with friends</li>
            <li>• They sign up and complete onboarding</li>
            <li>• You both get $5 in credits automatically</li>
          </ul>
        </div>
      </div>
    </div>
  )
}