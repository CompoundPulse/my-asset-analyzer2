import { NextResponse } from 'next/server'

const FINNHUB_KEY = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'

export async function GET() {
  try {
    // Fetch insider transactions for a set of major tickers
    const tickers = ['AAPL','MSFT','NVDA','META','GOOGL','TSLA','JPM','AMZN','V','AMD']
    const results = await Promise.allSettled(
      tickers.map(t =>
        fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${t}&token=${FINNHUB_KEY}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => ({ t, data: d }))
          .catch(() => ({ t, data: null }))
      )
    )

    const rows = []
    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value?.data?.data) continue
      const { t, data } = r.value
      // Take the most recent transaction per ticker
      const recent = data.data
        .filter(tx => tx.transactionPrice > 0 && tx.share !== 0)
        .slice(0, 2)
      for (const tx of recent) {
        rows.push({
          t,
          name:   tx.name,
          role:   tx.filingType || 'Officer',
          type:   tx.change > 0 ? 'Purchase' : 'Sale',
          shares: Math.abs(tx.share).toLocaleString(),
          val:    `$${(Math.abs(tx.share) * tx.transactionPrice / 1e6).toFixed(2)}M`,
          date:   tx.transactionDate,
          url:    `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${t}&type=4&dateb=&owner=include&count=10`,
        })
      }
    }

    // Sort by date desc, take top 15
    rows.sort((a,b) => new Date(b.date) - new Date(a.date))
    return NextResponse.json(rows.slice(0, 15))
  } catch (err) {
    return NextResponse.json([], { status: 500 })
  }
}