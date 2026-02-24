import { NextResponse } from 'next/server'

const FINNHUB = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'
const MEM = {}
const FIFTEEN_MIN = 15 * 60 * 1000

// All confirmed working ETF proxies on Finnhub free tier
// Gold: GLD ($1 = ~0.16 oz gold, but tracks price movement accurately)
// We show ETF price + note it's a proxy
const CONTRACTS = [
  { name:'Gold',          sym:'GLD',  label:'GLD ETF' },
  { name:'Silver',        sym:'SLV',  label:'SLV ETF' },
  { name:'Crude Oil',     sym:'USO',  label:'USO ETF' },
  { name:'Natural Gas',   sym:'UNG',  label:'UNG ETF' },
  { name:'S&P 500',       sym:'SPY',  label:'SPY ETF' },
  { name:'Nasdaq 100',    sym:'QQQ',  label:'QQQ ETF' },
  { name:'Dow Jones',     sym:'DIA',  label:'DIA ETF' },
  { name:'Russell 2000',  sym:'IWM',  label:'IWM ETF' },
  { name:'20Y T-Bond',    sym:'TLT',  label:'TLT ETF' },
  { name:'VIX (est.)',    sym:'VIXY', label:'VIXY ETF' },
]

async function fetchOne(c) {
  try {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${c.sym}&token=${FINNHUB}`)
    if (!r.ok) return null
    const d = await r.json()
    if (!d?.c || d.c === 0) return null
    const pct = d.pc > 0 ? ((d.c - d.pc) / d.pc) * 100 : 0
    return { name: c.name, label: c.label, price: d.c, changePercent: parseFloat(pct.toFixed(2)), change: d.d, high: d.h, low: d.l }
  } catch { return null }
}

export async function GET() {
  const c = MEM['futures']
  if (c && Date.now() - c.ts < FIFTEEN_MIN) return NextResponse.json(c.data)

  const results = await Promise.allSettled(CONTRACTS.map(fetchOne))
  const data = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)

  MEM['futures'] = { data, ts: Date.now() }
  return NextResponse.json(data)
}