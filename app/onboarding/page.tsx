'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Globe, Users, Mail, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

function OnboardingContent() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    companySize: '',
    industry: '',
    referralCode: referralCode || '',
    invitedEmails: [] as string[],
    currentEmail: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded || !user) return

      try {
        const response = await fetch('/api/user/onboarding-status')
        if (response.ok) {
          const { hasCompletedOnboarding } = await response.json()
          if (hasCompletedOnboarding) {
            router.push('/dashboard')
            return
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkOnboardingStatus()
  }, [isLoaded, user, router])

  // Show loading while checking status
  if (!isLoaded || isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const validateField = (key: string, value: string) => {
    const newErrors = { ...errors }
    
    if (key === 'companyName') {
      if (!value.trim()) {
        newErrors.companyName = 'Company name is required'
      } else if (value.trim().length < 2) {
        newErrors.companyName = 'Company name must be at least 2 characters'
      } else {
        delete newErrors.companyName
      }
    }
    
    if (key === 'website') {
      if (value.trim()) {
        try {
          const url = value.startsWith('http') ? value : `https://${value}`
          new URL(url)
          delete newErrors.website
        } catch {
          newErrors.website = 'Please enter a valid website URL'
        }
      } else {
        delete newErrors.website
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    validateField(key, value)
  }

  const addEmail = () => {
    if (formData.currentEmail && formData.currentEmail.includes('@') && !formData.invitedEmails.includes(formData.currentEmail)) {
      setFormData(prev => ({
        ...prev,
        invitedEmails: [...prev.invitedEmails, prev.currentEmail],
        currentEmail: ''
      }))
    }
  }

  const removeEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      invitedEmails: prev.invitedEmails.filter((_, i) => i !== index)
    }))
  }

  const handleComplete = async () => {
    const isCompanyNameValid = validateField('companyName', formData.companyName)
    const isWebsiteValid = validateField('website', formData.website)
    
    if (!isCompanyNameValid) {
      toast.error('Please enter a valid company name')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const website = formData.website.trim() 
        ? (formData.website.startsWith('http') ? formData.website : `https://${formData.website}`)
        : ''
      
      const payload = {
        companyName: formData.companyName,
        website,
        companySize: formData.companySize,
        industry: formData.industry,
        referralCode: formData.referralCode,
        invitedEmails: formData.invitedEmails
      }

      console.log('Completing onboarding with data:', payload)
      
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Welcome to Reasonet!')
        router.push('/dashboard') 
      } else {
        console.error('Onboarding failed:', result)
        setError(result.error || result.details || 'Failed to complete setup')
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      setError('Failed to complete setup. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = formData.companyName && Object.keys(errors).length === 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-6">
              <Image
                src="/logohq.png"
                alt="Reasonet"
                width={48}
                height={48}
                className="rounded-lg"
              />
            </div>
            <h1 className="text-3xl font-extralight text-gray-900 dark:text-white mb-3 tracking-tight">
              Welcome to Reasonet
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light leading-relaxed">
              Set up your organization to start analyzing code and catching bugs
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Main Form Card */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
            <CardHeader className="pb-6 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-sky-600" />
                Organization Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Company Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-sky-500" />
                    Company name *
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Inc."
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg"
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">{errors.companyName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-sky-500" />
                      Website (optional)
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="acme.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={isSubmitting}
                      className="h-12 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg"
                    />
                    {errors.website && (
                      <p className="text-sm text-red-500">{errors.website}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Users className="h-4 w-4 text-sky-500" />
                      Company size (optional)
                    </Label>
                    <Select 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-12 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Just me">Just me</SelectItem>
                        <SelectItem value="2-10">2-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="200+">200+ employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Industry (optional)
                    </Label>
                    <Select 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-12 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Referral code (optional)
                    </Label>
                    <Input
                      id="referralCode"
                      placeholder="Enter code"
                      value={formData.referralCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                      disabled={isSubmitting}
                      className="h-12 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg"
                    />
                    {formData.referralCode && (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        You'll both get $5 credit!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Invites Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                    <Mail className="h-4 w-4 text-sky-500" />
                    Invite team members (optional)
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={formData.currentEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentEmail: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                      disabled={isSubmitting}
                      className="h-12 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEmail}
                      disabled={!formData.currentEmail || !formData.currentEmail.includes('@') || isSubmitting}
                      className="h-12 px-6 border-gray-200 dark:border-gray-700 hover:bg-sky-50 hover:border-sky-300 rounded-lg"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {formData.invitedEmails.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.invitedEmails.map((email, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeEmail(index)}
                            disabled={isSubmitting}
                            className="ml-2 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  onClick={handleComplete}
                  disabled={!isValid || isSubmitting}
                  className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium tracking-wide transition-all duration-200 ease-out hover:shadow-lg hover:shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Setting up organization...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400 dark:text-gray-500 font-light">
              Your data is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function OnboardingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading onboarding...</p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingContent />
    </Suspense>
  )
}
