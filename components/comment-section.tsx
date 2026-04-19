'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createBrowserSupabaseClient } from '@/lib/auth-client'
import type { Comment } from '@/lib/db/comments'
import type { User } from '@supabase/supabase-js'

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface CommentSectionProps {
  productId: string
  initialComments: Comment[]
  initialCount: number
}

export function CommentSection({ productId, initialComments, initialCount }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [count, setCount] = useState(initialCount)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabaseRef = useRef(createBrowserSupabaseClient())

  useEffect(() => {
    supabaseRef.current.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !content.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, content: content.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        const newComment: Comment = {
          ...data.comment,
          author_name: data.comment.author_name ?? user.email?.split('@')[0] ?? 'User',
        }
        setComments(prev => [newComment, ...prev])
        setCount(prev => prev + 1)
        setContent('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl font-semibold mb-4">
        Discussion{' '}
        <span className="text-sm text-muted-foreground font-sans font-normal ml-2">
          {count} {count === 1 ? 'comment' : 'comments'}
        </span>
      </h2>

      {/* Post comment form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <textarea
            rows={4}
            maxLength={1000}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={user ? 'Share your thoughts...' : 'Sign in to join the discussion'}
            disabled={!user || submitting}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground pointer-events-none">
            {content.length}/1000
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          {!user && (
            <Link href="/login" className="text-sm text-primary hover:underline">
              Sign in to comment
            </Link>
          )}
          <div className={!user ? 'ml-auto' : ''}>
            <Button
              type="submit"
              size="sm"
              disabled={!user || submitting || content.trim().length === 0}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </form>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="divide-y divide-border/50">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3 py-4 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
                {(comment.author_name || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{comment.author_name || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
