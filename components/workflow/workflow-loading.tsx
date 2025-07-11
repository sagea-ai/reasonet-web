'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { IoFlashOutline, IoAnalyticsOutline, IoCheckmarkCircleOutline } from 'react-icons/io5'
import { useState, useEffect } from 'react'

interface WorkflowLoadingProps {
  isVisible: boolean
  onComplete: () => void
}

export function WorkflowLoading({ isVisible, onComplete }: WorkflowLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps = [
    { icon: IoFlashOutline, text: "Processing workflow..." },
    { icon: IoAnalyticsOutline, text: "Analyzing scenarios..." },
    { icon: IoCheckmarkCircleOutline, text: "Generating insights..." }
  ]

  useEffect(() => {
    if (!isVisible) return

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval)
          setTimeout(() => onComplete(), 800)
          return prev
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(stepInterval)
  }, [isVisible, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white dark:bg-black flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <motion.div
                className="w-24 h-24 bg-blue-50 dark:bg-blue-950/30 rounded-3xl mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {steps[currentStep] && (() => {
                    const IconComponent = steps[currentStep].icon
                    return <IconComponent className="w-12 h-12 text-blue-600" />
                  })()}
                </motion.div>
              </motion.div>
              
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 w-24 h-24 bg-blue-200 dark:bg-blue-800 rounded-3xl mx-auto opacity-20"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0, 0.2]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>

            <div className="space-y-4">
              <motion.h2 
                className="text-2xl font-light text-gray-900 dark:text-white"
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {steps[currentStep]?.text || "Processing..."}
              </motion.h2>
              
              <div className="flex justify-center space-x-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}