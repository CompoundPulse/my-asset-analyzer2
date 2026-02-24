import { NextResponse } from 'next/server'

const FINNHUB_KEY = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'

export async function GET() {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`
    )
    if (!res.ok) throw new Error(`Finnhub ${res.status}`)
    const data = await res.json()
    const news = data.slice(0, 15).map(n => ({
      t:    n.related || '',
      h:    n.headline,
      src:  n.source,
      time: new Date(n.datetime * 1000).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
      url:  n.url,
    }))
    return NextResponse.json(news)
  } catch (err) {
    return NextResponse.json([], { status: 500 })
  }
}