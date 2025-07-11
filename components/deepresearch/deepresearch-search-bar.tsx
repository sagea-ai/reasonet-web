'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Sparkles } from 'lucide-react'

interface DeepResearchSearchBarProps {
  query?: string
  onQueryChange?: (query: string) => void
  onSubmit?: (query: string) => void
  isLoading?: boolean
}

export function DeepResearchSearchBar({ 
  query = '', 
  onQueryChange, 
  onSubmit,
  isLoading = false
}: DeepResearchSearchBarProps) {
  const [currentQuery, setCurrentQuery] = useState(query)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setCurrentQuery(query)
  }, [query])

  const handleInputChange = (value: string) => {
    if (!isLoading) {
      setCurrentQuery(value)
      onQueryChange?.(value)
    }
  }

  const handleSubmit = () => {
    if (currentQuery.trim() && !isLoading) {
      onSubmit?.(currentQuery)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [currentQuery])

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="bg-white/90 backdrop-blur-md dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
        {isLoading && (
          <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
        )}
        
        <div className="flex items-end gap-3 p-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={currentQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter any topic for deep research..."
              className="w-full p-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-500 resize-none min-h-[44px] max-h-[120px] focus:outline-none"
              disabled={isLoading}
              rows={1}
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!currentQuery.trim() || isLoading}
            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
           