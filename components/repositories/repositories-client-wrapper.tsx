'use client'

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { RepositoriesLayout } from "@/components/repositories/repositories-layout";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  isPrivate: boolean;
  language?: string;
  url: string;
  starCount?: number;
  forkCount?: number;
  updatedAt: string;
  _count: {
    issues: number;
    access: number;
    analyses: number;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  repositories: Repository[];
}

interface RepositoriesClientWrapperProps {
  organizations: Organization[];
  currentOrganization: Organization;
  repositories: Repository[];
}

export function RepositoriesClientWrapper({ 
  organizations, 
  currentOrganization: initialOrganization,
  repositories: initialRepositories
}: RepositoriesClientWrapperProps) {
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization);
  const [repositories, setRepositories] = useState(initialRepositories);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    const installation = searchParams.get('installation');
    const setupAction = searchParams.get('setup_action');
    const installationId = searchParams.get('installation_id');
    
    if (installationId && setupAction) {
      toast.info('GitHub installation detected, syncing repositories...');
      refreshRepositories();
    } else if (installation === 'success') {
      toast.success('Installation successful! Your repositories should appear shortly.');
      refreshRepositories();
    }
  }, [searchParams]);

  const refreshRepositories = async () => {
    if (!currentOrganization?.id) return;
    
    setIsRefreshing(true);
    try {
      console.log('Triggering repository sync for organization:', currentOrganization.id);
      
      // First try to trigger a sync
      const syncResponse = await fetch('/api/github/sync-repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: currentOrganization.id })
      });
      
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        console.log('Sync response:', syncData);
        console.log(`Synced ${syncData.repositoriesSynced} repositories from ${syncData.installationsProcessed} installations`);
      } else {
        const errorText = await syncResponse.text();
        console.error('Sync failed:', errorText);
      }
      
      // Then fetch the latest repositories
      console.log('Fetching updated repositories...');
      const response = await fetch(`/api/organizations/${currentOrganization.id}/repositories`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched repositories:', data.length);
        setRepositories(data);
        toast.success(`Refreshed ${data.length} repositories`);
      } else {
        console.error('Failed to fetch repositories:', await response.text());
        toast.error('Failed to fetch repositories');
      }
    } catch (error) {
      console.error('Failed to refresh repositories:', error);
      toast.error('Failed to refresh repositories');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      setRepositories(org.repositories);
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
      <RepositoriesLayout 
        organizationName={currentOrganization.name}
        organizationId={currentOrganization.id}
        repositories={repositories}
        onRepositoriesUpdate={setRepositories}
        isRefreshing={isRefreshing}
        onRefresh={refreshRepositories}
      />
    </AppLayout>
  );
}
