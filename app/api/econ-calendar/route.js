import { NextResponse } from 'next/server'

const FINNHUB = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'
const MEM = {}
const FOUR_HOURS = 4 * 60 * 60 * 1000

export async function GET() {
  const cached = MEM['econ']
  if (cached && Date.now() - cached.ts < FOUR_HOURS) return NextResponse.json(cached.data)

  try {
    const now = new Date()
    const fmt = d => d.toISOString().split('T')[0]
    const end = new Date(now.getTime() + 30 * 86400000)

    const r = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${fmt(now)}&to=${fmt(end)}&token=${FINNHUB}`
    )
    if (!r.ok) throw new Error(`Finnhub ${r.status}`)
    const d = await r.json()

    const events = (d.economicCalendar || [])
      .filter(e => e.event && e.time)
      .map(e => ({
        date: new Date(e.time),
        d:    new Date(e.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        t:    e.time?.split(' ')[1]?.slice(0,5) || '',
        imp:  e.impact === 'high' ? 'Hi' : e.impact === 'medium' ? 'Med' : 'Low',
        r:    e.event,
        country: e.country || '',
        e:    e.estimate != null ? String(e.estimate) : '—',
        p:    e.prev     != null ? String(e.prev)     : '—',
      }))
      .sort((a,b) => a.date - b.date)
      .slice(0, 25)

    MEM['econ'] = { data: events, ts: Date.now() }
    return NextResponse.json(events)
  } catch (err) {
    console.error('[econ-calendar]', err.message)
    if (MEM['econ']) return NextResponse.json(MEM['econ'].data)
    return NextResponse.json([])
  }
}