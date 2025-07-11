'use client'

import { useState } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { OrganizationForm } from "@/components/organization/organization-form";
import { useUser } from "@clerk/nextjs";

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

interface OrganizationPageClientProps {
  organization: Organization;
  organizations: Organization[];
  currentOrganization: Organization;
}

export function OrganizationPageClient({ 
  organization,
  organizations, 
  currentOrganization: initialOrganization 
}: OrganizationPageClientProps) {
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization);
  const { user } = useUser();

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      console.log('Switched to organization:', org.name);
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
      <div className="p-8 max-w-4xl mx-auto">
        {/* Organization Form */}
        <OrganizationForm organization={organization} />
      </div>
    </AppLayout>
  );
}
