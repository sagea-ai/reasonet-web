'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Bold, Italic, List, AtSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    imageUrl?: string
  }
}

interface RichTextEditorProps {
  onSubmit: (content: any, mentions: string[]) => void
  members: Member[]
  placeholder?: string
  level?: number
  className?: string
}

export function RichTextEditor({ 
  onSubmit, 
  members, 
  placeholder = "Write something...",
  level = 0,
  className 
}: RichTextEditorProps) {
  const [content, setContent] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredMembers = members.filter(member => {
    const name = `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim()
    const email = member.user.email
    return name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
           email.toLowerCase().includes(mentionSearch.toLowerCase())
  })

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const text = target.textContent || ''
    setContent(text)

    // Check for @ mentions
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const textBeforeCursor = range.startContainer.textContent?.slice(0, range.startOffset) || ''
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
      
      if (mentionMatch) {
        setMentionSearch(mentionMatch[1])
        setShowMentions(true)
        
        // Calculate position for mention dropdown
        const rect = range.getBoundingClientRect()
        setMentionPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        })
      } else {
        setShowMentions(false)
      }
    }
  }, [])

  const insertMention = useCallback((member: Member) => {
    if (!editorRef.current) return

    const name = `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.user.email
    const mentionText = `@${name}`
    
    // Replace the current @ search with the mention
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const textNode = range.startContainer
      const textContent = textNode.textContent || ''
      const cursorPos = range.startOffset
      
      // Find the @ symbol position
      const beforeCursor = textContent.slice(0, cursorPos)
      const atIndex = beforeCursor.lastIndexOf('@')
      
      if (atIndex !== -1) {
        // Create mention span
        const mentionSpan = document.createElement('span')
        mentionSpan.className = 'bg-sky-100 text-sky-800 px-1 rounded mention'
        mentionSpan.contentEditable = 'false'
        mentionSpan.dataset.userId = member.user.id
        mentionSpan.textContent = mentionText
        
        // Replace text
        const newRange = document.createRange()
        newRange.setStart(textNode, atIndex)
        newRange.setEnd(textNode, cursorPos)
        newRange.deleteContents()
        newRange.insertNode(mentionSpan)
        
        // Add space after mention
        const spaceNode = document.createTextNode(' ')
        newRange.insertNode(spaceNode)
        
        // Set cursor after the space
        const newSelection = window.getSelection()
        newSelection?.removeAllRanges()
        const finalRange = document.createRange()
        finalRange.setStartAfter(spaceNode)
        finalRange.collapse(true)
        newSelection?.addRange(finalRange)
        
        // Update mentions array
        setMentions(prev => [...prev, member.user.id])
      }
    }
    
    setShowMentions(false)
    setMentionSearch('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault()
      handleSubmit()
    }
    
    if (e.key === 'Escape') {
      setShowMentions(false)
    }

    // Handle formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault()
        document.execCommand('bold')
        setIsBold(!isBold)
      }
      if (e.key === 'i') {
        e.preventDefault()
        document.execCommand('italic')
        setIsItalic(!isItalic)
      }
    }
  }, [showMentions])

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    // Extract content and mentions from the editor
    const editorContent = editorRef.current?.innerHTML || ''
    const mentionElements = editorRef.current?.querySelectorAll('.mention') || []
    const extractedMentions: string[] = []
    
    mentionElements.forEach(el => {
      const userId = (el as HTMLElement).dataset.userId
      if (userId) extractedMentions.push(userId)
    })
    
    const richContent = {
      html: editorContent,
      text: content,
      mentions: extractedMentions
    }
    
    try {
      await onSubmit(richContent, extractedMentions)
      
      // Clear editor
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
      setContent('')
      setMentions([])
    } catch (error) {
      console.error('Failed to submit content:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIndentClass = () => {
    const indentClasses = [
      'ml-0',
      'ml-6',
      'ml-12',
      'ml-18',
      'ml-24'
    ]
    return indentClasses[Math.min(level, 4)]
  }

  return (
    <div className={cn('relative', getIndentClass(), className)}>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                document.execCommand('bold')
                setIsBold(!isBold)
              }}
              className={cn("h-7 w-7 p-0", isBold && "bg-gray-200 dark:bg-gray-600")}
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                document.execCommand('italic')
                setIsItalic(!isItalic)
              }}
              className={cn("h-7 w-7 p-0", isItalic && "bg-gray-200 dark:bg-gray-600")}
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => document.execCommand('insertUnorderedList')}
              className="h-7 w-7 p-0"
            >
              <List className="h-3 w-3" />
            </Button>
            <div className="text-gray-400 text-xs ml-auto">
              Type @ to mention someone
            </div>
          </div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] p-3 focus:outline-none"
          data-placeholder={placeholder}
          style={{
            whiteSpace: 'pre-wrap'
          }}
        />

        {/* Submit Button */}
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              size="sm"
              className="bg-sky-600 hover:bg-sky-700"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
              ) : (
                <Send className="h-3 w-3 mr-2" />
              )}
              Post
            </Button>
          </div>
        </div>
      </div>

      {/* Mention Dropdown */}
      {showMentions && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: mentionPosition.top,
            left: mentionPosition.left,
            minWidth: '200px'
          }}
        >
          {filteredMembers.length > 0 ? (
            filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => insertMention(member)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.user.imageUrl} />
                  <AvatarFallback className="text-xs">
                    {member.user.firstName?.[0] || member.user.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">
                    {`${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unnamed User'}
                  </div>
                  <div className="text-xs text-gray-500">{member.user.email}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No members found</div>
          )}
        </div>
      )}
    </div>
  )
}
