import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function getOrganizations() {
  const { userId } = await auth();
  
  if (!userId) {
    return [];
  }

  const organizations = await db.organization.findMany({
    where: {
      members: {
        some: {
          user: {
            clerkId: userId
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return organizations;
}

export async function getCurrentOrganization() {
  const organizations = await getOrganizations();
  
  return organizations.length > 0 ? organizations[0] : null;
}

export async function getOrganization(organizationId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const organization = await db.organization.findFirst({
    where: {
      id: organizationId,
      members: {
        some: {
          user: {
            clerkId: userId
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
    }
  });

  return organization;
}

// Optional: Get organization by slug
export async function getOrganizationBySlug(slug: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const organization = await db.organization.findFirst({
    where: {
      slug: slug,
      members: {
        some: {
          user: {
            clerkId: userId
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
    }
  });

  return organization;
}