'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Globe, Users, Briefcase } from 'lucide-react'

interface CompanyProfileStepProps {
  onComplete: (data: {
    companyName: string
    website: string
    companySize: string
    industry: string
    referralCode?: string
  }) => void
  isSubmitting?: boolean
  initialReferralCode?: string
}

export function CompanyProfileStep({ onComplete, isSubmitting, initialReferralCode }: CompanyProfileStepProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    companySize: '',
    industry: '',
    referralCode: initialReferralCode || ''
  })
  const [currentField, setCurrentField] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fields = [
    { key: 'companyName', required: true },
    { key: 'website', required: true },
    { key: 'companySize', required: false },
    { key: 'industry', required: false },
    { key: 'referralCode', required: false }
  ]

  // Auto-advance to next field when current field is filled
  useEffect(() => {
    if (currentField < fields.length - 1) {
      const currentFieldKey = fields[currentField].key as keyof typeof formData
      if (formData[currentFieldKey]) {
        const timer = setTimeout(() => {
          setCurrentField(currentField + 1)
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [formData, currentField])

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
      if (!value.trim()) {
        newErrors.website = 'Website is required'
      } else {
        try {
          // Add protocol if missing
          const url = value.startsWith('http') ? value : `https://${value}`
          new URL(url)
          delete newErrors.website
        } catch {
          newErrors.website = 'Please enter a valid website URL'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    validateField(key, value)
  }

  const handleComplete = () => {
    // Validate required fields
    const isCompanyNameValid = validateField('companyName', formData.companyName)
    const isWebsiteValid = validateField('website', formData.website)
    
    if (isCompanyNameValid && isWebsiteValid) {
      // Ensure website has protocol
      const website = formData.website.startsWith('http') 
        ? formData.website 
        : `https://${formData.website}`
      
      console.log('Company profile data:', { ...formData, website })
      onComplete({ ...formData, website })
    }
  }

  const isValid = formData.companyName && formData.website && Object.keys(errors).length === 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-800 dark:to-sky-900 rounded-xl flex items-center justify-center">
          <Building2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>
        <h2 className="text-xl font-extralight text-gray-900 dark:text-white mb-2 tracking-tight">
          Company Profile
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">
          Tell us about your company to personalize your experience
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {/* Company Name */}
          {currentField >= 0 && (
            <motion.div
              key="company-name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="companyName" className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Building2 className="h-3 w-3 text-sky-500" />
                Company name *
              </Label>
              <Input
                id="companyName"
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                autoFocus={currentField === 0}
                disabled={isSubmitting}
                className="h-9 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg text-sm"
              />
              {errors.companyName && (
                <p className="text-xs text-red-500">{errors.companyName}</p>
              )}
            </motion.div>
          )}

          {/* Website */}
          {currentField >= 1 && (
            <motion.div
              key="website"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-2"
            >
              <Label htmlFor="website" className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Globe className="h-3 w-3 text-sky-500" />
                Website *
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="acme.com"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                autoFocus={currentField === 1}
                disabled={isSubmitting}
                className="h-9 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg text-sm"
              />
              {errors.website && (
                <p className="text-xs text-red-500">{errors.website}</p>
              )}
            </motion.div>
          )}

          {/* Company Size */}
          {currentField >= 2 && (
            <motion.div
              key="company-size"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="space-y-2"
            >
              <Label htmlFor="companySize" className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Users className="h-3 w-3 text-sky-500" />
                Company size
              </Label>
              <Select 
                onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg text-sm">
                  <SelectValue placeholder="Select company size" />
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
            </motion.div>
          )}

          {/* Industry */}
          {currentField >= 3 && (
            <motion.div
              key="industry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="industry" className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Briefcase className="h-3 w-3 text-sky-500" />
                Industry
              </Label>
              <Select 
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg text-sm">
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
            </motion.div>
          )}

          {/* Referral Code */}
          {currentField >= 4 && (
            <motion.div
              key="referral-code"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="referralCode" className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Building2 className="h-3 w-3 text-sky-500" />
                Referral code (optional)
              </Label>
              <Input
                id="referralCode"
                placeholder="Enter referral code"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                disabled={isSubmitting}
                className="h-9 border-gray-200 dark:border-gray-700 focus:border-sky-500 focus:ring-sky-500 rounded-lg text-sm"
              />
              {formData.referralCode && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  🎉 You and your referrer will both get $5 credit!
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentField >= 4 && (
        <motion.div
          key="continue-button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="pt-2"
        >
          <Button
            onClick={handleComplete}
            disabled={!isValid || isSubmitting}
            className="w-full h-9 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium tracking-wide transition-all duration-200 ease-out hover:shadow-lg hover:shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? 'Setting up...' : 'Continue'}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
