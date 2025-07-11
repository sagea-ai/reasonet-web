import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReferralPageClient } from "@/components/referral/referral-page-client";

export default async function ReferPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      referralCode: true,
      hasCompletedOnboarding: true,
      referrals: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        }
      },
      credits: {
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
          referralId: true,
        }
      }
    },
  });

  if (!user || !user.hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  const totalCredits = user.credits.reduce((sum, credit) => sum + credit.amount, 0);
  const referralCredits = user.credits.filter(credit => 
    credit.type === 'REFERRAL_BONUS' || credit.type === 'REFERRED_BONUS'
  );

  return (
    <ReferralPageClient 
      user={user}
      totalCredits={totalCredits}
      referralCredits={referralCredits}
    />
  );
}
