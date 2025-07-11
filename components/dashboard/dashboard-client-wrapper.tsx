'use client'

import { useState } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useUser } from "@clerk/nextjs";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface DashboardClientWrapperProps {
  organizations: Organization[];
  currentOrganization: Organization;
}

export function DashboardClientWrapper({ 
  organizations, 
  currentOrganization: initialOrganization,
}: DashboardClientWrapperProps) {
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const handleOrganizationChange = (orgId: string) => {
    const newOrg = organizations.find(org => org.id === orgId);
    if (newOrg) {
      setCurrentOrganization(newOrg);
    }
  };

  return (
    <AppLayout
      organizations={organizations}
      currentOrganization={currentOrganization}
      onOrganizationChange={handleOrganizationChange}
      user={user}
    >
      <DashboardLayout
        organizationName={currentOrganization.name}
        organizationId={currentOrganization.id}
        userName={user?.firstName}
        isLoading={isLoading}
      />
    </AppLayout>
  );
}