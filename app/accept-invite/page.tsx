'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Building2, Users, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

interface InvitationData {
  id: string
  email: string
  role: string
  organizationName: string
  organizationId: string
  invitedByName: string
  expiresAt: string
  isExpired: boolean
  isAccepted: boolean
}

function AcceptInviteContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const orgId = searchParams.get('org')

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !orgId) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    fetchInvitation()
  }, [token, orgId])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/validate?token=${token}&org=${orgId}`)
      const data = await response.json()

      if (response.ok) {
        setInvitation(data)
      } else {
        setError(data.error || 'Invalid invitation')
      }
    } catch (err) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!token || !orgId || !isLoaded || !user) return

    setAccepting(true)
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          organizationId: orgId
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Successfully joined the organization!')
        router.push('/dashboard')
      } else {
        toast.error(result.error || 'Failed to accept invitation')
        setError(result.error)
      }
    } catch (err) {
      toast.error('Failed to accept invitation')
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logohq.png" alt="Reasonet" width={48} height={48} className="rounded-lg" />
            </div>
            <CardTitle className="text-xl">Sign in to accept invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to sign in to accept this organization invitation.
            </p>
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`}>
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.isAccepted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-green-600">Already Accepted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have already accepted this invitation and are a member of <strong>{invitation.organizationName}</strong>.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logohq.png" alt="Reasonet" width={48} height={48} className="rounded-lg mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Join Organization</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{invitation.organizationName}</CardTitle>
                <p className="text-sm text-gray-500">Organization Invitation</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Your role:</span>
                <Badge variant="secondary">{invitation.role}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Invited by:</span>
                <span className="text-sm font-medium">{invitation.invitedByName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Your email:</span>
                <span className="text-sm font-medium">{invitation.email}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                By accepting this invitation, you'll join <strong>{invitation.organizationName}</strong> and gain access to their repositories and analysis tools.
              </p>
              
              <Button 
                onClick={handleAcceptInvitation}
                disabled={accepting || invitation.isExpired}
                className="w-full"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Accepting...
                  </>
                ) : invitation.isExpired ? (
                  'Invitation Expired'
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AcceptInviteFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading invitation...</p>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteFallback />}>
      <AcceptInviteContent />
    </Suspense>
  )
}
