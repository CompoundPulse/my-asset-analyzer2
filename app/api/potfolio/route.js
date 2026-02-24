import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function sbHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON,
    'Authorization': `Bearer ${token}`,
  }
}

// GET /api/portfolio - fetch user's holdings
export async function GET(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json([], { status: 401 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/portfolio_holdings?select=ticker,shares,avg_cost&order=created_at.asc`,
    { headers: sbHeaders(token) }
  )
  if (!res.ok) return NextResponse.json([])
  const data = await res.json()
  return NextResponse.json(data.map(r => ({ t: r.ticker, shares: r.shares, avg: r.avg_cost })))
}

// POST /api/portfolio - add holding
export async function POST(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, shares, avg_cost } = await request.json()
  if (!ticker || !shares || !avg_cost) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_holdings`, {
    method: 'POST',
    headers: { ...sbHeaders(token), 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ ticker: ticker.toUpperCase(), shares: parseFloat(shares), avg_cost: parseFloat(avg_cost) }),
  })
  return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 500 })
}

// DELETE /api/portfolio?ticker=AAPL - remove holding
export async function DELETE(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'Missing ticker' }, { status: 400 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/portfolio_holdings?ticker=eq.${ticker}`,
    { method: 'DELETE', headers: sbHeaders(token) }
  )
  return NextResponse.json({ ok: res.ok })
}