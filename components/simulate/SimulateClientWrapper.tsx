'use client'

import { SessionNavBar } from "@/components/ui/sidebar";
import { useState } from "react";
import { SimulatePageClient } from "./SimulatePageClient";
import { TrialBanner } from "../trial/trial-banner";

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

  const handleOrganizationChange = (orgId: string) => {
    const newOrg = organizations.find(org => org.id === orgId);
    if (newOrg) {
      setCurrentOrganization(newOrg);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionNavBar 
        organizations={organizations}
        currentOrganization={currentOrganization}
        onOrganizationChange={handleOrganizationChange}
        user={user}
      />
      <div className="flex-1 ml-16">
        <SimulatePageClient />
      </div>
    </div>
  );
}
