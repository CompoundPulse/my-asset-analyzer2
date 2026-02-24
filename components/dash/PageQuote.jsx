import { useState, useEffect, useRef } from 'react'

const FINN = 'd0imh21r01qrfsah3gn0d0imh21r01qrfsah3gng'
const FMP  = '1scRqYKLRKaoY4uhX3vS8lpenQ5Tfow5'
const AV   = 'RUSYOJSP4I2T7BBT'

// ── Dark theme matching TradingView/CompoundPulse ─────────────────────────
const D = {
  // EXACT Finviz dark theme (finviz.9e4926f4.css)
  bg0:  'var(--cp-bg0)',  // --color-gray-900 — page bg
  bg1:  'var(--cp-bg1)',  // --color-gray-800 — panels
  bg2:  'var(--cp-bg2)',  // --color-gray-750 — alt rows
  bg3:  'var(--cp-bg3)',  // --color-gray-700 — elevated/hover
  brd:  'var(--cp-bg3)',  // --color-gray-600 — borders
  brdL: 'var(--cp-bg3)',
  txt:  'var(--cp-txt)',  // --color-gray-50  — primary text
  txt2: 'var(--cp-txt2)',  // --color-gray-200 — secondary text
  txt3: 'var(--cp-txt2)',  // --color-gray-400 — dim text
  link: 'var(--cp-link)',  // --color-blue-400 — Finviz link blue
  pos:  '#19803d',  // --color-green-500
  neg:  '#d91e2b',  // --color-red-500
  fnt:  "'Lato', Verdana, Arial, Tahoma",
}
const bd  = `1px solid ${D.brd}`
const fmtN  = (v,d=2,pre='',suf='') => v!=null&&!isNaN(v)?`${pre}${parseFloat(v).toFixed(d)}${suf}`:'—'
const fmtB  = v => { if(v==null)return '—'; const n=parseFloat(v); if(n>=1e12)return`${(n/1e12).toFixed(2)}T`; if(n>=1e9)return`${(n/1e9).toFixed(2)}B`; if(n>=1e6)return`${(n/1e6).toFixed(2)}M`; return n.toLocaleString() }
const fmtPct= (v,d=2)=>v!=null&&!isNaN(v)?`${parseFloat(v)>=0?'+':''}${parseFloat(v).toFixed(d)}%`:'—'

// ── TradingView Chart ──────────────────────────────────────────────────────
function TVChart({ ticker }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const s = document.createElement('script')
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    s.async = true
    s.innerHTML = JSON.stringify({
      autosize: true, symbol: ticker, interval: 'D',
      timezone: 'America/New_York', theme: 'dark', style: '1',
      locale: 'en', allow_symbol_change: false, calendar: false,
      studies: ['STD;SMA', 'STD;SMA', 'STD;Volume'],
      hide_top_toolbar: false, save_image: false,
      backgroundColor: 'rgba(19,23,34,1)',
    })
    ref.current.appendChild(s)
  }, [ticker])
  return (
    <div style={{ height: 450, background: D.bg0 }}>
      <div className="tradingview-widget-container" ref={ref} style={{ height: '100%', width: '100%' }}>
        <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  )
}

// ── Stat cell ─────────────────────────────────────────────────────────────
function SC({ label, value }) {
  return (
    <>
      <td style={{ padding:'4px 6px', fontSize:11, color:D.txt2, fontFamily:D.fnt, borderBottom:bd, borderRight:bd, whiteSpace:'nowrap', width:'7%' }}>{label}</td>
      <td style={{ padding:'4px 8px', fontSize:11, fontWeight:700, fontFamily:D.fnt, borderBottom:bd, borderRight:bd, width:'10%', color:D.txt }}>{value||'—'}</td>
    </>
  )
}

// ── Financials Panel ───────────────────────────────────────────────────────
function FinancialsPanel({ ticker }) {
  const [tab,  setTab]  = useState('income')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true); setData(null)
    Promise.all([
      fetch(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${AV}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${AV}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${AV}`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([inc,bal,cf]) => { setData({ inc, bal, cf }); setLoading(false) })
  }, [ticker])

  const tH = { background:D.bg2, fontSize:11, fontWeight:700, color:D.txt2, padding:'5px 8px', borderBottom:bd, borderRight:bd, textAlign:'left', whiteSpace:'nowrap' }
  const tC = { fontSize:11, padding:'4px 8px', borderBottom:bd, borderRight:bd, color:D.txt2 }
  const tR = { fontSize:11, padding:'4px 8px', borderBottom:bd, borderRight:bd, textAlign:'right', fontWeight:600, color:D.txt }

  const ROWS = {
    income: [
      ['Total Revenue',        r=>fmtB(r.totalRevenue)],
      ['Cost of Revenue',      r=>fmtB(r.costOfRevenue)],
      ['Gross Profit',         r=>fmtB(r.grossProfit)],
      ['R&D',                  r=>fmtB(r.researchAndDevelopment)],
      ['SG&A',                 r=>fmtB(r.sellingGeneralAndAdministrative)],
      ['Operating Income',     r=>fmtB(r.operatingIncome)],
      ['EBITDA',               r=>fmtB(r.ebitda)],
      ['Interest Expense',     r=>fmtB(r.interestExpense)],
      ['Income Tax',           r=>fmtB(r.incomeTaxExpense)],
      ['Net Income',           r=>fmtB(r.netIncome)],
      ['EPS (Basic)',          r=>fmtN(r.reportedEPS||r.eps)],
      ['EPS (Diluted)',        r=>fmtN(r.dilutedEPS)],
    ],
    balance: [
      ['Total Assets',         r=>fmtB(r.totalAssets)],
      ['Current Assets',       r=>fmtB(r.totalCurrentAssets)],
      ['Cash & Equivalents',   r=>fmtB(r.cashAndCashEquivalentsAtCarryingValue)],
      ['Short Term Invest.',   r=>fmtB(r.shortTermInvestments)],
      ['Inventory',            r=>fmtB(r.inventory)],
      ['Total Liabilities',    r=>fmtB(r.totalLiabilities)],
      ['Current Liabilities',  r=>fmtB(r.totalCurrentLiabilities)],
      ['Long Term Debt',       r=>fmtB(r.longTermDebt)],
      ['Total Equity',         r=>fmtB(r.totalShareholderEquity)],
      ['Retained Earnings',    r=>fmtB(r.retainedEarnings)],
      ['Shares Outstanding',   r=>fmtB(r.commonStockSharesOutstanding)],
    ],
    cashflow: [
      ['Operating CF',         r=>fmtB(r.operatingCashflow)],
      ['CapEx',                r=>fmtB(r.capitalExpenditures)],
      ['Free Cash Flow',       r=>{ const o=parseFloat(r.operatingCashflow),c=parseFloat(r.capitalExpenditures); return isNaN(o)||isNaN(c)?'—':fmtB(o-c) }],
      ['Investing CF',         r=>fmtB(r.cashflowFromInvestment)],
      ['Financing CF',         r=>fmtB(r.cashflowFromFinancing)],
      ['Dividends Paid',       r=>fmtB(r.dividendPayout)],
      ['Buybacks',             r=>fmtB(r.paymentsForRepurchaseOfCommonStock)],
      ['Net Change in Cash',   r=>fmtB(r.changeInCash)],
    ],
  }

  const src = { income: data?.inc?.annualReports, balance: data?.bal?.annualReports, cashflow: data?.cf?.annualReports }
  const reports = src[tab]?.slice(0,4) || []

  return (
    <div>
      <div style={{ marginBottom:8, display:'flex', gap:4 }}>
        {[['income','Income Statement'],['balance','Balance Sheet'],['cashflow','Cash Flow']].map(([k,lbl])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:'4px 14px', fontSize:11, cursor:'pointer', fontFamily:D.fnt, background:tab===k?D.link:D.bg3, color:'var(--cp-txt)', border:'none', borderRadius:3, fontWeight:tab===k?700:400 }}>{lbl}</button>
        ))}
      </div>
      {loading ? <div style={{ color:D.txt2, fontSize:11, padding:12 }}>Loading…</div>
      : reports.length===0 ? <div style={{ color:D.txt2, fontSize:11, padding:12 }}>Financial data temporarily unavailable.</div>
      : (
        <div style={{ overflowX:'auto', border:bd, borderRadius:3 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:D.fnt }}>
            <thead>
              <tr>
                <th style={{ ...tH, width:'36%' }}>Metric</th>
                {reports.map((r,i)=><th key={i} style={{ ...tH, textAlign:'right' }}>{r.fiscalDateEnding?.slice(0,4)||'—'}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS[tab].map(([label,fn],i)=>(
                <tr key={i} style={{ background:i%2?D.bg1:D.bg0 }}>
                  <td style={tC}>{label}</td>
                  {reports.map((r,j)=><td key={j} style={tR}>{fn(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Filings Panel ──────────────────────────────────────────────────────────
function FilingsPanel({ ticker }) {
  const [filings, setFilings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`https://finnhub.io/api/v1/stock/filings?symbol=${ticker}&token=${FINN}`)
      .then(r=>r.ok?r.json():null).catch(()=>null)
      .then(d => { setFilings(Array.isArray(d)?d.slice(0,30):[]); setLoading(false) })
  }, [ticker])

  const tH = { background:D.bg2, fontSize:11, fontWeight:700, color:D.txt2, padding:'5px 8px', borderBottom:bd, borderRight:bd, textAlign:'left' }
  const tC = { fontSize:11, padding:'4px 8px', borderBottom:bd, borderRight:bd, color:D.txt }

  return loading ? <div style={{ color:D.txt2, fontSize:11, padding:12 }}>Loading…</div>
    : filings.length===0 ? <div style={{ color:D.txt2, fontSize:11, padding:12 }}>No filings found.</div>
    : (
      <div style={{ overflowX:'auto', border:bd, borderRadius:3 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:D.fnt }}>
          <thead><tr>
            <th style={{ ...tH, width:100 }}>Type</th>
            <th style={{ ...tH, width:120 }}>Filed</th>
            <th style={tH}>Description</th>
          </tr></thead>
          <tbody>
            {filings.map((f,i)=>(
              <tr key={i} style={{ background:i%2?D.bg1:D.bg0 }}>
                <td style={{ ...tC, fontWeight:700 }}>
                  <a href={f.reportUrl||f.filingUrl||'#'} target="_blank" rel="noopener noreferrer" style={{ color:D.link, textDecoration:'none' }}>{f.form||f.type||'—'}</a>
                </td>
                <td style={{ ...tC, color:D.txt2, whiteSpace:'nowrap' }}>{f.filedDate||f.acceptedDate?.split(' ')[0]||'—'}</td>
                <td style={tC}>{f.description||f.form||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
}

// ── Options Panel ──────────────────────────────────────────────────────────
function OptionsPanel({ ticker }) {
  const [allData, setAllData] = useState(null)
  const [exps,    setExps]    = useState([])
  const [exp,     setExp]     = useState('')
  const [optTab,  setOptTab]  = useState('calls')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${FINN}`)
      .then(r=>r.ok?r.json():null).catch(()=>null)
      .then(d => {
        // Finnhub: {data: [{expirationDate, options: {CALL:[...], PUT:[...]}}]}
        if (d?.data?.length) {
          setAllData(d.data)
          const dates = d.data.map(o=>o.expirationDate).sort()
          setExps(dates)
          setExp(dates[0]||'')
        }
        setLoading(false)
      })
  }, [ticker])

  const tH = { background:D.bg2, fontSize:11, fontWeight:700, color:D.txt2, padding:'5px 8px', borderBottom:bd, borderRight:bd, textAlign:'right', whiteSpace:'nowrap' }
  const tHL = { ...tH, textAlign:'left' }
  const tC = { fontSize:11, padding:'4px 8px', borderBottom:bd, borderRight:bd, textAlign:'right', color:D.txt }

  // Finnhub options: allData is [{expirationDate, options:{CALL:[...],PUT:[...]}}]
  const expObj  = allData?.find(o=>o.expirationDate===exp)
  const options = (expObj?.options?.[optTab==='calls'?'CALL':'PUT'] || []).slice(0,20)

  return loading ? <div style={{ color:D.txt2, fontSize:11, padding:12 }}>Loading…</div>
    : !allData ? <div style={{ color:D.txt2, fontSize:11, padding:12 }}>No options data available for {ticker}.</div>
    : (
      <div>
        <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={()=>setOptTab('calls')} style={{ padding:'3px 14px', fontSize:11, cursor:'pointer', background:optTab==='calls'?D.pos:D.bg3, color:'var(--cp-txt)', border:'none', borderRadius:3, fontWeight:optTab==='calls'?700:400 }}>Calls</button>
          <button onClick={()=>setOptTab('puts')}  style={{ padding:'3px 14px', fontSize:11, cursor:'pointer', background:optTab==='puts'?D.neg:D.bg3, color:'var(--cp-txt)', border:'none', borderRadius:3, fontWeight:optTab==='puts'?700:400 }}>Puts</button>
          <select value={exp} onChange={e=>setExp(e.target.value)} style={{ fontSize:11, padding:'3px 8px', background:D.bg3, color:D.txt, border:bd, borderRadius:3, fontFamily:D.fnt }}>
            {exps.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          <span style={{ fontSize:11, color:D.txt2 }}>{options.length} contracts</span>
        </div>
        {options.length===0
          ? <div style={{ color:D.txt2, fontSize:11, padding:8 }}>No contracts for this expiry.</div>
          : (
            <div style={{ overflowX:'auto', border:bd, borderRadius:3 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:D.fnt }}>
                <thead><tr>
                  {['Strike','Last','Bid','Ask','Volume','Open Int.','IV','Delta','Gamma','Theta'].map((h,i)=>(
                    <th key={h} style={i===0?tHL:tH}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {options.map((o,i)=>{
                    // Finnhub fields: strike, last(lastPrice), bid, ask, volume, openInterest, impliedVolatility, delta, gamma, theta
                    const last = o.lastPrice ?? o.last
                    const iv   = o.impliedVolatility ?? o.iv
                    const oi   = o.openInterest ?? o.oi
                    return (
                    <tr key={i} style={{ background:i%2?D.bg1:D.bg0 }}>
                      <td style={{ ...tC, textAlign:'left', fontWeight:700, color:D.link }}>{fmtN(o.strike)}</td>
                      <td style={tC}>{fmtN(last)}</td>
                      <td style={tC}>{fmtN(o.bid)}</td>
                      <td style={tC}>{fmtN(o.ask)}</td>
                      <td style={tC}>{o.volume?.toLocaleString()||'—'}</td>
                      <td style={tC}>{oi?.toLocaleString()||'—'}</td>
                      <td style={tC}>{iv?fmtN(iv*100,1,'','%'):'—'}</td>
                      <td style={{ ...tC, color:parseFloat(o.delta)>=0?D.pos:D.neg }}>{fmtN(o.delta,3)}</td>
                      <td style={tC}>{fmtN(o.gamma,4)}</td>
                      <td style={tC}>{fmtN(o.theta,4)}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    )
}

// ── Short Interest Panel ───────────────────────────────────────────────────
function ShortInterestPanel({ ticker, m }) {
  // Finnhub metric field names for short interest
  const shortShares = m.shortInterestShares || m['shortInterest']
  const shortRatio  = m.shortInterestRatio  || m['shortRatio']
  const shortPct    = m.shortPercent        || m['shortPercentOfFloat']
  const float       = m.sharesFloat

  const tC = { fontSize:11, padding:'6px 10px', borderBottom:bd, fontFamily:D.fnt }
  const rows = [
    ['Short Interest (Shares)', shortShares ? fmtB(shortShares) : '—'],
    ['Short % of Float',        shortPct    ? fmtN(shortPct,2,'','%') : '—'],
    ['Days to Cover (Ratio)',   shortRatio  ? fmtN(shortRatio,2) : '—'],
    ['Shares Float',            float       ? fmtB(float*1e6) : '—'],
    ['52-Week High Short',      m['shortInterest52WeekHigh'] ? fmtB(m['shortInterest52WeekHigh']) : '—'],
  ]

  return (
    <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
      <table style={{ borderCollapse:'collapse', fontSize:11, fontFamily:D.fnt, minWidth:280 }}>
        <tbody>
          {rows.map(([label,val],i)=>(
            <tr key={i} style={{ background:i%2?D.bg1:D.bg0 }}>
              <td style={{ ...tC, color:D.txt2, width:240 }}>{label}</td>
              <td style={{ ...tC, fontWeight:700, color:D.txt }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize:11, color:D.txt2, paddingTop:8, lineHeight:1.8 }}>
        Short interest data sourced from Finnhub market data.<br/>
        Figures updated bi-monthly per FINRA reporting schedule.
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function PageQuote({ ticker, onBack }) {
  const [q,       setQ]       = useState(null)
  const [m,       setM]       = useState({})
  const [prof,    setProf]    = useState(null)
  const [news,    setNews]    = useState([])
  const [ins,     setIns]     = useState([])
  const [rat,     setRat]     = useState([])
  const [instOwn, setInstOwn] = useState([])   // real institutional ownership
  const [loading, setLoading] = useState(true)
  const [panel,   setPanel]   = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!ticker) return
    setLoading(true); setQ(null); setM({}); setProf(null); setNews([]); setIns([]); setRat([]); setInstOwn([]); setPanel(null)

    Promise.all([
      fetch(`/api/stocks?symbol=${ticker}&type=quote`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINN}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP}`).then(r=>r.ok?r.json():null).catch(()=>null),
      (() => { const to=new Date().toISOString().split('T')[0]; const from=new Date(Date.now()-30*864e5).toISOString().split('T')[0]; return fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINN}`).then(r=>r.ok?r.json():[]).catch(()=>[]) })(),
      fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${FINN}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`https://financialmodelingprep.com/api/v3/analyst-stock-recommendations/${ticker}?limit=10&apikey=${FMP}`).then(r=>r.ok?r.json():[]).catch(()=>[]),
      fetch(`https://finnhub.io/api/v1/stock/fund-ownership?symbol=${ticker}&stateCode=all&token=${FINN}`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([quote,metricRes,fmpArr,newsArr,insRes,ratArr,instRes]) => {
      setQ(quote)
      if (metricRes?.metric) setM(metricRes.metric)
      if (Array.isArray(fmpArr)&&fmpArr.length) setProf(fmpArr[0])
      setNews(Array.isArray(newsArr)?newsArr.slice(0,40):[])
      if (insRes?.data) setIns(insRes.data.filter(t=>t.transactionType).slice(0,10))
      setRat(Array.isArray(ratArr)?ratArr.slice(0,10):[])
      // Finnhub fund-ownership: {ownership:[{name,share,change,filingDate,sharePercent}]}
      if (instRes?.ownership?.length) setInstOwn(instRes.ownership.slice(0,10))
      setLoading(false)
    })
  }, [ticker])

  const openPanel = name => {
    setPanel(prev=>prev===name?null:name)
    setTimeout(()=>panelRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),80)
  }

  if (!ticker) return null

  const price     = q?.price||q?.c||prof?.price
  const change    = q?.change||q?.d
  const changePct = q?.changePercent||q?.dp
  const isUp      = parseFloat(changePct)>=0

  const pe    = m.peBasicExclExtraTTM||prof?.pe
  const fpe   = m.peForwardAnnual
  const eps   = m.epsBasicExclExtraItemsTTM
  const mktCp = prof?.mktCap
  const ev    = m.enterpriseValueTTM
  const inc   = m.netIncomeTTM?m.netIncomeTTM*1e6:null
  const sal   = m.revenueTTM?m.revenueTTM*1e6:(prof?.revenue)
  const beta  = m.beta||prof?.beta
  const w52h  = m['52WeekHigh']
  const w52l  = m['52WeekLow']
  const vol   = q?.volume||q?.v
  const avgV  = m['10DayAverageTradingVolume']
  const divEst= m.dividendPerShareAnnual
  const divYld= m.dividendYieldIndicatedAnnual

  const STATS = [
    ['Index',prof?.exchange||'—'],['P/E',fmtN(pe)],['EPS (ttm)',fmtN(eps)],
    ['Insider Own',fmtN(m.insiderOwnershipPercentage,2,'','%')],['Shs Outstand',prof?.sharesOutstanding?fmtB(prof.sharesOutstanding):'—'],['Perf Week',fmtPct(m.weeklyPriceReturnDaily)],

    ['Market Cap',mktCp?fmtB(mktCp):'—'],['Forward P/E',fmtN(fpe)],['EPS next Y',fmtPct(m.epsGrowthNextYear)],
    ['Insider Trans',fmtN(m.insiderSharesPercentChange,2,'','%')],['Shs Float',m.sharesFloat?fmtB(m.sharesFloat*1e6):'—'],['Perf Month',fmtPct(m.monthToDatePriceReturnDaily)],

    ['Enterprise Value',ev?fmtB(ev*1e6):'—'],['PEG',fmtN(m.peNormalizedAnnual)],['EPS next Q','—'],
    ['Inst Own',fmtN(m.institutionalOwnershipPercentage,2,'','%')],['Short Float',fmtN(m.shortInterestRatio,2,'','%')],['Perf Quarter',fmtPct(m.quarterlyPriceReturnDaily)],

    ['Income',inc?fmtB(inc):'—'],['P/S',fmtN(m.priceToSalesTTM||prof?.priceToSalesRatioTTM)],['EPS this Y',fmtPct(m.epsGrowthTTMYoy)],
    ['Inst Trans',fmtN(m.institutionalSharesPercentChange,2,'','%')],['Short Ratio',fmtN(m.shortInterestRatio)],['Perf Half Y',fmtPct(m['26WeekPriceReturnDaily'])],

    ['Sales',sal?fmtB(sal):'—'],['P/B',fmtN(m.priceToBookQuarterly)],['EPS next Y',fmtPct(m.epsGrowthNextYear)],
    ['ROA',fmtN(m.roaRfy,2,'','%')],['Short Interest',m.shortInterestShares?fmtB(m.shortInterestShares):'—'],['Perf YTD',fmtPct(m.ytdPriceReturnDaily)],

    ['Book/sh',fmtN(m.bookValuePerShareQuarterly)],['P/C',fmtN(m.priceToCashFlowAnnual)],['EPS next 5Y',fmtPct(m.longTermGrowthRate)],
    ['ROE',fmtN(m.roeTTM,2,'','%')],['52W High',w52h?fmtN(w52h):'—'],['Perf Year',fmtPct(m['52WeekPriceReturnDaily'])],

    ['Cash/sh',fmtN(m.cashPerSharePerShareAnnual)],['P/FCF',fmtN(m.priceToFreeCashFlowTTM)],['EPS past 5Y',fmtPct(m.epsGrowth5Y)],
    ['ROIC',fmtN(m.roicRfy,2,'','%')],['52W Low',w52l?fmtN(w52l):'—'],['Perf 3Y',fmtPct(m['3YearPriceReturnDaily'])],

    ['Dividend Est.',divEst?`${fmtN(divEst)} (${fmtN(divYld?divYld*100:null,2)}%)`:'—'],['EV/EBITDA',fmtN(m.evToEbitdaTTM)],['Sales past 5Y',fmtPct(m.revenueGrowth5Y)],
    ['Gross Margin',fmtN(m.grossMarginTTM,2,'','%')],['Volatility',beta?`${fmtN(parseFloat(beta)*2,2)}% ${fmtN(beta,2)}%`:'—'],['Perf 5Y',fmtPct(m['5YearPriceReturnDaily'])],

    ['Dividend TTM',divEst?`${fmtN(divEst)} (${fmtN(divYld?divYld*100:null,2)}%)`:'—'],['EV/Sales',fmtN(m.evToSalesTTM)],['EPS Y/Y TTM',fmtPct(m.epsGrowthTTMYoy)],
    ['Oper. Margin',fmtN(m.operatingMarginTTM,2,'','%')],['ATR (14)',fmtN(m.atr14)],['Perf 10Y',fmtPct(m['10YearPriceReturnDaily'])],

    ['Dividend Ex-Date',m.dividendExDateAnnual||'—'],['Quick Ratio',fmtN(m.quickRatioQuarterly)],['Sales Y/Y TTM',fmtPct(m.revenueGrowthTTMYoy)],
    ['Profit Margin',fmtN(m.netProfitMarginTTM,2,'','%')],['RSI (14)',fmtN(m.rsi14)],['Recom',fmtN(m.recommendationMean)],

    ['Dividend Gr. 3Y',fmtPct(m.dividendGrowthRate3Y)],['Current Ratio',fmtN(m.currentRatioQuarterly)],['EPS Q/Q',fmtPct(m.epsGrowthQuarterlyYoy)],
    ['SMA20',fmtPct(m['20DayPriceReturnDaily'])],['Beta',fmtN(beta)],['Target Price',fmtN(m.targetPrice||prof?.dcf)],

    ['Payout',fmtN(m.payoutRatioAnnual,2,'','%')],['Debt/Eq',fmtN(m.totalDebtToEquityQuarterly)],['Sales Q/Q',fmtPct(m.revenueGrowthQuarterlyYoy)],
    ['SMA50',fmtPct(m['50DayPriceReturnDaily'])],['Avg Volume',avgV?`${avgV.toFixed(2)}M`:'—'],['Prev Close',fmtN(q?.prevClose||q?.pc)],

    ['Employees',prof?.fullTimeEmployees?parseInt(prof.fullTimeEmployees).toLocaleString():'—'],['LT Debt/Eq',fmtN(m.longTermDebt2EquityQuarterly)],['Earnings','—'],
    ['SMA200',fmtPct(m['200DayPriceReturnDaily'])],['Vol (3M)',avgV?`${avgV.toFixed(2)}M`:'—'],['Price',fmtN(price)],

    ['IPO',prof?.ipoDate||'—'],['Option/Short','Yes / Yes'],['EPS/Sales Surpr.','— —'],
    ['Trades','—'],['Volume',vol?parseInt(vol).toLocaleString():'—'],['Change',fmtPct(changePct)],
  ]

  const newsTime = ts => { const d=new Date(ts*1000),now=new Date(); return now-d<864e5?d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('en-US',{month:'short',day:'2-digit'}) }
  const tH = { background:D.bg2, fontSize:11, fontWeight:700, color:D.txt2, fontFamily:D.fnt, padding:'5px 8px', borderBottom:bd, borderRight:bd, whiteSpace:'nowrap', textAlign:'left' }
  const tC = { fontSize:11, fontFamily:D.fnt, padding:'4px 8px', borderBottom:bd, borderRight:bd, color:D.txt }

  const panelLabels = { financials:'Financials', options:'Options', filings:'Latest Filings', short:'Short Interest' }

  const actionBtns = [
    { label:'Stock Detail',    action:()=>document.getElementById('q-stats')?.scrollIntoView({behavior:'smooth'}) },
    { label:'Compare',         action:()=>window.open(`https://finance.yahoo.com/quote/${ticker}/comparison/`,'_blank') },
    { label:'Short Interest',  action:()=>openPanel('short') },
    { label:'Financials',      action:()=>openPanel('financials') },
    { label:'Options',         action:()=>openPanel('options') },
    { label:'Latest Filings',  action:()=>openPanel('filings') },
    { label:'Add to Portfolio',action:()=>document.querySelector('[data-nav="Portfolio"]')?.click()||null },
  ]

  return (
    <div style={{ background:D.bg0, minHeight:'100vh', fontFamily:D.fnt, color:D.txt }}>

      {/* Back */}
      <div style={{ padding:'6px 14px', borderBottom:bd }}>
        <span onClick={onBack} style={{ fontSize:12, color:D.link, cursor:'pointer' }}>← Back</span>
      </div>

      {/* Header */}
      <div style={{ padding:'10px 14px 8px', borderBottom:bd, background:D.bg1 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:26, fontWeight:900, color:'var(--cp-txt)' }}>{ticker}</span>
          <span style={{ fontSize:14, color:D.txt2 }}>{loading?'…':prof?.companyName||''}</span>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <span style={{ fontSize:28, fontWeight:700, color:'var(--cp-txt)' }}>{fmtN(price)}</span>
            {' '}
            <span style={{ fontSize:14, color:isUp?D.pos:D.neg, fontWeight:600 }}>
              {change?(parseFloat(change)>=0?'+':'')+parseFloat(change).toFixed(2):''}{' '}
              {changePct?(parseFloat(changePct)>=0?'+':'')+parseFloat(changePct).toFixed(2)+'%':''}
            </span>
          </div>
        </div>
        <div style={{ fontSize:11, color:D.txt2, marginTop:3, display:'flex', gap:8, flexWrap:'wrap' }}>
          {prof?.sector&&<a href="#" style={{ color:D.link, textDecoration:'none' }}>{prof.sector}</a>}
          {prof?.sector&&prof?.industry&&<span>•</span>}
          {prof?.industry&&<a href="#" style={{ color:D.link, textDecoration:'none' }}>{prof.industry}</a>}
          {prof?.country&&<><span>•</span><span>{prof.country}</span></>}
          {(prof?.exchangeShortName||prof?.exchange)&&<><span>•</span><span>{prof.exchangeShortName||prof.exchange}</span></>}
        </div>
        <div style={{ fontSize:11, marginTop:8, display:'flex', gap:12, flexWrap:'wrap' }}>
          {actionBtns.map(({label,action})=>(
            <a key={label} href="#" onClick={e=>{e.preventDefault();action()}}
              style={{ color:panel===Object.keys(panelLabels).find(k=>panelLabels[k]===label)?'var(--cp-bg1)':D.link, textDecoration:'none', cursor:'pointer' }}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Expandable Panel */}
      {panel && (
        <div ref={panelRef} style={{ padding:'14px 16px', borderBottom:bd, background:D.bg1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--cp-txt)' }}>{panelLabels[panel]}</div>
            <button onClick={()=>setPanel(null)} style={{ fontSize:12, color:D.txt2, background:'none', border:'none', cursor:'pointer', padding:'2px 8px' }}>✕ Close</button>
          </div>
          {panel==='financials' && <FinancialsPanel ticker={ticker}/>}
          {panel==='options'    && <OptionsPanel    ticker={ticker}/>}
          {panel==='filings'    && <FilingsPanel    ticker={ticker}/>}
          {panel==='short'      && <ShortInterestPanel ticker={ticker} m={m}/>}
        </div>
      )}

      {/* Chart */}
      <TVChart ticker={ticker}/>

      {/* Peers */}
      {prof&&(
        <div style={{ padding:'6px 14px', borderBottom:bd, fontSize:11, color:D.txt2, background:D.bg1 }}>
          <strong style={{ color:D.txt }}>Peers: </strong>
          {(prof.peersList||[]).slice(0,10).map(p=>(
            <a key={p} href="#" style={{ color:D.link, textDecoration:'none', marginRight:8 }}>{p}</a>
          ))}
        </div>
      )}

      {/* Stats table - 14 rows */}
      <div id="q-stats" style={{ overflowX:'auto', borderBottom:bd }}>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <tbody>
            {Array.from({length:14}).map((_,row)=>(
              <tr key={row} style={{ background:row%2===0?D.bg0:D.bg1 }}>
                {STATS.slice(row*6,row*6+6).map(([label,value],i)=>{
                  const isPerf = label.startsWith('Perf')||label==='Change'||(label.startsWith('EPS')&&!['EPS (ttm)','EPS next Q','EPS/Sales Surpr.'].includes(label))||label.startsWith('SMA')||(label.startsWith('Sales')&&label!=='Sales')
                  const num = parseFloat(value)
                  const vc  = isPerf&&!isNaN(num)?(num>=0?D.pos:D.neg):D.txt
                  return <SC key={i} label={label} value={<span style={{ color:vc }}>{value}</span>}/>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Analyst Ratings */}
      {rat.length>0&&(
        <div style={{ padding:'10px 14px', borderBottom:bd, background:D.bg0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--cp-txt)', marginBottom:6 }}>Analyst Ratings</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead><tr>
              {['Date','Action','Analyst','Rating','Price Target'].map(h=><th key={h} style={tH}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rat.map((r,i)=>{
                const isPos=r.ratingScore<=2; const isNeg=r.ratingScore>=4
                return (
                  <tr key={i} style={{ background:i%2?D.bg1:D.bg0 }}>
                    <td style={tC}>{r.date?new Date(r.date).toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'2-digit'}):''}</td>
                    <td style={tC}><span style={{ padding:'1px 6px', borderRadius:3, fontSize:10, fontWeight:700, background:isPos?'rgba(38,166,154,0.2)':isNeg?'rgba(239,83,80,0.2)':D.bg3, color:isPos?D.pos:isNeg?D.neg:D.txt2 }}>{r.analystRatingsStrongBuy!=null?'Reiterated':r.change||'—'}</span></td>
                    <td style={{ ...tC, color:isNeg?D.neg:'var(--cp-bg1)' }}>{r.analystName||r.company||'—'}</td>
                    <td style={{ ...tC, color:isNeg?D.neg:isPos?D.pos:D.txt }}>{r.rating||r.newGrade||'—'}</td>
                    <td style={tC}>{r.priceTarget?`$${r.priceTarget}`:'—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* News + Sidebar */}
      <div style={{ display:'flex', borderBottom:bd }}>
        <div style={{ flex:2, borderRight:bd }}>
          <div style={{ padding:'7px 14px', fontWeight:700, fontSize:12, borderBottom:bd, background:D.bg2, color:'var(--cp-txt)' }}>News</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              {news.length===0&&<tr><td style={{ padding:16, color:D.txt2, fontSize:11 }}>Loading news…</td></tr>}
              {news.map((n,i)=>(
                <tr key={i} style={{ background:i%2?D.bg1:D.bg0 }}>
                  <td style={{ padding:'4px 8px', fontSize:10, color:D.txt2, whiteSpace:'nowrap', width:80, borderBottom:bd, verticalAlign:'top' }}>{newsTime(n.datetime)}</td>
                  <td style={{ padding:'4px 8px 4px 4px', fontSize:11, borderBottom:bd }}>
                    <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ color:D.txt, textDecoration:'none' }}
                      onMouseEnter={e=>e.target.style.color=D.link} onMouseLeave={e=>e.target.style.color=D.txt}>
                      {n.headline}
                    </a>
                    {n.source&&<span style={{ color:D.txt3, fontSize:10 }}> ({n.source})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar */}
        <div style={{ flex:1, minWidth:240, background:D.bg1 }}>
          {prof?.description&&(
            <div style={{ padding:'12px 14px', borderBottom:bd, fontSize:11, color:D.txt2, lineHeight:1.65 }}>
              <div style={{ fontWeight:700, marginBottom:5, fontSize:12, color:'var(--cp-txt)' }}>About</div>
              <div style={{ maxHeight:160, overflowY:'auto' }}>{prof.description}</div>
            </div>
          )}
          <div style={{ padding:'7px 14px', fontWeight:700, fontSize:12, borderBottom:bd, background:D.bg2, color:'var(--cp-txt)' }}>Institutional Ownership</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <tbody>
              {instOwn.length>0 ? instOwn.map((r,i)=>(
                <tr key={i} style={{ background:i%2?D.bg1:D.bg0 }}>
                  <td style={{ ...tC, color:D.link }}>{r.name}</td>
                  <td style={{ ...tC, textAlign:'right', fontWeight:700, color:D.txt }}>{r.sharePercent?fmtN(r.sharePercent,2,'','%'):r.share?fmtB(r.share):'—'}</td>
                </tr>
              )) : (
                // Fallback: show placeholder while loading or if no data
                loading
                  ? <tr><td colSpan={2} style={{ ...tC, color:D.txt2 }}>Loading…</td></tr>
                  : <tr><td colSpan={2} style={{ ...tC, color:D.txt2 }}>No institutional data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insider Trading */}
      {ins.length>0&&(
        <div style={{ padding:'10px 14px', borderBottom:bd, background:D.bg0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--cp-txt)', marginBottom:6 }}>Insider Trading</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead><tr>
              {['Name','Relationship','Date','Transaction','Cost','# Shares','Value ($)','# Shares Total'].map(h=><th key={h} style={tH}>{h}</th>)}
            </tr></thead>
            <tbody>
              {ins.map((r,i)=>{
                const isBuy=(r.transactionType||'').toLowerCase().includes('buy')||(r.change||0)>0
                return (
                  <tr key={i} style={{ background:i%2?D.bg1:D.bg0 }}>
                    <td style={{ ...tC, color:D.link }}>{r.name}</td>
                    <td style={tC}>{r.position||'—'}</td>
                    <td style={tC}>{r.transactionDate?new Date(r.transactionDate).toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'2-digit'}):''}</td>
                    <td style={{ ...tC, color:isBuy?D.pos:D.neg, fontWeight:700 }}>{r.transactionType||(isBuy?'Buy':'Sale')}</td>
                    <td style={tC}>{r.transactionPrice?`$${parseFloat(r.transactionPrice).toFixed(2)}`:'—'}</td>
                    <td style={tC}>{r.change!=null?Math.abs(r.change).toLocaleString():'—'}</td>
                    <td style={tC}>{r.transactionPrice&&r.change?`$${(Math.abs(r.change)*r.transactionPrice).toLocaleString()}`:'—'}</td>
                    <td style={tC}>{r.share!=null?parseInt(r.share).toLocaleString():'—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ marginTop:8, fontSize:11 }}>
            {[['Yahoo Finance',`https://finance.yahoo.com/quote/${ticker}/insider-transactions/`],['Reuters',`https://www.reuters.com/companies/${ticker}`],['MarketWatch',`https://www.marketwatch.com/investing/stock/${ticker.toLowerCase()}`],['EDGAR',`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${ticker}&type=4`]].map(([name,url])=>(
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" style={{ color:D.link, marginRight:14 }}>open in {name}</a>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding:'10px 14px', fontSize:10, color:D.txt3, textAlign:'center', background:D.bg1 }}>
        Market data via Finnhub · FMP · Alpha Vantage · Quotes delayed 15 min · Not financial advice
      </div>
    </div>
  )
}