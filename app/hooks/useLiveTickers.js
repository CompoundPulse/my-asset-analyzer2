'use client'
import { useState, useEffect, useRef } from 'react'

const FALLBACK = [
  { sym:'AAPL',  price:'$213.49', chg:'+1.24%', up:true,  vol:'58.2M' },
  { sym:'NVDA',  price:'$878.30', chg:'+3.14%', up:true,  vol:'41.7M' },
  { sym:'TSLA',  price:'$412.00', chg:'+0.07%', up:true,  vol:'92.1M' },
  { sym:'BTC',   price:'$97,420', chg:'+2.81%', up:true,  vol:'—'     },
  { sym:'ETH',   price:'$3,241',  chg:'-0.92%', up:false, vol:'—'     },
  { sym:'SPY',   price:'$529.10', chg:'+0.41%', up:true,  vol:'71.3M' },
  { sym:'MSFT',  price:'$418.60', chg:'+0.63%', up:true,  vol:'22.8M' },
  { sym:'SOL',   price:'$185.40', chg:'+4.22%', up:true,  vol:'—'     },
  { sym:'AMZN',  price:'$225.80', chg:'+1.80%', up:true,  vol:'31.4M' },
  { sym:'QQQ',   price:'$451.20', chg:'+0.89%', up:true,  vol:'38.6M' },
]

export function useLiveTickers() {
  const [tickers, setTickers] = useState(FALLBACK)
  const [live, setLive] = useState(false)
  const ref = useRef(null)

  const load = async () => {
    try {
      const res = await fetch('/api/tickers')
      console.log('[useLiveTickers] status:', res.status)
      if (!res.ok) {
        const text = await res.text()
        console.error('[useLiveTickers] error body:', text)
        return
      }
      const data = await res.json()
      console.log('[useLiveTickers] got data:', data)
      if (Array.isArray(data) && data.length >= 5) {
        setTickers(data)
        setLive(true)
      }
    } catch (e) {
      console.error('[useLiveTickers] fetch failed:', e.message)
    }
  }

  useEffect(() => {
    load()
    ref.current = setInterval(load, 60000)
    return () => clearInterval(ref.current)
  }, [])

  return { tickers, live }
}