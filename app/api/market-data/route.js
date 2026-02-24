// /api/market-data/route.js
// Unified market data endpoint with Supabase 4-hour caching
// ~5-6 Finnhub calls per day instead of hundreds

import { NextResponse } from 'next/server'

// In-memory fallback cache when Supabase not configured
const MEM = {}
async function cacheOr(key, fetchFn, maxAgeMs) {
  // Try Supabase first
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { cacheOr: sbCacheOr } = await import('../../../lib/supabase-cache')
      return sbCacheOr(key, fetchFn, maxAgeMs)
    } catch {}
  }
  // Fallback: in-memory cache
  const c = MEM[key]
  if (c && Date.now() - c.ts < maxAgeMs) {
    console.log(`[mem cache HIT] ${key}`)
    return { data: c.data, fromCache: true }
  }
  console.log(`[mem cache MISS] ${key}`)
  const data = await fetchFn()
  MEM[key] = { data, ts: Date.now() }
  return { data, fromCache: false }
}

const FINNHUB = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'
const FOUR_HOURS = 4 * 60 * 60 * 1000
const FIFTEEN_MIN = 15 * 60 * 1000

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function finnhubQuote(symbol) {
  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB}`)
  if (!r.ok) return null
  const d = await r.json()
  if (!d?.c || d.c === 0) return null
  const pct = d.pc > 0 ? ((d.c - d.pc) / d.pc) * 100 : 0
  return { price: d.c, changePercent: parseFloat(pct.toFixed(2)), change: d.d, high: d.h, low: d.l, prevClose: d.pc }
}

async function fetchQuotes(symbols) {
  const results = await Promise.allSettled(symbols.map(s => finnhubQuote(s).then(d => ({ s, d }))))
  const map = {}
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value?.d) map[r.value.s] = r.value.d
  }
  return map
}

async function fetchNews() {
  const r = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB}`)
  if (!r.ok) return []
  const data = await r.json()
  return data.slice(0, 15).map(n => ({
    t:    n.related || '',
    h:    n.headline,
    src:  n.source,
    time: new Date(n.datetime * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    url:  n.url,
  }))
}

async function fetchScreener() {
  // Finnhub stock screener — US stocks, sorted by change
  // We fetch top gainers and losers via their scan endpoint
  try {
    const r = await fetch(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${FINNHUB}`)
    if (!r.ok) return { gainers: [], losers: [] }
    // Finnhub doesn't have a free screener — use pre-selected major tickers
    // and sort by actual fetched changePercent
    return null // signals we use the quotes map instead
  } catch { return null }
}

async function fetchEarnings() {
  const today = new Date()
  const end   = new Date(today); end.setDate(end.getDate() + 7)
  const fmt   = d => d.toISOString().split('T')[0]
  const r = await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${fmt(today)}&to=${fmt(end)}&token=${FINNHUB}`)
  if (!r.ok) return []
  const data = await r.json()
  const byDate = {}
  for (const e of (data.earningsCalendar || [])) {
    if (!byDate[e.date]) byDate[e.date] = []
    if (byDate[e.date].length < 12) byDate[e.date].push(e.symbol)
  }
  return Object.entries(byDate)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(0, 6)
    .map(([date, tt]) => ({
      d: new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric'}),
      tt,
    }))
}

async function fetchEcon() {
  const today = new Date()
  const end   = new Date(today); end.setDate(end.getDate() + 7)
  const fmt   = d => d.toISOString().split('T')[0]
  const r = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${fmt(today)}&to=${fmt(end)}&token=${FINNHUB}`)
  if (!r.ok) return []
  const data = await r.json()
  return (data.economicCalendar || []).filter(e => e.event && e.time).slice(0, 10).map(e => ({
    d:   e.time.split(' ')[0],
    t:   e.time.split(' ')[1]?.slice(0,5) || '',
    imp: e.impact === 'high' ? 'Hi' : e.impact === 'medium' ? 'Med' : 'Low',
    r:   e.event,
    e:   e.estimate != null ? String(e.estimate) : '—',
    p:   e.prev     != null ? String(e.prev)     : '—',
  }))
}

async function fetchInsider() {
  const tickers = ['AAPL','MSFT','NVDA','META','GOOGL','TSLA','JPM','AMZN','V','AMD']
  const results = await Promise.allSettled(
    tickers.map(t =>
      fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${t}&token=${FINNHUB}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => ({ t, data: d }))
        .catch(() => ({ t, data: null }))
    )
  )
  const rows = []
  for (const r of results) {
    if (r.status !== 'fulfilled' || !r.value?.data?.data) continue
    const { t, data } = r.value
    const recent = data.data.filter(tx => tx.transactionPrice > 0 && tx.share !== 0).slice(0, 2)
    for (const tx of recent) {
      rows.push({
        t,
        name:  tx.name,
        role:  tx.filingType || 'Officer',
        type:  tx.change > 0 ? 'Purchase' : 'Sale',
        shares: Math.abs(tx.share).toLocaleString(),
        val:   `$${(Math.abs(tx.share) * tx.transactionPrice / 1e6).toFixed(2)}M`,
        date:  tx.transactionDate,
        url:   `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${t}&type=4&dateb=&owner=include&count=10`,
      })
    }
  }
  rows.sort((a,b) => new Date(b.date) - new Date(a.date))
  return rows.slice(0, 15)
}

// ─── All tickers we track ─────────────────────────────────────────────────────
const ALL_TICKERS = [
  // Signal table L
  'NVDA','AMD','META','GOOGL','AMZN','TSLA','AAPL','MSFT','LLY','V','MA',
  'COST','HD','SPY','QQQ','SOXS','CSGP','JPM',
  // Signal table R
  'NKE','BA','PFE','T','WBA','VZ','CVS','INTC','DIS','XOM','CVX','ARKK','TQQQ','IWM','GLD','TLT','F',
  // Sector ETFs
  'XLK','XLV','XLF','XLY','XLC','XLI','XLE','XLP','XLRE','XLU','XLB',
  // Futures proxies
  'USO','UNG','DIA','VIXY','SLV',
  // Forex ETFs
  'FXE','FXY','FXB','FXC','FXA','UUP',
  // Screener extras
  'WMT','NFLX',
  // Groups
  'GS','BAC','WFC','MS','UNH','ABBV','MRK','JNJ','HON','CAT','RTX','GE',
  'KO','PEP','PG','WMT','AMT','EQIX','SPG','NEE','DUK','AEP','LIN','APD',
]

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section') || 'all'

  try {
    if (section === 'quotes') {
      // Quotes refresh every 15 min (market hours data)
      const { data } = await cacheOr('quotes_v1', () => fetchQuotes(ALL_TICKERS), FIFTEEN_MIN)
      return NextResponse.json(data)
    }

    if (section === 'news') {
      const { data } = await cacheOr('news_v1', fetchNews, FIFTEEN_MIN)
      return NextResponse.json(data)
    }

    if (section === 'earnings') {
      const { data } = await cacheOr('earnings_v1', fetchEarnings, FOUR_HOURS)
      return NextResponse.json(data)
    }

    if (section === 'econ') {
      const { data } = await cacheOr('econ_v1', fetchEcon, FOUR_HOURS)
      return NextResponse.json(data)
    }

    if (section === 'insider') {
      const { data } = await cacheOr('insider_v1', fetchInsider, FOUR_HOURS)
      return NextResponse.json(data)
    }

    // 'all' — fetch everything, each section independently cached
    const [quotes, news, earnings, econ, insider] = await Promise.all([
      cacheOr('quotes_v1',  () => fetchQuotes(ALL_TICKERS), FIFTEEN_MIN).then(r => r.data),
      cacheOr('news_v1',    fetchNews,    FIFTEEN_MIN).then(r => r.data),
      cacheOr('earnings_v1',fetchEarnings,FOUR_HOURS).then(r => r.data),
      cacheOr('econ_v1',    fetchEcon,    FOUR_HOURS).then(r => r.data),
      cacheOr('insider_v1', fetchInsider, FOUR_HOURS).then(r => r.data),
    ])

    return NextResponse.json({ quotes, news, earnings, econ, insider })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}