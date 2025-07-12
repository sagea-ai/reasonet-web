'use client'

import { SessionNavBar } from "@/components/ui/sidebar";
import { useState } from "react";
import { SimulatePageClient } from "./SimulatePageClient";
import { TrialBanner } from "../trial/trial-banner";
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSimulateStore } from "@/store/simulateStore";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface User {
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

interface SimulateClientWrapperProps {
  organizations: Organization[];
  currentOrganization: Organization;
  user?: User;
}

export function SimulateClientWrapper({ 
  organizations, 
  currentOrganization: initialOrganization,
  user
}: SimulateClientWrapperProps) {
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization);
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()
  
  // Get the workflow data and prompt generator from the store
  const { nodes, edges, generateWorkflowPrompt } = useSimulateStore()
  
  const handleOrganizationChange = (orgId: string) => {
    const newOrg = organizations.find(org => org.id === orgId);
    if (newOrg) {
      setCurrentOrganization(newOrg);
    }
  };

  const handleRunAnalysis = async () => {
    const prompt = generateWorkflowPrompt()
    
    if (!prompt.trim() || prompt === 'No workflow components have been added yet.') {
      toast.error('Please create a workflow first')
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Create workspace with the prompt
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Workflow Analysis - ${new Date().toLocaleDateString()}`,
          description: 'Automated workflow analysis from simulation',
          prompt: prompt, // Store only the prompt as header
          organizationId: currentOrganization.id,
          isPrivate: false
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create workspace')
      }

      const workspace = await response.json()
      
      // Store workspace data for reasoning page
      sessionStorage.setItem('workflowData', JSON.stringify({ 
        prompt: prompt,
        workspaceId: workspace.id,
        source: 'simulate'
      }))
      
      // Navigate to reasoning page
      router.push('/reason?autoAnalyze=true')
      
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Failed to run analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionNavBar 
        organizations={organizations}
        currentOrganization={currentOrganization}
        onOrganizationChange={handleOrganizationChange}
        user={user}
      />
      <div className="flex-1 ml-16">
        <SimulatePageClient 
          onRunAnalysis={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
        />
      </div>
    </div>
  );
}
