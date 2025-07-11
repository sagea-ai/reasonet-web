'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Building2, Settings, Code, AlertTriangle, Users, BarChart3, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Organization {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  description?: string | null;
  companySize?: string | null;
  industry?: string | null;
  createdAt: Date;
  _count?: {
    members: number;
    repositories: number;
  };
}

interface OrganizationFormProps {
  organization: Organization;
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: organization.name || '',
    website: organization.website || '',
    description: organization.description || '',
    companySize: organization.companySize || '',
    industry: organization.industry || ''
  })

  const [analysisSettings, setAnalysisSettings] = useState({
    autoAnalysis: true,
    severityThreshold: 'MEDIUM',
    notifyOnCritical: true,
    weeklyReports: true,
    codeQualityGates: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          website: formData.website.trim() || null,
          companySize: formData.companySize || null,
          industry: formData.industry || null,
        }),
      })

      if (response.ok) {
        toast.success("Organization settings updated successfully.")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update organization")
      }
    } catch (error) {
      toast.error("Failed to update organization. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAnalysisSettingsUpdate = async (key: string, value: any) => {
    const newSettings = { ...analysisSettings, [key]: value }
    setAnalysisSettings(newSettings)

    try {
      await fetch(`/api/organizations/${organization.id}/analysis-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      })
      toast.success("Analysis settings updated.")
    } catch (error) {
      toast.error("Failed to update analysis settings.")
    }
  }

  const hasChanges = formData.name !== organization.name || 
                    formData.website !== (organization.website || '') ||
                    formData.companySize !== (organization.companySize || '') ||
                    formData.industry !== (organization.industry || '')

  return (
    <div className="space-y-6">
      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-600" />
            Organization Details
          </CardTitle>
          <CardDescription>
            Manage your organization's basic information and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-sky-100 text-sky-600 text-lg">
                  {organization.name[0]?.toUpperCase() || 'O'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {organization.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">@{organization.slug}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">
                    {organization._count?.members || 0} members
                  </Badge>
                  <Badge variant="secondary">
                    {organization._count?.repositories || 0} repositories
                  </Badge>
                  <Badge variant="outline">
                    Created {format(new Date(organization.createdAt), 'MMM yyyy')}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter organization name"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your organization"
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companySize">Company size</Label>
                <Select value={formData.companySize} onValueChange={(value) => setFormData({ ...formData, companySize: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JUST_ME">Just me</SelectItem>
                    <SelectItem value="TWO_TO_TEN">2-10 employees</SelectItem>
                    <SelectItem value="ELEVEN_TO_FIFTY">11-50 employees</SelectItem>
                    <SelectItem value="FIFTY_ONE_TO_TWO_HUNDRED">51-200 employees</SelectItem>
                    <SelectItem value="TWO_HUNDRED_PLUS">200+ employees</SelectItem>
                    <SelectItem value="THOUSAND_PLUS">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Technology, Finance, Healthcare"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!hasChanges || isSubmitting}
                className="bg-sky-600 hover:bg-sky-700"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Reasoning Engine Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-600" />
            Reasoning Engine Settings
          </CardTitle>
          <CardDescription>
            Configure how Reasonet simulates investors and generates insights for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Investor Simulation</Label>
              <p className="text-sm text-muted-foreground">
                Simulate feedback from different investor personas
              </p>
            </div>
            <Switch
              checked={analysisSettings.autoAnalysis}
              onCheckedChange={(checked: boolean) => handleAnalysisSettingsUpdate('autoAnalysis', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Counter-Arguments</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate counter-arguments to your thesis
              </p>
            </div>
            <Switch
              checked={analysisSettings.codeQualityGates}
              onCheckedChange={(checked: boolean) => handleAnalysisSettingsUpdate('codeQualityGates', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Investor Persona</Label>
            <Select 
              value={analysisSettings.severityThreshold} 
              onValueChange={(value) => handleAnalysisSettingsUpdate('severityThreshold', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SKEPTICAL">Skeptical</SelectItem>
                <SelectItem value="STRATEGIC">Strategic</SelectItem>
                <SelectItem value="EMOTIONAL">Emotional</SelectItem>
                <SelectItem value="ALL">All Types</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose which investor persona Reasonet should prioritize
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Weekly Insight Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly strategic insight reports via email
              </p>
            </div>
            <Switch
              checked={analysisSettings.weeklyReports}
              onCheckedChange={(checked: boolean) => handleAnalysisSettingsUpdate('weeklyReports', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            Organization Overview
          </CardTitle>
          <CardDescription>
            Quick overview of your organization's Reasonet activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {/* Replace with real data if available */}
                0
              </div>
              <p className="text-sm text-sky-700 dark:text-sky-300">Ideas Analyzed</p>
            </div>
            <div className="text-center p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {organization._count?.members || 0}
              </div>
              <p className="text-sm text-sky-700 dark:text-sky-300">Active Members</p>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-base font-semibold text-amber-600 dark:text-amber-400">
                {/* Replace with real data if available */}
                No major blind spots
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">Most Common Blind Spot</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
