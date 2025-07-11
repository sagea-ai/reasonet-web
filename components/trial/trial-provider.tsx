'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface TrialContextType {
  isTrialActive: boolean
  daysRemaining: number
  tier: 'FREE' | 'PRO' | 'TRIAL'
  loading: boolean
  refreshTrial: () => Promise<void>
}

const TrialContext = createContext<TrialContextType | undefined>(undefined)

export function TrialProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [trialData, setTrialData] = useState({
    isTrialActive: false,
    daysRemaining: 0,
    tier: 'FREE' as const,
    loading: true
  })

  const fetchTrialStatus = async () => {
    if (!user || !isLoaded) {
      setTrialData(prev => ({ ...prev, loading: false }))
      return
    }
    
    try {
      const response = await fetch('/api/user/trial-status')
      if (response.ok) {
        const data = await response.json()
        console.log('Trial status response:', data)
        setTrialData({
          isTrialActive: data.isTrialActive,
          daysRemaining: data.daysRemaining,
          tier: data.tier,
          loading: false
        })
      } else {
        console.error('Failed to fetch trial status:', response.status)
        setTrialData(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Failed to fetch trial status:', error)
      setTrialData(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    fetchTrialStatus()
  }, [user, isLoaded])

  return (
    <TrialContext.Provider value={{
      ...trialData,
      refreshTrial: fetchTrialStatus
    }}>
      {children}
    </TrialContext.Provider>
  )
}

export function useTrial() {
  const context = useContext(TrialContext)
  if (context === undefined) {
    throw new Error('useTrial must be used within a TrialProvider')
  }
  return context
}
