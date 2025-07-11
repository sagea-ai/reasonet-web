'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Copy, Check } from 'lucide-react'

interface FloatingPromptBarProps {
  prompt?: string
  onPromptChange?: (prompt: string) => void
  onSubmit?: (prompt: string) => void
  isAnimating?: boolean
  isLoading?: boolean
}

export function FloatingPromptBar({ 
  prompt = '', 
  onPromptChange, 
  onSubmit,
  isAnimating = false,
  isLoading = false
}: FloatingPromptBarProps) {
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [displayedPrompt, setDisplayedPrompt] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Handle external prompt changes with typing animation
  useEffect(() => {
    if (prompt && prompt !== currentPrompt && isAnimating) {
      setIsTyping(true)
      setDisplayedPrompt('')
      
      let index = 0
      const typeChar = () => {
        if (index < prompt.length) {
          setDisplayedPrompt(prompt.substring(0, index + 1))
          index++
          typingTimeoutRef.current = setTimeout(typeChar, 20)
        } else {
          setIsTyping(false)
          setCurrentPrompt(prompt)
        }
      }
      
      typeChar()
    } else if (prompt && !isAnimating) {
      setCurrentPrompt(prompt)
      setDisplayedPrompt(prompt)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [prompt, isAnimating, currentPrompt])

  const handleInputChange = (value: string) => {
    if (!isTyping && !isLoading) {
      setCurrentPrompt(value)
      setDisplayedPrompt(value)
      onPromptChange?.(value)
    }
  }

  const handleSubmit = () => {
    if (currentPrompt.trim() && !isTyping && !isLoading) {
      onSubmit?.(currentPrompt)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCopy = async () => {
    if (currentPrompt) {
      await navigator.clipboard.writeText(currentPrompt)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [displayedPrompt])

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-6">
      <div className="bg-neutral-100/60 backdrop-blur-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl overflow-hidden">
        {/* Loading indicator */}
        {isLoading && (
          <div className="h-1 bg-sky-500 animate-pulse"></div>
        )}
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isLoading ? 'Processing...' : isTyping ? 'Generating...' : 'Describe your workflow'}
            </h3>
            {currentPrompt && !isLoading && (
              <button
                onClick={handleCopy}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Copy prompt"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          
          {/* Input area */}
          <div className="relative mb-4">
            <textarea
              ref={textareaRef}
              value={displayedPrompt}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about the workflow you want to create, or I can generate one from your diagram..."
              className={`w-full p-4 bg-transparent dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none min-h-[70px] max-h-[200px] focus:outline-none  ${
                isLoading ? 'opacity-60' : ''
              }`}
              disabled={isTyping || isLoading}
            />
            
            {isTyping && (
              <div className="absolute bottom-4 right-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {!isLoading && !isTyping && (
                <>
                  Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">⌘</kbd> + <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Enter</kbd> to run
                  {currentPrompt && (
                    <span className="ml-2">• {currentPrompt.length} characters</span>
                  )}
                </>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!currentPrompt.trim() || isTyping || isLoading}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Processing...' : 'Run Workflow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}