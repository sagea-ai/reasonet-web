'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BiCreditCardAlt } from 'react-icons/bi'

interface TrialBannerProps {
  daysRemaining: number
  onUpgrade?: () => void
}

export function TrialBanner({ daysRemaining, onUpgrade }: TrialBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-sky-700/70 backdrop-blur-2xl text-white">
      <div className="flex flex-row items-center justify-center px-4 py-2 gap-4 text-center">
        <div>
          <span>{daysRemaining} days left in your free trial!</span>
        </div>
        
        <div>
          <Button
            onClick={onUpgrade}
            size="sm"
            className="bg-sky-600 hover:border-sky-800 hover:bg-sky-600 border-sky-700/70 hover:border-2 text-white font-medium uppercase text-xs"
          >
            <BiCreditCardAlt className='w-5 h-5 mr-1' />
            Add Payment Method
          </Button>
        </div>
      </div>
    </div>
  )
}