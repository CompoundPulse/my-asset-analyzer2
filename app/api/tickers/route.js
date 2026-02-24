import { NextResponse } from 'next/server'

const FINNHUB_KEY = process.env.FINNHUB_KEY || 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'

const STOCKS  = ['AAPL','NVDA','TSLA','SPY','MSFT','AMZN','QQQ','GOOGL','META','GLD']
const CRYPTOS = [
  { sym:'BTC', fh:'BINANCE:BTCUSDT' },
  { sym:'ETH', fh:'BINANCE:ETHUSDT' },
  { sym:'SOL', fh:'BINANCE:SOLUSDT' },
]
const ORDER = ['AAPL','NVDA','TSLA','BTC','ETH','SPY','MSFT','SOL','AMZN','QQQ','GOOGL','META','GLD']

function fmtPrice(n, isCrypto) {
  if (!n || isNaN(n)) return '—'
  if (isCrypto && n > 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n < 1) return '$' + n.toFixed(4)
  return '$' + n.toFixed(2)
}

async function fetchQuote(sym, fhSym, isCrypto) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${fhSym}&token=${FINNHUB_KEY}`
  const r = await fetch(url, { next: { revalidate: 60 } })
  if (!r.ok) throw new Error(`${sym} HTTP ${r.status}`)
  const d = await r.json()
  if (!d.c || d.c === 0) throw new Error(`${sym} no data`)
  const pct = typeof d.dp === 'number' ? d.dp : ((d.c - d.pc) / d.pc * 100)
  return {
    sym,
    price: fmtPrice(d.c, isCrypto),
    chg:   (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%',
    up:    pct >= 0,
    vol:   '—',
  }
}

export async function GET() {
  const settled = await Promise.allSettled([
    ...STOCKS.map(s  => fetchQuote(s, s, false)),
    ...CRYPTOS.map(c => fetchQuote(c.sym, c.fh, true)),
  ])

  const results = []
  for (const r of settled) {
    if (r.status === 'fulfilled') results.push(r.value)
    else console.warn('[tickers]', r.reason?.message)
  }

  if (results.length < 5) {
    return NextResponse.json({ error: `Only ${results.length} symbols. Key may be wrong.` }, { status: 500 })
  }

  results.sort((a, b) => {
    const ai = ORDER.indexOf(a.sym), bi = ORDER.indexOf(b.sym)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  console.log(`[tickers] ${results.length} symbols live`)
  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  })
}