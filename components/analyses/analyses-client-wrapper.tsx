'use client'

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { useUser } from "@clerk/nextjs";
import { AnalysesLayout } from "@/components/analyses/analyses-layout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  language?: string | null;
}

interface AnalysisResult {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  file: string;
  lineNumber: number;
  message: string;
  code: string;
}

interface Analysis {
  id: string;
  name: string;
  status: 'PENDING' | 'PROCESSING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  repository: Repository;
  _count: {
    results: number;
  };
  results?: AnalysisResult[];
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AnalysesClientWrapperProps {
  organizations: Organization[];
  currentOrganization: Organization;
  initialAnalyses: Analysis[];
}

export function AnalysesClientWrapper({ 
  organizations, 
  currentOrganization: initialOrganization,
  initialAnalyses
}: AnalysesClientWrapperProps) {
  const router = useRouter();
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization);
  const [analyses, setAnalyses] = useState<Analysis[]>(initialAnalyses);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    // If the organization changes, fetch analyses for the new organization
    if (currentOrganization.id !== initialOrganization.id) {
      fetchAnalyses();
    }
  }, [currentOrganization.id]);

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/organizations/${currentOrganization.id}/analyses`);
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data);
      } else {
        throw new Error('Failed to fetch analyses');
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('Failed to load analyses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAnalyses = () => {
    fetchAnalyses();
  };

  const handleCreateAnalysis = () => {
    router.push('/analyses/new');
  };

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
    }
  };

  return (
    <AppLayout
      organizations={organizations}
      currentOrganization={currentOrganization}
      onOrganizationChange={handleOrganizationChange}
      user={{
        fullName: user?.fullName || undefined,
        firstName: user?.firstName || undefined,
        lastName: user?.lastName || undefined,
      }}
    >
      <AnalysesLayout 
        organizationName={currentOrganization.name}
        analyses={analyses}
        isLoading={isLoading}
        onRefresh={handleRefreshAnalyses}
        onCreateAnalysis={handleCreateAnalysis}
      />
    </AppLayout>
  );
}
