import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { productA, productB } = await req.json()

    const prompt = `Compare these two tech products and give a concise verdict on when to use each one.

Product A: ${productA.name}
Category: ${productA.category}
Tags: ${(productA.tags ?? []).slice(0, 8).join(', ')}
Signal score: ${productA.signal_score ?? 'N/A'}
Description: ${productA.tagline ?? ''}

Product B: ${productB.name}
Category: ${productB.category}
Tags: ${(productB.tags ?? []).slice(0, 8).join(', ')}
Signal score: ${productB.signal_score ?? 'N/A'}
Description: ${productB.tagline ?? ''}

Give a 3-4 sentence verdict: who each product is best for, key differentiator, and a final recommendation. Be direct and opinionated.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ verdict: text })
  } catch (err) {
    console.error('/api/compare/verdict error:', err)
    return NextResponse.json({ verdict: 'Unable to generate verdict.' }, { status: 500 })
  }
}
