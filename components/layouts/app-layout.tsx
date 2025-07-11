'use client'

import { SessionNavBar } from "@/components/ui/sidebar";
import { useState } from "react";

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

interface AppLayoutProps {
  organizations?: Organization[];
  currentOrganization?: Organization;
  onOrganizationChange?: (orgId: string) => void;
  user?: User;
  children: React.ReactNode;
}

export function AppLayout({
  organizations = [],
  currentOrganization,
  onOrganizationChange,
  user,
  children
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <SessionNavBar 
        organizations={organizations}
        currentOrganization={currentOrganization}
        onOrganizationChange={onOrganizationChange}
        user={user}
      />
      <main className="flex-1 transition-all duration-200 ease-out ml-16">
        {children}
      </main>
    </div>
  );
}
