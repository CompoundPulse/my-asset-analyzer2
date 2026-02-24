import { NextResponse } from 'next/server'

const FINNHUB = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'
const MEM = {}
const FIFTEEN_MIN = 15 * 60 * 1000

const PAIR_DEFS = [
  { pair: 'EUR/USD', fn: r => r.EUR ? 1/r.EUR : null },
  { pair: 'USD/JPY', fn: r => r.JPY || null },
  { pair: 'GBP/USD', fn: r => r.GBP ? 1/r.GBP : null },
  { pair: 'USD/CAD', fn: r => r.CAD || null },
  { pair: 'AUD/USD', fn: r => r.AUD ? 1/r.AUD : null },
  { pair: 'USD/CHF', fn: r => r.CHF || null },
  { pair: 'NZD/USD', fn: r => r.NZD ? 1/r.NZD : null },
  { pair: 'USD/CNY', fn: r => r.CNY || null },
  { pair: 'USD/MXN', fn: r => r.MXN || null },
]

function buildPairs(rates, prevRates) {
  return PAIR_DEFS.map(def => {
    const price = def.fn(rates)
    const prev  = prevRates ? def.fn(prevRates) : null
    if (!price) return null
    const changePercent = prev ? parseFloat(((price - prev) / prev * 100).toFixed(4)) : 0
    return { pair: def.pair, price, changePercent, change: prev ? price - prev : 0 }
  }).filter(Boolean)
}

export async function GET() {
  const cached = MEM['forex']
  if (cached && Date.now() - cached.ts < FIFTEEN_MIN) return NextResponse.json(cached.data)

  // Strategy 1: open.er-api.com — no API key, free, reliable, daily updates
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { 
      next: { revalidate: 3600 } 
    })
    if (!r.ok) throw new Error(`er-api ${r.status}`)
    const d = await r.json()
    if (d.result !== 'success' || !d.rates) throw new Error('er-api bad response')

    const prevRates = MEM['forex_rates_prev']?.rates
    const data = buildPairs(d.rates, prevRates)

    MEM['forex_rates_prev'] = { rates: d.rates, ts: Date.now() }
    MEM['forex'] = { data, ts: Date.now() }
    console.log(`[forex] open.er-api.com OK: ${data.length} pairs`)
    return NextResponse.json(data)
  } catch (e) {
    console.log('[forex] open.er-api failed:', e.message)
  }

  // Strategy 2: Finnhub forex/rates endpoint
  try {
    const r = await fetch(`https://finnhub.io/api/v1/forex/rates?base=USD&token=${FINNHUB}`)
    if (!r.ok) throw new Error(`finnhub ${r.status}`)
    const d = await r.json()
    if (!d.quote) throw new Error('no quote')

    const prevRates = MEM['forex_rates_prev']?.rates
    const data = buildPairs(d.quote, prevRates)

    MEM['forex_rates_prev'] = { rates: d.quote, ts: Date.now() }
    MEM['forex'] = { data, ts: Date.now() }
    console.log(`[forex] finnhub OK: ${data.length} pairs`)
    return NextResponse.json(data)
  } catch (e) {
    console.log('[forex] finnhub failed:', e.message)
  }

  // Return stale cache if both fail
  if (cached) return NextResponse.json(cached.data)
  return NextResponse.json([], { status: 500 })
}