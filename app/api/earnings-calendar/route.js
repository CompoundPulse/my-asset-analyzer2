import { NextResponse } from 'next/server'

const FINNHUB_KEY = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'

export async function GET() {
  try {
    const today = new Date()
    const end   = new Date(today); end.setDate(end.getDate() + 7)
    const fmt   = d => d.toISOString().split('T')[0]

    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${fmt(today)}&to=${fmt(end)}&token=${FINNHUB_KEY}`
    )
    if (!res.ok) throw new Error(`Finnhub ${res.status}`)
    const data = await res.json()

    const byDate = {}
    for (const e of (data.earningsCalendar || [])) {
      if (!byDate[e.date]) byDate[e.date] = []
      if (byDate[e.date].length < 12) byDate[e.date].push(e.symbol)
    }

    const rows = Object.entries(byDate)
      .sort(([a],[b]) => a.localeCompare(b))
      .slice(0, 6)
      .map(([date, tickers]) => ({
        d:  new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric'}),
        tt: tickers,
      }))

    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json([], { status: 500 })
  }
}