'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UpvoteButton({ productId }: { productId: string }) {
  const [count, setCount] = useState(0)
  const [upvoted, setUpvoted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/upvotes?product_id=${productId}`)
      .then(r => r.json())
      .then(d => { setCount(d.count ?? 0); setUpvoted(d.upvoted ?? false) })
      .catch(() => {})
  }, [productId])

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/upvotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (data.upvoted !== undefined) { setUpvoted(data.upvoted); setCount(data.count) }
    } finally { setLoading(false) }
  }

  return (
    <Button
      variant={upvoted ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-1.5"
    >
      <ThumbsUp className="h-4 w-4" />
      {count > 0 && <span className="text-xs">{count}</span>}
    </Button>
  )
}
