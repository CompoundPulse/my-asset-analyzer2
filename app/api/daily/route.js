import { NextResponse } from 'next/server'

const MEM = {}
const ONE_HOUR = 60 * 60 * 1000

export const dynamic = 'force-dynamic'

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const vals = line.split(',')
    const row = {}
    headers.forEach((h, i) => row[h] = vals[i]?.trim())
    return row
  }).filter(r => r.date || r.timestamp)
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 })

  const sym = symbol.toUpperCase()
  const cached = MEM[sym]
  if (cached && Date.now() - cached.ts < ONE_HOUR) {
    return NextResponse.json({ prices: cached.prices, source: 'cache' })
  }

  // Strategy 1: Stooq CSV — completely free, no auth, very reliable
  try {
    const stooqSym = sym.toLowerCase() + (sym.length <= 4 && !sym.includes('.') ? '.us' : '')
    const url = `https://stooq.com/q/d/l/?s=${stooqSym}&i=d`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CompoundPulse/1.0)' }
    })
    if (!r.ok) throw new Error(`Stooq ${r.status}`)
    const text = await r.text()
    if (!text.includes('Date') && !text.includes('date')) throw new Error('No Stooq data')
    if (text.includes('No data')) throw new Error('Stooq no data for symbol')
    
    const rows = parseCSV(text)
    if (!rows.length) throw new Error('Empty Stooq response')
    
    const prices = rows.slice(-365).map(row => ({
      date:   row.date || row.timestamp,
      value:  parseFloat(row.close),
      close:  parseFloat(row.close),
      open:   parseFloat(row.open),
      high:   parseFloat(row.high),
      low:    parseFloat(row.low),
      volume: parseFloat(row.volume) || 0,
    })).filter(p => !isNaN(p.close))
    
    if (!prices.length) throw new Error('No valid prices from Stooq')
    MEM[sym] = { prices, ts: Date.now() }
    return NextResponse.json({ prices, source: 'stooq' })
  } catch (e) {
    console.log(`[daily] Stooq failed for ${sym}:`, e.message)
  }

  // Strategy 2: Yahoo Finance direct CSV download (no npm package needed)
  try {
    const to   = Math.floor(Date.now() / 1000)
    const from = to - 366 * 24 * 60 * 60
    const url = `https://query1.finance.yahoo.com/v7/finance/download/${sym}?period1=${from}&period2=${to}&interval=1d&events=history&includeAdjustedClose=true`
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/csv,*/*',
      }
    })
    if (!r.ok) throw new Error(`Yahoo ${r.status}`)
    const text = await r.text()
    if (!text.includes('Date')) throw new Error('No Yahoo CSV data')
    
    const rows = parseCSV(text)
    const prices = rows.map(row => ({
      date:   row.date,
      value:  parseFloat(row['adj close'] || row.close),
      close:  parseFloat(row['adj close'] || row.close),
      open:   parseFloat(row.open),
      high:   parseFloat(row.high),
      low:    parseFloat(row.low),
      volume: parseFloat(row.volume) || 0,
    })).filter(p => !isNaN(p.close))
    
    if (!prices.length) throw new Error('No valid Yahoo prices')
    MEM[sym] = { prices, ts: Date.now() }
    return NextResponse.json({ prices, source: 'yahoo-csv' })
  } catch (e) {
    console.log(`[daily] Yahoo CSV failed for ${sym}:`, e.message)
  }

  // Strategy 3: Alpha Vantage (check for rate limit message)
  try {
    const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'RUSYOJSP4I2T7BBT'
    const r = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${sym}&outputsize=full&apikey=${AV_KEY}`
    )
    if (!r.ok) throw new Error(`AV ${r.status}`)
    const d = await r.json()
    if (d['Note'] || d['Information']) throw new Error('AV rate limited')
    const ts = d['Time Series (Daily)']
    if (!ts) throw new Error('No AV data')
    
    const prices = Object.entries(ts).slice(0, 365).reverse().map(([date, v]) => ({
      date,
      value:  parseFloat(v['5. adjusted close']),
      close:  parseFloat(v['5. adjusted close']),
      open:   parseFloat(v['1. open']),
      high:   parseFloat(v['2. high']),
      low:    parseFloat(v['3. low']),
      volume: parseInt(v['6. volume']) || 0,
    }))
    MEM[sym] = { prices, ts: Date.now() }
    return NextResponse.json({ prices, source: 'alphavantage' })
  } catch (e) {
    console.log(`[daily] AlphaVantage failed for ${sym}:`, e.message)
  }

  return NextResponse.json({ prices: [], error: 'All providers failed' }, { status: 500 })
}