// app/api/market-news/route.js
// Finnhub news proxy with category param + 15-min in-memory cache
// Supports: ?category=general|forex|stocks|etf|crypto
// Finnhub free categories: general, forex, crypto, merger

import { NextResponse } from 'next/server'

const FINNHUB_KEY = process.env.FINNHUB_KEY || 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'

const CAT_MAP = {
  general: 'general',
  stocks:  'general',   // no dedicated feed on free tier
  etf:     'general',
  forex:   'forex',
  crypto:  'crypto',
  merger:  'merger',
}

const CACHE = {}
const TTL = 15 * 60 * 1000  // 15 min

function fmtDate(ts) {
  const d = new Date(ts * 1000)
  const diffH = (Date.now() - d) / 3_600_000
  if (diffH < 18) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const cat        = searchParams.get('category') || 'general'
  const finnhubCat = CAT_MAP[cat] || 'general'
  const limit      = parseInt(searchParams.get('limit') || '50')

  const cached = CACHE[finnhubCat]
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } })
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=${finnhubCat}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 900 } }
    )
    if (!res.ok) throw new Error(`Finnhub ${res.status}`)

    const raw = await res.json()
    if (!Array.isArray(raw) || !raw.length) throw new Error('empty')

    const news = raw
      .filter(n => n.headline?.length > 10)
      .slice(0, limit)
      .map(n => ({
        h:       n.headline,
        src:     n.source,
        time:    fmtDate(n.datetime),
        url:     n.url,
        t:       n.related || '',
        summary: n.summary || n.headline,
        tickers: n.related
          ? n.related.split(',').map(s => s.trim()).filter(s => /^[A-Z]{1,5}$/.test(s))
          : [],
      }))

    CACHE[finnhubCat] = { data: news, ts: Date.now() }
    return NextResponse.json(news)

  } catch (err) {
    console.error('[market-news]', err.message)
    if (cached) return NextResponse.json(cached.data, { headers: { 'X-Cache': 'STALE' } })
    return NextResponse.json([])   // client falls back to sample data
  }
}