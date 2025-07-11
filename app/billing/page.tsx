import { BillingPageClient } from "@/components/billing/billing-page-client";
import { getOrganizations, getCurrentOrganization } from "@/lib/organizations";

export default async function BillingPage() {
  const organizations = await getOrganizations();
  const currentOrganization = await getCurrentOrganization();

  if (!currentOrganization || organizations.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-2 sm:px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            No Organizations Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            You need to be a member of an organization to view billing information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BillingPageClient 
      organizations={organizations}
      currentOrganization={currentOrganization}
    />
  );
}