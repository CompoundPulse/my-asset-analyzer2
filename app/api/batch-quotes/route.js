// /api/batch-quotes/route.js
// Now just a thin proxy to /api/market-data?section=quotes
// All caching handled there via Supabase
import { NextResponse } from 'next/server'

const FINNHUB = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'

async function finnhubQuote(symbol) {
  try {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB}`)
    if (!r.ok) return null
    const d = await r.json()
    if (!d?.c || d.c === 0) return null
    const pct = d.pc > 0 ? ((d.c - d.pc) / d.pc) * 100 : 0
    return { price: d.c, changePercent: parseFloat(pct.toFixed(2)), change: d.d, high: d.h, low: d.l, prevClose: d.pc }
  } catch { return null }
}

// Simple in-memory cache - survives across requests in same server process
const MEM_CACHE = {}
const FIFTEEN_MIN = 15 * 60 * 1000

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols')
  if (!symbols) return NextResponse.json({})
  const syms = [...new Set(symbols.split(',').filter(Boolean))]

  const cacheKey = syms.slice().sort().join(',')
  const cached = MEM_CACHE[cacheKey]
  if (cached && Date.now() - cached.ts < FIFTEEN_MIN) {
    console.log(`[batch-quotes cache HIT] ${cacheKey.slice(0,40)}`)
    return NextResponse.json(cached.data)
  }

  console.log(`[batch-quotes fetch] ${syms.length} symbols`)
  const results = await Promise.allSettled(syms.map(s => finnhubQuote(s).then(d => ({ s, d }))))
  const map = {}
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value?.d) map[r.value.s] = r.value.d
  }

  MEM_CACHE[cacheKey] = { data: map, ts: Date.now() }
  return NextResponse.json(map)
}