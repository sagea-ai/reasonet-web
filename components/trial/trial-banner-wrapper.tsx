'use client'

import { usePathname } from 'next/navigation'
import { useTrial } from './trial-provider'
import { TrialBanner } from './trial-banner'
import { useRouter } from 'next/navigation'

export function TrialBannerWrapper() {
  const { isTrialActive, daysRemaining, tier, loading } = useTrial()
  const pathname = usePathname()
  const router = useRouter()
  
  const isPublicRoute = pathname?.startsWith('/sign-in') || 
                       pathname?.startsWith('/onboarding') ||
                       pathname?.startsWith('/sign-up')
  
  // Don't show anything while loading
  if (loading) {
    return null
  }

  // Debug logging
  console.log('Trial Banner Debug:', { 
    isTrialActive, 
    daysRemaining, 
    tier, 
    isPublicRoute, 
    pathname,
    shouldShow: isTrialActive && daysRemaining > 0 && !isPublicRoute
  })
  
  // Show banner if user has an active trial with days remaining
  const shouldShowBanner = isTrialActive && daysRemaining > 0 && !isPublicRoute
  
  if (!shouldShowBanner) {
    return null
  }

  const handleUpgrade = () => {
    router.push('/billing')
  }

  return (
    <div>
      <TrialBanner 
        daysRemaining={daysRemaining} 
        onUpgrade={handleUpgrade}
      />
    </div>
  )
}
