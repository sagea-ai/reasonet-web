'use client'

import { useState } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { ProfileForm } from "@/components/profile/profile-form";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  referralCode: string;
  createdAt: Date;
}

interface ProfilePageClientProps {
  user: User;
  organizations: Organization[];
  currentOrganization: Organization;
}

export function ProfilePageClient({ 
  user,
  organizations, 
  currentOrganization: initialOrganization 
}: ProfilePageClientProps) {
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization);
  const { user: clerkUser } = useUser();

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
        fullName: clerkUser?.fullName || undefined,
        firstName: clerkUser?.firstName || undefined,
        lastName: clerkUser?.lastName || undefined,
      }}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-sky-500" />
                Profile Settings
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage your personal information and account preferences
              </p>
            </div>
          </div>
          {/* Profile Form Card */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
            <CardContent className="p-0">
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
