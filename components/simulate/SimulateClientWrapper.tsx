'use client'

import { SessionNavBar } from "@/components/ui/sidebar";
import { useState } from "react";
import { SimulatePageClient } from "./SimulatePageClient";
import { TrialBanner } from "../trial/trial-banner";
import { useRouter } from 'next/navigation'
import { WorkflowLoading } from '@/components/workflow/workflow-loading'

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  }

interface SimulateClientWrapperProps {
  organizations: Organization[];
  currentOrganization: Organization;
  user: User;
}
export function SimulateClientWrapper({ 
  organizations, 
  currentOrganization, 
  user 
}: SimulateClientWrapperProps) {
  const [currentOrganizationState, setCurrentOrganization] = useState(currentOrganization);
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false)
  const router = useRouter()

  const handleOrganizationChange = (orgId: string) => {
    const newOrg = organizations.find(org => org.id === orgId);
    if (newOrg) {
      setCurrentOrganization(newOrg);
    }
  };

  const handleRunWorkflow = async (workflow: any) => {
    if (!workflow) return
    
    setIsRunningWorkflow(true)
    
    const workflowPrompt = generateWorkflowPrompt(workflow)
    
    sessionStorage.setItem('workflowData', JSON.stringify({
      prompt: workflowPrompt,
      workflow: workflow,
      timestamp: Date.now()
    }))
  }

  const handleWorkflowComplete = () => {
    setIsRunningWorkflow(false)
    router.push('/reason')
  }

  const generateWorkflowPrompt = (workflow: any) => {
    if (!workflow) return ''
    
    let prompt = "Here is my complete workflow:\n\n"
    
    prompt += "=== COMPONENTS ===\n"
    workflow.components?.forEach((component: any, index: number) => {
      prompt += `${index + 1}. ${component.name} (${component.id})\n`
      prompt += `   Description: ${component.description}\n`
      if (component.config) {
        prompt += `   Configuration: ${component.config}\n`
      }
      prompt += "\n"
    })
    
    prompt += "=== WORKFLOW STEPS ===\n"
    workflow.connections?.forEach((connection: any, index: number) => {
      const sourceComponent = workflow.components?.find((c: any) => c.id === connection.source)
      const targetComponent = workflow.components?.find((c: any) => c.id === connection.target)
      
      if (sourceComponent && targetComponent) {
        prompt += `Step ${index + 1}: ${sourceComponent.name} → ${targetComponent.name}\n`
        prompt += `   Flow: ${connection.description || 'Data flows from source to target'}\n\n`
      }
    })
    
    prompt += "\nPlease help me understand this workflow and suggest improvements."
    
    return prompt
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionNavBar 
        organizations={organizations}
        currentOrganization={currentOrganizationState}
        onOrganizationChange={handleOrganizationChange}
        user={user}
      />
      <div className="flex-1 ml-16">
        
        <SimulatePageClient 
          organizations={organizations}
          currentOrganization={currentOrganizationState}
          user={user}
          onRunWorkflow={handleRunWorkflow}
          isRunningWorkflow={isRunningWorkflow}
        />
        
        <WorkflowLoading 
          isVisible={isRunningWorkflow}
          onComplete={handleWorkflowComplete}
        />
      </div>
    </div>
  );
}
