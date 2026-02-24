'use client'
/**
 * PageNews.jsx — CompoundPulse
 *
 * Finviz-exact news layout:
 *  • Sub-nav tabs: Market News / Market Pulse / Stocks News / ETF News / Crypto News
 *  • Two-column split: LEFT = News feed | RIGHT = Blogs feed
 *  • "View by" toggle: Time / Source (groups rows by source with headers)
 *  • Source favicon badges — color-coded per outlet, exact Finviz style
 *  • Hover tooltip previews on headlines
 *  • Live data: /api/market-news (Finnhub) with 15-min in-component cache
 *  • Category switching fetches the right endpoint per tab
 *  • Refresh button with spinner
 *  • Ticker chips → onT() to navigate to quote page
 *  • Full dark/light theme via CSS vars (globals.css)
 *  • Responsive: collapses to single column on narrow viewports
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { C, bd } from './dashTheme'

/* ─── CONSTANTS ─────────────────────────────────────────────────── */

const FONT = "'Lato','Verdana','Arial','Tahoma',sans-serif"

const SUB_TABS = [
  { label: 'Market News',  cat: 'general' },
  { label: 'Market Pulse', cat: 'forex'   },
  { label: 'Stocks News',  cat: 'stocks'  },
  { label: 'ETF News',     cat: 'etf'     },
  { label: 'Crypto News',  cat: 'crypto'  },
]

const VIEW_BY = ['Time', 'Source']

/* ─── SOURCE CONFIG ─────────────────────────────────────────────── */
const SRC_CFG = {
  'bloomberg':             { abbr:'BB',  fg:'#64b5f6', bg:'#0a1929' },
  'reuters':               { abbr:'R',   fg:'#ff8a65', bg:'#1a0a00' },
  'wsj':                   { abbr:'WSJ', fg:'#e0c97a', bg:'#1a1400' },
  'wall street journal':   { abbr:'WSJ', fg:'#e0c97a', bg:'#1a1400' },
  'cnbc':                  { abbr:'C',   fg:'#f6b93b', bg:'#1a0f00' },
  'marketwatch':           { abbr:'MW',  fg:'#66bb6a', bg:'#001a03' },
  'market watch':          { abbr:'MW',  fg:'#66bb6a', bg:'#001a03' },
  'new york times':        { abbr:'NYT', fg:'#e0e0e0', bg:'#1a1a1a' },
  'the new york times':    { abbr:'NYT', fg:'#e0e0e0', bg:'#1a1a1a' },
  'yahoo finance':         { abbr:'Y!',  fg:'#ce93d8', bg:'#12001a' },
  'yahoo':                 { abbr:'Y!',  fg:'#ce93d8', bg:'#12001a' },
  'bbc':                   { abbr:'BBC', fg:'#ef9a9a', bg:'#1a0000' },
  'fox business':          { abbr:'FOX', fg:'#90caf9', bg:'#00091a' },
  'financial times':       { abbr:'FT',  fg:'#ffcc80', bg:'#1a0c00' },
  "barron's":              { abbr:'B',   fg:'#e0c97a', bg:'#1a1400' },
  'barrons':               { abbr:'B',   fg:'#e0c97a', bg:'#1a1400' },
  'seeking alpha':         { abbr:'SA',  fg:'#4fc3f7', bg:'#001525' },
  'investopedia':          { abbr:'INV', fg:'#4dd0e1', bg:'#001520' },
  'forbes':                { abbr:'F',   fg:'#ef9a9a', bg:'#1a0000' },
  'motley fool':           { abbr:'MF',  fg:'#ef5350', bg:'#1a0000' },
  'the motley fool':       { abbr:'MF',  fg:'#ef5350', bg:'#1a0000' },
  'benzinga':              { abbr:'BZ',  fg:'#f6c90e', bg:'#1a1200' },
  'business insider':      { abbr:'BI',  fg:'#ef5350', bg:'#1a0000' },
  'ap':                    { abbr:'AP',  fg:'#ef9a9a', bg:'#1a0000' },
  'associated press':      { abbr:'AP',  fg:'#ef9a9a', bg:'#1a0000' },
  'coindesk':              { abbr:'CD',  fg:'#7986cb', bg:'#00061a' },
  'cointelegraph':         { abbr:'CT',  fg:'#64b5f6', bg:'#000d1a' },
  'decrypt':               { abbr:'DC',  fg:'#ffb74d', bg:'#1a0a00' },
  'etf.com':               { abbr:'ETF', fg:'#4dd0e1', bg:'#001520' },
}

function srcCfg(src) {
  if (!src) return { abbr: '?', fg: '#888', bg: '#222' }
  const k = src.toLowerCase()
  if (SRC_CFG[k]) return SRC_CFG[k]
  for (const [key, v] of Object.entries(SRC_CFG)) {
    if (k.includes(key) || key.includes(k)) return v
  }
  // deterministic fallback
  const hue = [...src].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return { abbr: src.slice(0, 2).toUpperCase(), fg: `hsl(${hue},60%,65%)`, bg: `hsl(${hue},35%,10%)` }
}

/* ─── SOURCE BADGE ──────────────────────────────────────────────── */
function Badge({ src, size = 22 }) {
  const { abbr, fg, bg } = srcCfg(src)
  const fs = abbr.length > 2 ? 7 : abbr.length === 2 ? 8 : 10
  return (
    <div style={{
      width: size, height: size, flexShrink: 0, borderRadius: 3,
      background: bg, border: `1px solid ${fg}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: fs, fontWeight: 900, color: fg, fontFamily: 'Arial,sans-serif', lineHeight: 1, letterSpacing: '-0.5px' }}>
        {abbr}
      </span>
    </div>
  )
}

/* ─── HOVER TOOLTIP ─────────────────────────────────────────────── */
function Tip({ text, children }) {
  const [on, setOn]   = useState(false)
  const [xy, setXY]   = useState({ x: 0, y: 0 })
  const move = useCallback(e => setXY({ x: e.clientX, y: e.clientY }), [])
  if (!text) return children
  return (
    <span
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onMouseMove={move}
      style={{ display: 'contents' }}
    >
      {children}
      {on && (
        <div style={{
          position: 'fixed',
          left: Math.min(xy.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 430),
          top: xy.y + 18,
          width: 400, zIndex: 9999,
          padding: '8px 12px',
          background: 'var(--cp-bg1)',
          border: '1px solid var(--cp-bg3)',
          borderRadius: 4, fontSize: 12,
          color: 'var(--cp-txt)', lineHeight: 1.55,
          boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </span>
  )
}

/* ─── SINGLE ROW ────────────────────────────────────────────────── */
function Row({ item, idx, viewBy, onT }) {
  const [hov, setHov] = useState(false)
  const { time, headline, url, source, summary, tickers = [] } = item

  const open = () => { if (url && url !== '#') window.open(url, '_blank', 'noopener,noreferrer') }

  return (
    <tr
      onClick={open}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--cp-bg2)' : idx % 2 ? 'var(--cp-bg1)' : 'var(--cp-bg0)',
        cursor: url && url !== '#' ? 'pointer' : 'default',
        transition: 'background 0.07s',
      }}
    >
      {/* badge */}
      <td style={{ width: 28, padding: '4px 2px 4px 6px', borderBottom: bd, verticalAlign: 'middle' }}>
        <Badge src={source} />
      </td>

      {/* time */}
      <td style={{
        width: 64, padding: '4px 6px', borderBottom: bd,
        fontSize: 11, color: 'var(--cp-txt2)', whiteSpace: 'nowrap',
        verticalAlign: 'middle', textAlign: 'right', fontFamily: FONT,
      }}>
        {time}
      </td>

      {/* headline + tickers */}
      <td style={{ padding: '4px 6px', borderBottom: bd, verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
          <Tip text={summary}>
            <a
              href={url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                color: hov ? 'var(--cp-link)' : 'var(--cp-txt)',
                textDecoration: hov ? 'underline' : 'none',
                fontSize: 13, lineHeight: 1.42, fontFamily: FONT,
              }}
            >
              {headline}
            </a>
          </Tip>
          {tickers.slice(0, 5).map(t => (
            <button
              key={t}
              onClick={e => { e.stopPropagation(); onT && onT(t) }}
              style={{
                fontSize: 10, fontWeight: 700, color: 'var(--cp-link)',
                background: 'var(--cp-bg2)', border: '1px solid var(--cp-bg3)',
                borderRadius: 2, padding: '1px 5px', cursor: 'pointer',
                fontFamily: FONT, lineHeight: 1.4, flexShrink: 0,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </td>

      {/* source name — only in Time mode */}
      {viewBy === 'Time' && (
        <td style={{
          width: 104, padding: '4px 8px 4px 4px', borderBottom: bd,
          fontSize: 11, color: 'var(--cp-txt2)', whiteSpace: 'nowrap',
          verticalAlign: 'middle', textAlign: 'right', fontFamily: FONT,
        }}>
          {source}
        </td>
      )}
    </tr>
  )
}

/* ─── SOURCE GROUP HEADER ───────────────────────────────────────── */
function SrcHdr({ source, count }) {
  const { fg } = srcCfg(source)
  return (
    <tr>
      <td colSpan={4} style={{
        padding: '6px 8px 5px',
        background: 'var(--cp-bg2)',
        borderTop: bd, borderBottom: bd,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Badge src={source} size={17} />
          <span style={{ fontSize: 12, fontWeight: 700, color: fg, fontFamily: FONT }}>{source}</span>
          <span style={{ fontSize: 11, color: 'var(--cp-txt3)' }}>({count})</span>
        </div>
      </td>
    </tr>
  )
}

/* ─── SKELETON LOADER ───────────────────────────────────────────── */
function Skeleton() {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {Array.from({ length: 14 }).map((_, i) => (
          <tr key={i} style={{ background: i % 2 ? 'var(--cp-bg1)' : 'var(--cp-bg0)' }}>
            <td style={{ width: 28, padding: '5px 2px 5px 6px', borderBottom: bd }}>
              <div style={{ width: 22, height: 22, borderRadius: 3, background: 'var(--cp-bg3)' }} />
            </td>
            <td style={{ width: 64, padding: '5px 6px', borderBottom: bd }}>
              <div style={{ height: 11, width: 45, borderRadius: 2, background: 'var(--cp-bg3)', marginLeft: 'auto' }} />
            </td>
            <td style={{ padding: '5px 6px', borderBottom: bd }}>
              <div style={{
                height: 12, borderRadius: 2, background: 'var(--cp-bg3)',
                width: `${55 + Math.sin(i * 1.9) * 35}%`,
                animation: 'cp-pulse 1.6s ease-in-out infinite',
                animationDelay: `${i * 0.07}s`,
              }} />
            </td>
            <td style={{ width: 104, padding: '5px 8px 5px 4px', borderBottom: bd }}>
              <div style={{ height: 11, width: 70, borderRadius: 2, background: 'var(--cp-bg3)', marginLeft: 'auto' }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}


/* ─── FALLBACK SAMPLE DATA ──────────────────────────────────────── */
const SAMPLES = {
  general: [
    { time:'05:30AM', headline:'Commerce is becoming fragmented, and prices on the basic building blocks of the economy are more volatile', source:'WSJ', url:'#', summary:'Trade barriers are reshaping global commodity markets, with prices for metals and oil becoming increasingly disconnected.', tickers:[] },
    { time:'05:28AM', headline:'For India, Buying Russian Oil Just Got More Complicated', source:'New York Times', url:'#', summary:"India's PM acceded to many of Trump's demands under pressure of heavy tariffs. Rejecting them now would be awkward.", tickers:[] },
    { time:'05:12AM', headline:'Brazil, India Seal Rare Earth Deal Amid Global Supply Strains', source:'Bloomberg', url:'#', summary:'The agreement is part of a broader effort by both countries to reduce dependence on China for critical materials.', tickers:[] },
    { time:'05:02AM', headline:"Fred Segal Has a New Owner. This Time It's Aritzia.", source:'WSJ', url:'#', summary:'The storied LA retailer has been acquired by mass-market brand Aritzia.', tickers:[] },
    { time:'04:30AM', headline:'Trump Doubles Down on Closing Tax Loophole on Cheap Imports', source:'New York Times', url:'#', summary:'The administration is moving to close the de minimis exemption allowing packages under $800 to enter duty-free.', tickers:[] },
    { time:'04:07AM', headline:'Indian Opposition Calls For Modi to Put US Trade Deal on Hold', source:'Bloomberg', url:'#', summary:'Opposition lawmakers say India is giving away too much in a rush to avoid US tariffs.', tickers:[] },
    { time:'03:15AM', headline:'Stocks Rise Anew, Bonds Fall on Trump Tariff Talk: Markets Wrap', source:'Bloomberg', url:'#', summary:'US equities rebounded for a third consecutive session as traders bet tariff rhetoric would ease.', tickers:['SPY','QQQ','TLT'] },
    { time:'02:55AM', headline:"From 'buy America' to 'bye America', Wall Street exodus gathers pace", source:'Reuters', url:'#', summary:'Foreign investors are pulling capital from US assets at the fastest pace in years.', tickers:['SPY'] },
    { time:'12:00AM', headline:"'Murky Waters' for Global Businesses After Trump's Tariff Loss", source:'New York Times', url:'#', summary:'Companies that reorganized supply chains now face an uncertain path after the Supreme Court ruling.', tickers:[] },
    { time:'Feb-20',  headline:'South Korea Says US Trade Deal Still Intact After Tariff Ruling', source:'Bloomberg', url:'#', summary:'Korean officials said bilateral trade agreements remain in force.', tickers:[] },
    { time:'Feb-20',  headline:'Supreme Court tariff ruling clouds Fed rate path after a year of upheaval', source:'Reuters', url:'#', summary:'The ruling complicates the Federal Reserve\'s inflation outlook.', tickers:['TLT','GLD'] },
    { time:'Feb-20',  headline:'Mexico, Canada Get Exemption to 10% US Levy But USMCA Risk Looms', source:'Bloomberg', url:'#', summary:'The US granted temporary exemptions to its two largest trading partners.', tickers:[] },
    { time:'Feb-20',  headline:'Stock Market News: Trump Signs Order Imposing New 10% Tariff', source:'WSJ', url:'#', summary:"A summary of today's market-moving events as the president signed the executive order.", tickers:['SPY','QQQ','DIA'] },
    { time:'Feb-20',  headline:"Don't expect lower prices after the Supreme Court tariff ruling", source:'MarketWatch', url:'#', summary:'Companies say they have no plans to reduce prices they already raised.', tickers:[] },
    { time:'Feb-20',  headline:"'It will not be automatic': Companies brace for messy tariff refund process", source:'WSJ', url:'#', summary:'Businesses face months-long waits for potential refunds after tariffs are invalidated.', tickers:[] },
  ],
  stocks: [
    { time:'06:15AM', headline:'NVIDIA Beats Estimates on AI Chip Demand, Raises Full-Year Guidance', source:'Bloomberg', url:'#', summary:'Data center revenue hit a new record on surging AI workload demand from hyperscalers.', tickers:['NVDA'] },
    { time:'05:58AM', headline:'Apple Supply Chain Checks Show iPhone 17 Orders Ahead of Prior Year Pace', source:'CNBC', url:'#', summary:'Channel checks from Asia suggest component orders are tracking ahead of last year.', tickers:['AAPL','QCOM','AVGO'] },
    { time:'05:44AM', headline:'Tesla Robotaxi Launch Delayed Again, Shares Slip Premarket', source:'Reuters', url:'#', summary:'Tesla pushed its autonomous ride-hailing launch to Q4, citing regulatory hurdles.', tickers:['TSLA'] },
    { time:'05:30AM', headline:'Microsoft Azure Growth Accelerates for Third Straight Quarter', source:'MarketWatch', url:'#', summary:'Azure cloud revenue grew 35% year-over-year, beating estimates driven by AI workloads.', tickers:['MSFT'] },
    { time:'05:12AM', headline:'Amazon One Medical Expansion Signals Deepening Healthcare Push', source:'WSJ', url:'#', summary:"Amazon plans to double its clinic footprint beyond pharmacy and telemedicine.", tickers:['AMZN','UNH'] },
    { time:'04:48AM', headline:'Meta AI Llama 4 Outperforms GPT-4o on Key Benchmarks', source:'Bloomberg', url:'#', summary:"Meta's latest open-source model posted top scores across coding and reasoning tasks.", tickers:['META'] },
    { time:'04:30AM', headline:'JPMorgan Raises S&P 500 Year-End Target to 6,500', source:'CNBC', url:'#', summary:"JPMorgan's equity strategy team lifted its forecast, citing resilient consumer spending.", tickers:['JPM','SPY'] },
    { time:'04:00AM', headline:'Alphabet Antitrust Remedies Could Cost $30 Billion, Analysts Warn', source:'Reuters', url:'#', summary:'The DOJ is preparing to announce remedies in the Google search monopoly case.', tickers:['GOOGL'] },
    { time:'Feb-20',  headline:'AMD Milan 4 Benchmark Leaks Show 40% IPC Gain Over Genoa', source:'Seeking Alpha', url:'#', summary:"AMD's next-gen server CPU shows significant performance improvements in early samples.", tickers:['AMD','INTC','NVDA'] },
    { time:'Feb-20',  headline:"Berkshire Hathaway Discloses New Stakes in 13-F Filing", source:'MarketWatch', url:'#', summary:"Buffett's firm disclosed new positions and increases in existing holdings.", tickers:['BRK.B'] },
  ],
  etf: [
    { time:'05:45AM', headline:'SPY Sees Record $4.2B Single-Day Inflow as Institutions Re-Enter', source:'Bloomberg', url:'#', summary:'The SPDR S&P 500 ETF attracted its largest single-day inflow since January 2024.', tickers:['SPY'] },
    { time:'05:20AM', headline:'Gold ETFs Draw $2.1B in a Week as Uncertainty Bids Up Havens', source:'Reuters', url:'#', summary:'Investors poured money into gold-backed funds at the fastest pace since 2022.', tickers:['GLD','IAU','SGOL'] },
    { time:'04:55AM', headline:'QQQ Rebalance Adds SMCI, Drops Walgreens in Quarterly Review', source:'MarketWatch', url:'#', summary:'The Invesco QQQ Trust completed its quarterly index rebalance.', tickers:['QQQ','SMCI','WBA'] },
    { time:'04:30AM', headline:'Bond ETF Outflows Accelerate as Rate-Cut Bets Fade', source:'CNBC', url:'#', summary:'Investors pulled $3.8B from US Treasury ETFs in the past week.', tickers:['TLT','IEF','SHY'] },
    { time:'04:00AM', headline:'ARK Innovation Sees First Weekly Inflow in Six Months', source:'Benzinga', url:'#', summary:'ARKK attracted net inflows for the first time since August.', tickers:['ARKK'] },
    { time:'Feb-20',  headline:'iShares Russell 2000 Outperforms Large-Cap Peers on Rate Optimism', source:'Bloomberg', url:'#', summary:'Small-cap stocks outpaced large-caps for the third straight week.', tickers:['IWM','SPY'] },
    { time:'Feb-20',  headline:'Energy ETFs Surge as Oil Climbs Above $90 on Supply Cuts', source:'Reuters', url:'#', summary:'Energy sector ETFs led the market as crude rose on OPEC+ production cut news.', tickers:['XLE','XOP','OIH'] },
  ],
  crypto: [
    { time:'06:00AM', headline:'Bitcoin Surges Past $105K as Spot ETF Inflows Hit All-Time High', source:'CoinDesk', url:'#', summary:'Bitcoin breached $105,000 for the first time as ETF products saw record institutional demand.', tickers:['MSTR','COIN','IBIT'] },
    { time:'05:35AM', headline:"Ethereum Upgrade 'Pectra' Ships, Staking Yields Rise to 5.2%", source:'Decrypt', url:'#', summary:'The Pectra upgrade brought improved validator economics and blob capacity.', tickers:[] },
    { time:'05:10AM', headline:'SEC Approves First Ethereum Staking ETF', source:'Bloomberg', url:'#', summary:'The SEC approved a novel ETF structure allowing holders to earn Ethereum staking rewards.', tickers:['ETHA'] },
    { time:'04:45AM', headline:'Coinbase Q4 Revenue Tops $2B on Institutional Trading Surge', source:'Reuters', url:'#', summary:'Coinbase reported its strongest quarter since 2021 on institutional trading volumes.', tickers:['COIN'] },
    { time:'04:20AM', headline:'Solana Overtakes Ethereum in Daily Active Addresses', source:'Cointelegraph', url:'#', summary:'On-chain data shows Solana surpassed Ethereum driven by memecoin activity.', tickers:[] },
    { time:'04:00AM', headline:'MicroStrategy Buys Another 12,000 BTC for $1.26B', source:'Bloomberg', url:'#', summary:'MicroStrategy completed its latest Bitcoin purchase, bringing holdings above 450,000 BTC.', tickers:['MSTR'] },
    { time:'Feb-20',  headline:'Crypto Market Cap Surpasses $3.8 Trillion, New All-Time High', source:'Decrypt', url:'#', summary:'Total crypto market cap hit a new peak, driven by Bitcoin and Ethereum strength.', tickers:[] },
  ],
  forex: [
    { time:'05:50AM', headline:'Dollar Index Falls to 3-Month Low as Tariff Risk Fades', source:'Bloomberg', url:'#', summary:'The DXY fell below 101 as markets repriced tariff probability after the Supreme Court ruling.', tickers:[] },
    { time:'05:25AM', headline:'Euro Climbs Above 1.12 on ECB Hawkish Hold Decision', source:'Reuters', url:'#', summary:'The euro strengthened after the ECB left rates unchanged and signaled no hurry to cut.', tickers:[] },
    { time:'05:00AM', headline:'Yen Surges as BOJ Governor Hints at July Rate Hike', source:'Bloomberg', url:'#', summary:'The yen appreciated sharply after the BOJ governor suggested conditions are ripening for a hike.', tickers:[] },
    { time:'04:35AM', headline:'Pound Sterling Hits 18-Month High Ahead of UK CPI Data', source:'Financial Times', url:'#', summary:'GBP/USD traded near its strongest level since 2024 ahead of a crucial inflation print.', tickers:[] },
    { time:'04:10AM', headline:'Emerging Market Currencies Rally on Weaker Dollar', source:'Reuters', url:'#', summary:'The BRL, MXN, and INR all strengthened as the dollar pullback spurred EM inflows.', tickers:[] },
  ],
}

const BLOGS = [
  { time:'06:32AM', headline:"Intel Is Finally On Target — But There's More Required", source:'Seeking Alpha', url:'#', summary:"Intel's recovery plan shows early traction but execution risk remains elevated.", tickers:['INTC'] },
  { time:'05:55AM', headline:"The Fed's Impossible Triangle: Growth, Inflation, Employment", source:'Seeking Alpha', url:'#', summary:'The Federal Reserve faces a classic trilemma as strong jobs clash with above-target inflation.', tickers:[] },
  { time:'05:30AM', headline:'AI Content Incidents Skyrocket: A Growing Liability for Tech Giants', source:'Forbes', url:'#', summary:'The number of documented AI content failures has grown 10x year-over-year.', tickers:['GOOGL','META','MSFT'] },
  { time:'05:05AM', headline:"Why Natural Gas Could Be 2026's Biggest Energy Trade", source:'Investopedia', url:'#', summary:'LNG export growth, data center demand, and tight storage set up a compelling bull case.', tickers:['UNG','LNG','EQT'] },
  { time:'04:40AM', headline:"Riyadh's Fiber Ambitions: The AI Infrastructure Nobody Is Watching", source:'Forbes', url:'#', summary:"Saudi Arabia is laying the groundwork for a Middle Eastern AI hub.", tickers:['ANET','CSCO'] },
  { time:'04:15AM', headline:'Value vs Growth: The Historical Record When Rates Fall', source:'Motley Fool', url:'#', summary:'Growth stocks typically outperform value in the 12 months following the first Fed rate cut.', tickers:['IVW','IVE'] },
  { time:'03:50AM', headline:'The Case for a 25% Position in Short-Duration Treasuries', source:'Seeking Alpha', url:'#', summary:'With the yield curve re-steepening, short-duration bonds offer asymmetric risk-reward.', tickers:['SHY','BIL','SGOV'] },
  { time:'03:25AM', headline:"Retail Investors Have Never Been More Wrong — And That's Bullish", source:"Barron's", url:'#', summary:'Contrarian indicators show extreme retail pessimism, historically a reliable buy signal.', tickers:['SPY'] },
  { time:'03:00AM', headline:"Buffett's Moves Signal a New Era of Defensive Positioning", source:'Forbes', url:'#', summary:"Berkshire's elevated cash pile signals Buffett sees limited upside in current markets.", tickers:['BRK.B'] },
  { time:'02:35AM', headline:'The Quiet Collapse of Commercial Real Estate and Its Bank Victims', source:'Seeking Alpha', url:'#', summary:'Regional banks with high CRE exposure continue to see write-downs mount.', tickers:['KRE'] },
  { time:'Feb-20',  headline:'Semiconductor Cycle: Where Are We in the Upcycle?', source:'Seeking Alpha', url:'#', summary:'Leading indicators suggest mid-cycle expansion with memory and logic heading in different directions.', tickers:['NVDA','AMD','INTC','MU'] },
  { time:'Feb-20',  headline:'The 5 Best Dividend Stocks to Buy Before the Next Rate Cut', source:'Motley Fool', url:'#', summary:'High-quality dividend payers historically outperform when the Fed pivots.', tickers:['JNJ','PG','KO','V','COST'] },
  { time:'Feb-20',  headline:'How to Hedge a Concentrated Tech Portfolio Without Selling', source:'Forbes', url:'#', summary:'Options strategies and sector rotation for investors with large embedded gains.', tickers:['NVDA','AAPL','MSFT'] },
  { time:'Feb-20',  headline:'The Underappreciated Defense Budget Tailwind for Aerospace Primes', source:"Barron's", url:'#', summary:'NATO spending increases are driving multi-year backlogs for defense contractors.', tickers:['LMT','RTX','GD','NOC'] },
  { time:'Feb-20',  headline:'Biotech Bull Case: Three Under-the-Radar FDA Catalysts in Q2', source:'Seeking Alpha', url:'#', summary:'Three small-cap biotech names face pivotal FDA decisions that could be major catalysts.', tickers:['BIIB','REGN','MRNA'] },
]

/* ─── NORMALIZE API RESPONSE ────────────────────────────────────── */
function normalizeNews(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(n => ({
    headline: n.h || n.headline || '',
    source:   n.src || n.source || n.related || '',
    time:     n.time || '',
    url:      n.url || '#',
    summary:  n.summary || n.h || n.headline || '',
    tickers:  Array.isArray(n.tickers) ? n.tickers
              : (n.t && n.t.trim()) ? n.t.trim().split(/[, ]+/).filter(Boolean)
              : [],
  })).filter(n => n.headline)
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
export default function PageNews({ onT }) {
  const [tab, setTab]           = useState(SUB_TABS[0])
  const [viewBy, setViewBy]     = useState('Time')
  const [left, setLeft]         = useState([])
  const [right]                 = useState(BLOGS)     // blogs are static/sample
  const [loading, setLoading]   = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [updated, setUpdated]   = useState(null)
  const cache                   = useRef({})

  const load = useCallback(async (cat, force = false) => {
    if (!force && cache.current[cat] && Date.now() - cache.current[cat].ts < 15 * 60_000) {
      setLeft(cache.current[cat].data)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // Route: general → /api/market-news (returns array of {h,src,time,url,t})
      //        others  → /api/market-data?section=news (same shape, cached)
      const url = cat === 'general'
        ? '/api/market-news'
        : `/api/market-data?section=news`
      const res  = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw  = await res.json()
      const data = normalizeNews(Array.isArray(raw) ? raw : raw.news || [])
      if (data.length) {
        cache.current[cat] = { data, ts: Date.now() }
        setLeft(data)
      } else {
        setLeft(SAMPLES[cat] || SAMPLES.general)
      }
    } catch {
      setLeft(SAMPLES[cat] || SAMPLES.general)
    }
    setLoading(false)
    setUpdated(new Date())
  }, [])

  useEffect(() => { load(tab.cat) }, [tab, load])

  const refresh = async () => {
    setSpinning(true)
    await load(tab.cat, true)
    setSpinning(false)
  }

  const updStr = updated
    ? updated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div style={{ fontFamily: FONT, color: 'var(--cp-txt)', fontSize: 13 }}>

      {/* ── SUB-NAV + CONTROLS ── */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: '1px solid var(--cp-bg3)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, flexWrap: 'wrap' }}>
          {SUB_TABS.map(t => (
            <button
              key={t.label}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 700,
                fontFamily: FONT, background: 'transparent', border: 'none',
                borderBottom: tab.label === t.label
                  ? '2px solid var(--cp-link)' : '2px solid transparent',
                color: tab.label === t.label ? 'var(--cp-link)' : 'var(--cp-txt2)',
                cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 8px', flexShrink: 0,
        }}>
          {updStr && (
            <span style={{ fontSize: 10, color: 'var(--cp-txt3)', whiteSpace: 'nowrap' }}>
              {updStr}
            </span>
          )}

          {/* Refresh */}
          <button
            onClick={refresh}
            title="Refresh"
            style={{
              background: 'none', border: '1px solid var(--cp-bg3)',
              borderRadius: 3, padding: '3px 8px', cursor: 'pointer',
              color: 'var(--cp-txt2)', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontFamily: FONT,
            }}
          >
            <svg
              width="11" height="11" viewBox="0 0 16 16" fill="currentColor"
              style={{ animation: spinning ? 'cp-spin 0.9s linear infinite' : 'none' }}
            >
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
              <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
            </svg>
            Refresh
          </button>

          <span style={{ fontSize: 11, color: 'var(--cp-txt2)', whiteSpace: 'nowrap' }}>View by:</span>
          {VIEW_BY.map(v => (
            <button
              key={v}
              onClick={() => setViewBy(v)}
              style={{
                fontSize: 11, fontFamily: FONT, cursor: 'pointer',
                padding: '3px 9px', borderRadius: 2, fontWeight: 600,
                background: viewBy === v ? 'var(--cp-bg3)' : 'transparent',
                color: viewBy === v ? 'var(--cp-txt)' : 'var(--cp-txt2)',
                border: '1px solid var(--cp-bg3)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── TWO-COLUMN: News | Blogs ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr',
        alignItems: 'start',
      }}>
        {/* LEFT — News */}
        <div>
          <div style={{
            padding: '7px 8px 6px',
            borderBottom: '1px solid var(--cp-bg3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cp-txt)', fontFamily: FONT }}>News</span>
            {!loading && <span style={{ fontSize: 11, color: 'var(--cp-txt3)' }}>{left.length} articles</span>}
          </div>
          {loading
            ? <Skeleton />
            : left.length === 0
              ? <div style={{ padding:'28px 12px', textAlign:'center', color:'var(--cp-txt2)', fontSize:12 }}>No articles available.</div>
              : viewBy === 'Time'
                ? (
                  <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse:'collapse', tableLayout:'fixed' }}>
                    <tbody>
                      {left.map((item, i) => <Row key={i} item={item} idx={i} viewBy="Time" onT={onT}/>)}
                    </tbody>
                  </table>
                )
                : <SourceGrouped items={left} onT={onT}/>
          }
        </div>

        {/* DIVIDER */}
        <div style={{ background:'var(--cp-bg3)', alignSelf:'stretch' }}/>

        {/* RIGHT — Blogs */}
        <div>
          <div style={{
            padding: '7px 8px 6px',
            borderBottom: '1px solid var(--cp-bg3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize:13, fontWeight:800, color:'var(--cp-txt)', fontFamily:FONT }}>Blogs</span>
            <span style={{ fontSize:11, color:'var(--cp-txt3)' }}>{right.length} articles</span>
          </div>
          {viewBy === 'Time'
            ? (
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse:'collapse', tableLayout:'fixed' }}>
                <tbody>
                  {right.map((item, i) => <Row key={i} item={item} idx={i} viewBy="Time" onT={onT}/>)}
                </tbody>
              </table>
            )
            : <SourceGrouped items={right} onT={onT}/>
          }
        </div>
      </div>

      {/* ── ANIMATIONS ── */}
      <style>{`
        @keyframes cp-spin { to { transform: rotate(360deg); } }
        @keyframes cp-pulse { 0%,100% { opacity:.4; } 50% { opacity:.85; } }
      `}</style>
    </div>
  )
}

/* ─── SOURCE-GROUPED VIEW ───────────────────────────────────────── */
function SourceGrouped({ items, onT }) {
  const groups = []
  const map = new Map()
  for (const item of items) {
    const s = item.source || 'Unknown'
    if (!map.has(s)) { map.set(s, []); groups.push(s) }
    map.get(s).push(item)
  }
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse:'collapse', tableLayout:'fixed' }}>
      <tbody>
        {groups.map(src => (
          <>
            <SrcHdr key={`h-${src}`} source={src} count={map.get(src).length}/>
            {map.get(src).map((item, i) => (
              <Row key={`${src}-${i}`} item={item} idx={i} viewBy="Source" onT={onT}/>
            ))}
          </>
        ))}
      </tbody>
    </table>
  )
}