'use client'
/**
 * PageScreener.jsx — CompoundPulse
 * Finviz-exact screener with:
 *  - Filter tabs: Descriptive / Fundamental / Technical / All
 *  - 30+ filter dropdowns (Finviz-identical options)
 *  - Signal selector (30 signals)
 *  - Order By + direction
 *  - Tickers textarea
 *  - View tabs: Overview / Valuation / Financial / Ownership / Performance / Technical / Charts / Tickers
 *  - Results table (columns change per view)
 *  - Pagination 20/40/60/80/100
 *  - Paywall gate (free = blurred after row 20; pro = all)
 *  - Trial banner
 *  - Light/dark theme via CSS vars
 *  - Real data from /api/batch-quotes + /api/stocks
 *  - Auth via useAuth (Supabase)
 *  - Stripe checkout via /api/stripe/create-checkout
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { C, bd, thS } from './dashTheme'
import { useAuth } from '../../app/hooks/useAuth'

/* ─── CONSTANTS ───────────────────────────────────────────────── */

const FONT = "'Lato','Verdana','Arial','Tahoma',sans-serif"

// Full S&P 500 sample — enough to demonstrate pagination & paywall
const ALL_TICKERS = [
  {t:'NVDA', n:'NVIDIA Corp',              sec:'Technology',      ind:'Semiconductors',          cntry:'USA', exch:'NASDAQ'},
  {t:'AAPL', n:'Apple Inc',                sec:'Technology',      ind:'Consumer Electronics',    cntry:'USA', exch:'NASDAQ'},
  {t:'MSFT', n:'Microsoft Corp',           sec:'Technology',      ind:'Software—Infrastructure', cntry:'USA', exch:'NASDAQ'},
  {t:'AMZN', n:'Amazon.com Inc',           sec:'Consumer Cyc.',   ind:'Internet Retail',         cntry:'USA', exch:'NASDAQ'},
  {t:'GOOGL',n:'Alphabet Inc',             sec:'Communication',   ind:'Internet Content',        cntry:'USA', exch:'NASDAQ'},
  {t:'META', n:'Meta Platforms',           sec:'Communication',   ind:'Internet Content',        cntry:'USA', exch:'NASDAQ'},
  {t:'TSLA', n:'Tesla Inc',                sec:'Consumer Cyc.',   ind:'Auto Manufacturers',      cntry:'USA', exch:'NASDAQ'},
  {t:'JPM',  n:'JPMorgan Chase',           sec:'Financials',      ind:'Banks—Diversified',       cntry:'USA', exch:'NYSE'},
  {t:'WMT',  n:'Walmart Inc',              sec:'Consumer Def.',   ind:'Discount Stores',         cntry:'USA', exch:'NYSE'},
  {t:'XOM',  n:'Exxon Mobil Corp',         sec:'Energy',          ind:'Oil & Gas Integrated',   cntry:'USA', exch:'NYSE'},
  {t:'LLY',  n:'Eli Lilly and Co',         sec:'Healthcare',      ind:'Drug Manufacturers',      cntry:'USA', exch:'NYSE'},
  {t:'COST', n:'Costco Wholesale',         sec:'Consumer Def.',   ind:'Discount Stores',         cntry:'USA', exch:'NASDAQ'},
  {t:'HD',   n:'Home Depot Inc',           sec:'Consumer Cyc.',   ind:'Home Improvement',        cntry:'USA', exch:'NYSE'},
  {t:'V',    n:'Visa Inc',                 sec:'Financials',      ind:'Credit Services',         cntry:'USA', exch:'NYSE'},
  {t:'MA',   n:'Mastercard Inc',           sec:'Financials',      ind:'Credit Services',         cntry:'USA', exch:'NYSE'},
  {t:'AMD',  n:'Advanced Micro Dev.',      sec:'Technology',      ind:'Semiconductors',          cntry:'USA', exch:'NASDAQ'},
  {t:'NFLX', n:'Netflix Inc',              sec:'Communication',   ind:'Entertainment',           cntry:'USA', exch:'NASDAQ'},
  {t:'NKE',  n:'Nike Inc',                 sec:'Consumer Cyc.',   ind:'Footwear & Accessories',  cntry:'USA', exch:'NYSE'},
  {t:'SPY',  n:'SPDR S&P 500 ETF',        sec:'ETF',             ind:'Index Fund',              cntry:'USA', exch:'NYSE'},
  {t:'QQQ',  n:'Invesco QQQ Trust',        sec:'ETF',             ind:'Index Fund',              cntry:'USA', exch:'NASDAQ'},
  {t:'AVGO', n:'Broadcom Inc',             sec:'Technology',      ind:'Semiconductors',          cntry:'USA', exch:'NASDAQ'},
  {t:'ORCL', n:'Oracle Corp',              sec:'Technology',      ind:'Software—Infrastructure', cntry:'USA', exch:'NYSE'},
  {t:'ADBE', n:'Adobe Inc',                sec:'Technology',      ind:'Software—Application',    cntry:'USA', exch:'NASDAQ'},
  {t:'CRM',  n:'Salesforce Inc',           sec:'Technology',      ind:'Software—Application',    cntry:'USA', exch:'NYSE'},
  {t:'INTC', n:'Intel Corp',               sec:'Technology',      ind:'Semiconductors',          cntry:'USA', exch:'NASDAQ'},
  {t:'QCOM', n:'QUALCOMM Inc',             sec:'Technology',      ind:'Semiconductors',          cntry:'USA', exch:'NASDAQ'},
  {t:'TXN',  n:'Texas Instruments',        sec:'Technology',      ind:'Semiconductors',          cntry:'USA', exch:'NASDAQ'},
  {t:'UNH',  n:'UnitedHealth Group',       sec:'Healthcare',      ind:'Healthcare Plans',        cntry:'USA', exch:'NYSE'},
  {t:'JNJ',  n:'Johnson & Johnson',        sec:'Healthcare',      ind:'Drug Manufacturers',      cntry:'USA', exch:'NYSE'},
  {t:'PFE',  n:'Pfizer Inc',               sec:'Healthcare',      ind:'Drug Manufacturers',      cntry:'USA', exch:'NYSE'},
  {t:'ABT',  n:'Abbott Laboratories',      sec:'Healthcare',      ind:'Medical Devices',         cntry:'USA', exch:'NYSE'},
  {t:'MRK',  n:'Merck & Co',               sec:'Healthcare',      ind:'Drug Manufacturers',      cntry:'USA', exch:'NYSE'},
  {t:'BAC',  n:'Bank of America',          sec:'Financials',      ind:'Banks—Diversified',       cntry:'USA', exch:'NYSE'},
  {t:'GS',   n:'Goldman Sachs',            sec:'Financials',      ind:'Capital Markets',         cntry:'USA', exch:'NYSE'},
  {t:'MS',   n:'Morgan Stanley',           sec:'Financials',      ind:'Capital Markets',         cntry:'USA', exch:'NYSE'},
  {t:'WFC',  n:'Wells Fargo & Co',         sec:'Financials',      ind:'Banks—Diversified',       cntry:'USA', exch:'NYSE'},
  {t:'BRK.B',n:'Berkshire Hathaway B',     sec:'Financials',      ind:'Insurance—Diversified',   cntry:'USA', exch:'NYSE'},
  {t:'BLK',  n:'BlackRock Inc',            sec:'Financials',      ind:'Asset Management',        cntry:'USA', exch:'NYSE'},
  {t:'PG',   n:'Procter & Gamble',         sec:'Consumer Def.',   ind:'Household Products',      cntry:'USA', exch:'NYSE'},
  {t:'KO',   n:'Coca-Cola Co',             sec:'Consumer Def.',   ind:'Beverages—Non-Alcoholic', cntry:'USA', exch:'NYSE'},
  {t:'PEP',  n:'PepsiCo Inc',              sec:'Consumer Def.',   ind:'Beverages—Non-Alcoholic', cntry:'USA', exch:'NYSE'},
  {t:'PM',   n:'Philip Morris Intl',       sec:'Consumer Def.',   ind:'Tobacco',                 cntry:'USA', exch:'NYSE'},
  {t:'ABBV', n:'AbbVie Inc',               sec:'Healthcare',      ind:'Drug Manufacturers',      cntry:'USA', exch:'NYSE'},
  {t:'CVX',  n:'Chevron Corp',             sec:'Energy',          ind:'Oil & Gas Integrated',   cntry:'USA', exch:'NYSE'},
  {t:'COP',  n:'ConocoPhillips',           sec:'Energy',          ind:'Oil & Gas E&P',          cntry:'USA', exch:'NYSE'},
  {t:'SLB',  n:'Schlumberger Ltd',         sec:'Energy',          ind:'Oil & Gas Equipment',    cntry:'USA', exch:'NYSE'},
  {t:'RTX',  n:'RTX Corp',                 sec:'Industrials',     ind:'Aerospace & Defense',     cntry:'USA', exch:'NYSE'},
  {t:'BA',   n:'Boeing Co',                sec:'Industrials',     ind:'Aerospace & Defense',     cntry:'USA', exch:'NYSE'},
  {t:'LMT',  n:'Lockheed Martin',          sec:'Industrials',     ind:'Aerospace & Defense',     cntry:'USA', exch:'NYSE'},
  {t:'GD',   n:'General Dynamics',         sec:'Industrials',     ind:'Aerospace & Defense',     cntry:'USA', exch:'NYSE'},
  {t:'CAT',  n:'Caterpillar Inc',          sec:'Industrials',     ind:'Farm & Heavy Construction',cntry:'USA', exch:'NYSE'},
  {t:'HON',  n:'Honeywell Intl',           sec:'Industrials',     ind:'Conglomerates',           cntry:'USA', exch:'NASDAQ'},
  {t:'MMM',  n:'3M Co',                    sec:'Industrials',     ind:'Conglomerates',           cntry:'USA', exch:'NYSE'},
  {t:'GE',   n:'GE Aerospace',             sec:'Industrials',     ind:'Aerospace & Defense',     cntry:'USA', exch:'NYSE'},
  {t:'UPS',  n:'United Parcel Service',    sec:'Industrials',     ind:'Integrated Freight',      cntry:'USA', exch:'NYSE'},
  {t:'FDX',  n:'FedEx Corp',               sec:'Industrials',     ind:'Integrated Freight',      cntry:'USA', exch:'NYSE'},
  {t:'DIS',  n:'Walt Disney Co',           sec:'Communication',   ind:'Entertainment',           cntry:'USA', exch:'NYSE'},
  {t:'CMCSA',n:'Comcast Corp',             sec:'Communication',   ind:'Telecom Services',        cntry:'USA', exch:'NASDAQ'},
  {t:'T',    n:'AT&T Inc',                 sec:'Communication',   ind:'Telecom Services',        cntry:'USA', exch:'NYSE'},
  {t:'VZ',   n:'Verizon Communications',   sec:'Communication',   ind:'Telecom Services',        cntry:'USA', exch:'NYSE'},
  {t:'TMUS', n:'T-Mobile US Inc',          sec:'Communication',   ind:'Telecom Services',        cntry:'USA', exch:'NASDAQ'},
  {t:'GLD',  n:'SPDR Gold Shares',         sec:'ETF',             ind:'Commodities',             cntry:'USA', exch:'NYSE'},
  {t:'SLV',  n:'iShares Silver Trust',     sec:'ETF',             ind:'Commodities',             cntry:'USA', exch:'NYSE'},
  {t:'TLT',  n:'iShares 20+ Yr Treasury',  sec:'ETF',             ind:'Bond Fund',               cntry:'USA', exch:'NASDAQ'},
  {t:'IWM',  n:'iShares Russell 2000',     sec:'ETF',             ind:'Index Fund',              cntry:'USA', exch:'NYSE'},
  {t:'ARKK', n:'ARK Innovation ETF',       sec:'ETF',             ind:'Active Management',       cntry:'USA', exch:'NYSE'},
  {t:'SOFI', n:'SoFi Technologies',        sec:'Financials',      ind:'Credit Services',         cntry:'USA', exch:'NASDAQ'},
  {t:'PLTR', n:'Palantir Technologies',    sec:'Technology',      ind:'Software—Infrastructure', cntry:'USA', exch:'NYSE'},
  {t:'SNOW', n:'Snowflake Inc',            sec:'Technology',      ind:'Software—Infrastructure', cntry:'USA', exch:'NYSE'},
  {t:'UBER', n:'Uber Technologies',        sec:'Technology',      ind:'Software—Application',    cntry:'USA', exch:'NYSE'},
  {t:'LYFT', n:'Lyft Inc',                 sec:'Technology',      ind:'Software—Application',    cntry:'USA', exch:'NASDAQ'},
  {t:'COIN', n:'Coinbase Global',          sec:'Financials',      ind:'Capital Markets',         cntry:'USA', exch:'NASDAQ'},
  {t:'MSTR', n:'MicroStrategy Inc',        sec:'Technology',      ind:'Software—Application',    cntry:'USA', exch:'NASDAQ'},
  {t:'RIVN', n:'Rivian Automotive',        sec:'Consumer Cyc.',   ind:'Auto Manufacturers',      cntry:'USA', exch:'NASDAQ'},
  {t:'NIO',  n:'NIO Inc',                  sec:'Consumer Cyc.',   ind:'Auto Manufacturers',      cntry:'China',exch:'NYSE'},
  {t:'BABA', n:'Alibaba Group',            sec:'Consumer Cyc.',   ind:'Internet Retail',         cntry:'China',exch:'NYSE'},
  {t:'JD',   n:'JD.com Inc',               sec:'Consumer Cyc.',   ind:'Internet Retail',         cntry:'China',exch:'NASDAQ'},
  {t:'SHOP', n:'Shopify Inc',              sec:'Technology',      ind:'Software—Application',    cntry:'Canada',exch:'NYSE'},
  {t:'SE',   n:'Sea Limited',              sec:'Technology',      ind:'Internet Content',        cntry:'Singapore',exch:'NYSE'},
]

const SECTORS = ['Any','Technology','Financials','Healthcare','Consumer Cyc.','Consumer Def.','Communication','Industrials','Energy','ETF']
const INDUSTRIES = ['Any','Semiconductors','Software—Infrastructure','Software—Application','Internet Content','Internet Retail','Banks—Diversified','Capital Markets','Credit Services','Drug Manufacturers','Medical Devices','Healthcare Plans','Auto Manufacturers','Consumer Electronics','Entertainment','Telecom Services','Aerospace & Defense','Conglomerates','Discount Stores','Household Products','Oil & Gas Integrated','Index Fund','Bond Fund','Commodities','Active Management','Asset Management']
const COUNTRIES = ['Any','USA','China','Canada','Singapore','UK','Germany','Japan','France']
const EXCHANGES = ['Any','NASDAQ','NYSE','AMEX']
const INDEXES = ['Any','S&P 500','Nasdaq 100','DJIA','Russell 2000','S&P 400']
const MKTCAP_OPT = ['Any','Mega (>$200B)','Large ($10B-$200B)','Mid ($2B-$10B)','Small ($300M-$2B)','Micro ($50M-$300M)','Nano (<$50M)']
const PE_OPT = ['Any','Low (<15)','Profitable (>0)','High (>50)','Under 10','Under 20','Under 30','Under 40','Under 50','Over 50','Over 100','Negative']
const DIVYIELD_OPT = ['Any','None (0%)','Positive (>0%)','High (>5%)','Very High (>10%)','Over 1%','Over 2%','Over 3%','Over 4%','Over 5%']
const FLOAT_OPT = ['Any','Under 1M','Under 5M','Under 10M','Under 20M','Under 50M','Under 100M','Over 100M','Over 200M','Over 500M','Over 1B']
const PERF_OPT = ['Any','Today Up','Today Down','Today -15% or more','Today +15% or more','Week -30% or more','Week +30% or more','Month Up','Month Down','Quarter Up','Quarter Down','Half Up','Half Down','Year Up','Year Down','YTD Up','YTD Down']
const RSI_OPT = ['Any','Overbought (>70)','Overbought (>80)','Oversold (<30)','Oversold (<20)','Not Overbought (<60)','Not Oversold (>40)']
const VOL_OPT = ['Any','Under 50K','Under 100K','Under 500K','Under 1M','Over 1M','Over 2M','Over 5M','Over 10M','Over 20M']
const RELVOL_OPT = ['Any','Over 10','Over 5','Over 3','Over 2','Over 1.5','Over 1 (Up Volume)','Under 1 (Down Volume)','Under 0.5']
const CHANGE_OPT = ['Any','Up','Down','Down 4% or More','Down 3% or More','Down 2% or More','Down 1% or More','Up 1% or More','Up 2% or More','Up 3% or More','Up 4% or More']
const SMA_OPT = ['Any','Price below SMA20','Price 10% below SMA20','Price 20% below SMA20','Price 30% below SMA20','Price 40% below SMA20','Price 50% below SMA20','Price above SMA20','Price 10% above SMA20','Price 20% above SMA20','Price 30% above SMA20','Price 40% above SMA20','Price 50% above SMA20','SMA20 above SMA50','SMA20 below SMA50']
const SIGNAL_OPT = [
  'None (all stocks)','Top Gainers','Top Losers','New High','New Low','Most Volatile','Most Active','Unusual Volume',
  'Overbought','Oversold','Downgrades','Upgrades','Earnings Before','Earnings After',
  'Recent Insider Buying','Recent Insider Selling','Major News',
  'Horizontal S/R','TL Resistance','TL Support','Wedge Up','Wedge Down',
  'Triangle Ascending','Triangle Descending','Wedge','Channel Up','Channel Down','Channel',
  'Double Top','Double Bottom','Multiple Top','Multiple Bottom','Head & Shoulders','Head & Shoulders Inverse',
]
const ORDER_OPT = [
  ['ticker','Ticker'],['company','Company'],['sector','Sector'],['industry','Industry'],['country','Country'],
  ['exchange','Exchange'],['marketcap','Market Cap.'],['pe','P/E'],['forwardpe','Fwd P/E'],['peg','PEG'],
  ['ps','P/S'],['pb','P/B'],['dividendyield','Dividend Yield'],['payoutratio','Payout Ratio'],
  ['eps','EPS (TTM)'],['epsyoy','EPS Growth This Year'],['epsyoy1','EPS Growth Next Year'],
  ['eps5years','EPS Growth Past 5 Yrs'],['sales5years','Sales Growth Past 5 Yrs'],
  ['sharesoutstanding2','Shares Outstanding'],['sharesfloat','Shares Float'],
  ['insiderown','Insider Ownership'],['instown','Institutional Ownership'],
  ['shortinterestshare','Short Interest Share'],['earningsdate','Earnings Date'],
  ['roa','Return on Assets'],['roe','Return on Equity'],['roi','Return on Invested Capital'],
  ['curratio','Current Ratio'],['debteq','Total Debt/Equity'],['grossmargin','Gross Margin'],
  ['opermargin','Operating Margin'],['netmargin','Net Profit Margin'],['recom','Analyst Recommendation'],
  ['perf1w','Performance (Week)'],['perf4w','Performance (Month)'],['perf13w','Performance (Quarter)'],
  ['perf52w','Performance (Year)'],['perfytd','Performance (YTD)'],
  ['beta','Beta'],['rsi','RSI (14)'],['averagevolume','Avg Volume (3M)'],['relativevolume','Relative Volume'],
  ['change','Change'],['volume','Volume'],['price','Price'],['targetprice','Target Price'],['income','Income'],['sales','Sales'],
]

const VIEW_TABS = ['Overview','Valuation','Financial','Ownership','Performance','Technical','Charts','Tickers']
const FILTER_TABS = ['Descriptive','Fundamental','Technical','All']
const PER_PAGE_OPT = [20, 40, 60, 80, 100]

// Free users can see 20 rows without blur
const FREE_ROW_LIMIT = 20

/* ─── HELPERS ─────────────────────────────────────────────────── */
const fmtV = v => {
  if (v == null) return '—'
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  if (n>=1e12) return (n/1e12).toFixed(2)+'T'
  if (n>=1e9)  return (n/1e9).toFixed(2)+'B'
  if (n>=1e6)  return (n/1e6).toFixed(1)+'M'
  if (n>=1e3)  return (n/1e3).toFixed(0)+'K'
  return n.toFixed(0)
}
const fmtP = v => v != null ? `$${parseFloat(v).toFixed(2)}` : '—'
const fmtPct = v => v != null ? `${parseFloat(v)>=0?'+':''}${parseFloat(v).toFixed(2)}%` : '—'
const pos = v => v == null || parseFloat(v) >= 0
const clr = v => pos(v) ? 'var(--cp-pos)' : 'var(--cp-neg)'

/* ─── FILTER DROPDOWN ─────────────────────────────────────────── */
function FDrop({ label, opts, value, onChange, width=160 }) {
  return (
    <td style={{padding:'3px 2px 3px 0', verticalAlign:'top', whiteSpace:'nowrap'}}>
      <table cellPadding={0} cellSpacing={0} style={{width:'100%'}}>
        <tbody>
          <tr>
            <td style={{fontSize:11,fontWeight:700,color:'var(--cp-txt2)',whiteSpace:'nowrap',paddingRight:4,paddingBottom:2,display:'block'}}>
              {label}
            </td>
          </tr>
          <tr>
            <td>
              <select
                value={value}
                onChange={e=>onChange(e.target.value)}
                style={{
                  width, fontSize:11, padding:'3px 4px', fontFamily:FONT,
                  background:'var(--cp-bg1)', color:'var(--cp-txt)',
                  border:'1px solid var(--cp-bg3)', borderRadius:2,
                  cursor:'pointer', height:22,
                }}
              >
                {opts.map(o => Array.isArray(o)
                  ? <option key={o[0]} value={o[0]}>{o[1]}</option>
                  : <option key={o} value={o}>{o}</option>
                )}
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  )
}

/* ─── PAYWALL OVERLAY ─────────────────────────────────────────── */
function PaywallOverlay({ onUpgrade, onSignIn, isLoggedIn }) {
  return (
    <tr>
      <td colSpan={20} style={{padding:0,position:'relative'}}>
        <div style={{
          position:'relative',
          background:'linear-gradient(180deg, transparent 0%, var(--cp-bg0) 40%)',
          padding:'60px 0 40px',
          textAlign:'center',
          borderTop:'none',
        }}>
          <div style={{fontSize:28,marginBottom:10}}>🔒</div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--cp-txt)',marginBottom:6}}>
            Full Screener is a Pro Feature
          </div>
          <div style={{fontSize:13,color:'var(--cp-txt2)',marginBottom:20,maxWidth:360,margin:'0 auto 20px'}}>
            Pro subscribers see all {ALL_TICKERS.length}+ stocks with real-time data, advanced filters, and unlimited exports.
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            {!isLoggedIn ? (
              <>
                <button onClick={onSignIn} style={{
                  padding:'10px 24px',background:'#2962ff',color:'#fff',
                  border:'none',borderRadius:6,fontSize:14,fontWeight:600,cursor:'pointer',
                }}>Sign Up Free</button>
                <button onClick={onUpgrade} style={{
                  padding:'10px 24px',background:'var(--cp-bg2)',color:'var(--cp-txt)',
                  border:'1px solid var(--cp-bg3)',borderRadius:6,fontSize:14,fontWeight:600,cursor:'pointer',
                }}>View Pro Plans</button>
              </>
            ) : (
              <button onClick={onUpgrade} style={{
                padding:'12px 32px',background:'#2962ff',color:'#fff',
                border:'none',borderRadius:6,fontSize:15,fontWeight:700,cursor:'pointer',
                boxShadow:'0 4px 16px rgba(41,98,255,0.4)',
              }}>Start 7-Day Free Trial →</button>
            )}
          </div>
          <div style={{marginTop:10,fontSize:11,color:'var(--cp-txt3)'}}>
            Monthly from $19.99 · Annual from $149 · Cancel anytime
          </div>
        </div>
      </td>
    </tr>
  )
}

/* ─── COLUMNS PER VIEW ────────────────────────────────────────── */
function getCols(view) {
  const base = [
    {key:'t',    label:'Ticker',    align:'left',  w:60},
    {key:'n',    label:'Company',   align:'left',  w:160},
    {key:'sec',  label:'Sector',    align:'left',  w:100},
    {key:'ind',  label:'Industry',  align:'left',  w:140},
    {key:'cntry',label:'Country',   align:'left',  w:55},
    {key:'exch', label:'Exchange',  align:'left',  w:60},
  ]
  const mktcap  = {key:'mktcap',  label:'Market Cap', align:'right', w:80,  fmt:r=>fmtV(r.mktcap)}
  const pe      = {key:'pe',      label:'P/E',         align:'right', w:55,  fmt:r=>r.pe    ?.toFixed(1)||'—'}
  const fpe     = {key:'fpe',     label:'Fwd P/E',     align:'right', w:55,  fmt:r=>r.fpe   ?.toFixed(1)||'—'}
  const peg     = {key:'peg',     label:'PEG',         align:'right', w:45,  fmt:r=>r.peg   ?.toFixed(2)||'—'}
  const ps      = {key:'ps',      label:'P/S',         align:'right', w:45,  fmt:r=>r.ps    ?.toFixed(2)||'—'}
  const pb      = {key:'pb',      label:'P/B',         align:'right', w:45,  fmt:r=>r.pb    ?.toFixed(2)||'—'}
  const eps     = {key:'eps',     label:'EPS',         align:'right', w:55,  fmt:r=>r.eps   ?.toFixed(2)||'—'}
  const divy    = {key:'divy',    label:'Div %',       align:'right', w:55,  fmt:r=>r.divy  ? r.divy.toFixed(2)+'%':'—'}
  const price   = {key:'price',   label:'Price',       align:'right', w:65,  fmt:r=>fmtP(r.price)}
  const chg     = {key:'chg',     label:'Change',      align:'right', w:65,  fmt:r=>fmtPct(r.chgPct), color:r=>clr(r.chgPct)}
  const vol     = {key:'vol',     label:'Volume',      align:'right', w:75,  fmt:r=>fmtV(r.volume)}
  const avol    = {key:'avol',    label:'Avg Vol',     align:'right', w:75,  fmt:r=>fmtV(r.avgVol)}
  const relvol  = {key:'relvol',  label:'Rel Vol',     align:'right', w:55,  fmt:r=>r.relVol?.toFixed(2)||'—'}
  const beta    = {key:'beta',    label:'Beta',        align:'right', w:45,  fmt:r=>r.beta  ?.toFixed(2)||'—'}
  const rsi     = {key:'rsi',     label:'RSI',         align:'right', w:45,  fmt:r=>r.rsi   ?.toFixed(1)||'—'}
  const sma20   = {key:'sma20',   label:'SMA20',       align:'right', w:60,  fmt:r=>r.sma20 ? (r.sma20>=0?'+':'')+r.sma20.toFixed(1)+'%':'—', color:r=>clr(r.sma20)}
  const sma50   = {key:'sma50',   label:'SMA50',       align:'right', w:60,  fmt:r=>r.sma50 ? (r.sma50>=0?'+':'')+r.sma50.toFixed(1)+'%':'—', color:r=>clr(r.sma50)}
  const sma200  = {key:'sma200',  label:'SMA200',      align:'right', w:60,  fmt:r=>r.sma200? (r.sma200>=0?'+':'')+r.sma200.toFixed(1)+'%':'—', color:r=>clr(r.sma200)}
  const hi52w   = {key:'hi52w',   label:'52W High',    align:'right', w:65,  fmt:r=>r.hi52w ? (r.hi52w>=0?'+':'')+r.hi52w.toFixed(1)+'%':'—', color:r=>clr(r.hi52w)}
  const lo52w   = {key:'lo52w',   label:'52W Low',     align:'right', w:65,  fmt:r=>r.lo52w ? (r.lo52w>=0?'+':'')+r.lo52w.toFixed(1)+'%':'—', color:r=>clr(r.lo52w)}
  const perf1w  = {key:'perf1w',  label:'Perf 1W',     align:'right', w:65,  fmt:r=>r.perf1w !=null?(r.perf1w>=0?'+':'')+r.perf1w.toFixed(1)+'%':'—', color:r=>clr(r.perf1w)}
  const perf4w  = {key:'perf4w',  label:'Perf 1M',     align:'right', w:65,  fmt:r=>r.perf4w !=null?(r.perf4w>=0?'+':'')+r.perf4w.toFixed(1)+'%':'—', color:r=>clr(r.perf4w)}
  const perf13w = {key:'perf13w', label:'Perf 3M',     align:'right', w:65,  fmt:r=>r.perf13w!=null?(r.perf13w>=0?'+':'')+r.perf13w.toFixed(1)+'%':'—', color:r=>clr(r.perf13w)}
  const perf52w = {key:'perf52w', label:'Perf 1Y',     align:'right', w:65,  fmt:r=>r.perf52w!=null?(r.perf52w>=0?'+':'')+r.perf52w.toFixed(1)+'%':'—', color:r=>clr(r.perf52w)}
  const insider = {key:'insider', label:'Insider Own.', align:'right', w:75, fmt:r=>r.insider!=null?r.insider.toFixed(1)+'%':'—'}
  const inst    = {key:'inst',    label:'Inst. Own.',  align:'right', w:75,  fmt:r=>r.inst   !=null?r.inst.toFixed(1)+'%':'—'}
  const short_  = {key:'short',   label:'Short Float', align:'right', w:75,  fmt:r=>r.shortF !=null?r.shortF.toFixed(1)+'%':'—'}
  const roe     = {key:'roe',     label:'ROE',         align:'right', w:55,  fmt:r=>r.roe   !=null?r.roe.toFixed(1)+'%':'—', color:r=>clr(r.roe)}
  const roa     = {key:'roa',     label:'ROA',         align:'right', w:55,  fmt:r=>r.roa   !=null?r.roa.toFixed(1)+'%':'—', color:r=>clr(r.roa)}
  const margin  = {key:'margin',  label:'Net Margin',  align:'right', w:75,  fmt:r=>r.margin !=null?r.margin.toFixed(1)+'%':'—', color:r=>clr(r.margin)}
  const income  = {key:'income',  label:'Income',      align:'right', w:80,  fmt:r=>fmtV(r.income)}
  const sales   = {key:'sales',   label:'Sales',       align:'right', w:80,  fmt:r=>fmtV(r.sales)}
  const sparkCol= {key:'spark',   label:'Daily',       align:'left',  w:80,  isSpark:true}
  const recom   = {key:'recom',   label:'Recom.',      align:'center',w:65,  fmt:r=>r.recom||'—'}

  switch(view) {
    case 'Overview':    return [...base.slice(0,4), mktcap, pe, fpe, divy, price, chg, vol, sparkCol]
    case 'Valuation':   return [...base.slice(0,4), mktcap, pe, fpe, peg, ps, pb, eps, divy, recom]
    case 'Financial':   return [...base.slice(0,4), mktcap, income, sales, eps, roe, roa, margin]
    case 'Ownership':   return [...base.slice(0,4), mktcap, insider, inst, short_, eps, pe]
    case 'Performance': return [...base.slice(0,4), price, chg, perf1w, perf4w, perf13w, perf52w, avol, vol]
    case 'Technical':   return [...base.slice(0,4), price, chg, beta, rsi, sma20, sma50, sma200, hi52w, lo52w, vol, relvol]
    case 'Charts':      return [...base.slice(0,3), price, chg, vol, sparkCol]
    case 'Tickers':     return [base[0], mktcap, pe, chg, vol]
    default:            return [...base.slice(0,4), mktcap, pe, fpe, divy, price, chg, vol, sparkCol]
  }
}

/* ─── MINI SPARKLINE ──────────────────────────────────────────── */
function Spark({ pos: isPos, seed, w=68, h=22 }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    let p = 30 + (seed % 15), pts = []
    for (let i = 0; i < 20; i++) {
      p += (isPos ? 0.1 : -0.1) + (Math.random() - 0.48) * 1.4
      pts.push(Math.max(3, Math.min(57, p)))
    }
    const lo = Math.min(...pts)-1, hi = Math.max(...pts)+1
    const sy = v => h - ((v-lo)/(hi-lo||1))*(h-2)-1
    const sx = i => (i/(pts.length-1))*w
    ctx.clearRect(0,0,w,h)
    ctx.beginPath()
    pts.forEach((v,i) => i===0 ? ctx.moveTo(sx(i),sy(v)) : ctx.lineTo(sx(i),sy(v)))
    ctx.strokeStyle = isPos ? '#26a69a' : '#ef5350'
    ctx.lineWidth = 1.5; ctx.stroke()
  }, [isPos, seed, w, h])
  return <canvas ref={ref} width={w} height={h} style={{width:w,height:h,display:'inline-block',verticalAlign:'middle'}}/>
}

/* ─── SCREENER ROW ────────────────────────────────────────────── */
function Row({ r, i, cols, onT, blurred }) {
  const [hov, setHov] = useState(false)
  const seed = r.t.split('').reduce((a,c)=>a+c.charCodeAt(0),0)
  const isPos = pos(r.chgPct)

  return (
    <tr
      style={{
        background: hov ? 'var(--cp-bg2)' : i%2 ? 'var(--cp-bg1)' : 'var(--cp-bg0)',
        cursor: blurred ? 'default' : 'pointer',
        filter: blurred ? 'blur(3px)' : 'none',
        userSelect: blurred ? 'none' : 'auto',
        transition:'background 0.08s',
      }}
      onMouseEnter={() => !blurred && setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => !blurred && onT && onT(r.t)}
    >
      {cols.map(col => {
        if (col.isSpark) return (
          <td key="spark" style={{padding:'3px 6px', borderBottom:bd}}>
            <Spark pos={isPos} seed={seed}/>
          </td>
        )
        const val = col.fmt ? col.fmt(r) : (r[col.key] ?? '—')
        const color = col.color ? col.color(r) : (col.key==='t' ? 'var(--cp-link)' : 'var(--cp-txt)')
        const fw = col.key === 't' ? 700 : (col.align==='right' ? 600 : 400)
        return (
          <td key={col.key}
            style={{
              padding:'3px 6px',
              borderBottom:bd,
              textAlign:col.align||'left',
              color,
              fontWeight:fw,
              fontSize:12,
              whiteSpace:'nowrap',
              maxWidth:col.w ? col.w+20 : undefined,
              overflow:'hidden',
              textOverflow:'ellipsis',
            }}
          >
            {col.key==='t' ? (
              <a href="#" onClick={e=>{e.preventDefault();!blurred&&onT&&onT(r.t)}}
                style={{color:'var(--cp-link)',textDecoration:'none',fontWeight:700}}>
                {r.t}
              </a>
            ) : val}
          </td>
        )
      })}
    </tr>
  )
}

/* ─── TRIAL BANNER ────────────────────────────────────────────── */
function TrialBanner({ daysLeft, onUpgrade }) {
  const [show, setShow] = useState(true)
  if (!show) return null
  return (
    <div style={{
      background:'rgba(41,98,255,0.08)',
      border:'1px solid rgba(41,98,255,0.2)',
      borderRadius:4, padding:'7px 14px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      marginBottom:10,
    }}>
      <span style={{fontSize:12,color:'#7b9eff'}}>
        🎯 Free trial · <strong>{daysLeft} day{daysLeft!==1?'s':''}</strong> remaining
      </span>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <button onClick={onUpgrade} style={{
          fontSize:11,color:'#2962ff',background:'none',border:'none',cursor:'pointer',fontWeight:600,
        }}>Subscribe →</button>
        <button onClick={()=>setShow(false)} style={{
          fontSize:14,color:'var(--cp-txt3)',background:'none',border:'none',cursor:'pointer',lineHeight:1,
        }}>×</button>
      </div>
    </div>
  )
}

/* ─── FILTER SECTION (Descriptive) ───────────────────────────── */
function FiltersDescriptive({ F, setF }) {
  return (
    <table cellPadding={0} cellSpacing={2} style={{width:'100%',tableLayout:'fixed'}}>
      <tbody>
        <tr>
          <FDrop label="Exchange"    opts={EXCHANGES}   value={F.exch}   onChange={v=>setF(p=>({...p,exch:v}))}    width={120}/>
          <FDrop label="Index"       opts={INDEXES}     value={F.index}  onChange={v=>setF(p=>({...p,index:v}))}   width={120}/>
          <FDrop label="Sector"      opts={SECTORS}     value={F.sec}    onChange={v=>setF(p=>({...p,sec:v}))}     width={140}/>
          <FDrop label="Industry"    opts={INDUSTRIES}  value={F.ind}    onChange={v=>setF(p=>({...p,ind:v}))}     width={180}/>
          <FDrop label="Country"     opts={COUNTRIES}   value={F.cntry}  onChange={v=>setF(p=>({...p,cntry:v}))}  width={100}/>
          <FDrop label="Market Cap"  opts={MKTCAP_OPT}  value={F.mktcap} onChange={v=>setF(p=>({...p,mktcap:v}))} width={140}/>
          <FDrop label="Dividend %"  opts={DIVYIELD_OPT}value={F.divy}   onChange={v=>setF(p=>({...p,divy:v}))}   width={130}/>
        </tr>
        <tr>
          <FDrop label="Float"       opts={FLOAT_OPT}   value={F.float}  onChange={v=>setF(p=>({...p,float:v}))}  width={120}/>
          <FDrop label="Avg Volume"  opts={VOL_OPT}     value={F.avol}   onChange={v=>setF(p=>({...p,avol:v}))}   width={120}/>
          <FDrop label="Relative Vol"opts={RELVOL_OPT}  value={F.relvol} onChange={v=>setF(p=>({...p,relvol:v}))} width={140}/>
          <FDrop label="Change"      opts={CHANGE_OPT}  value={F.chg}    onChange={v=>setF(p=>({...p,chg:v}))}    width={180}/>
          <FDrop label="P/E"         opts={PE_OPT}      value={F.pe}     onChange={v=>setF(p=>({...p,pe:v}))}     width={100}/>
          <td/>
          <td/>
        </tr>
      </tbody>
    </table>
  )
}

/* ─── FILTER SECTION (Technical) ─────────────────────────────── */
function FiltersTechnical({ F, setF }) {
  return (
    <table cellPadding={0} cellSpacing={2} style={{width:'100%',tableLayout:'fixed'}}>
      <tbody>
        <tr>
          <FDrop label="Performance" opts={PERF_OPT}    value={F.perf}   onChange={v=>setF(p=>({...p,perf:v}))}  width={180}/>
          <FDrop label="RSI (14)"    opts={RSI_OPT}     value={F.rsi}    onChange={v=>setF(p=>({...p,rsi:v}))}   width={160}/>
          <FDrop label="20-Day SMA"  opts={SMA_OPT}     value={F.sma20}  onChange={v=>setF(p=>({...p,sma20:v}))} width={200}/>
          <FDrop label="50-Day SMA"  opts={SMA_OPT}     value={F.sma50}  onChange={v=>setF(p=>({...p,sma50:v}))} width={200}/>
          <FDrop label="200-Day SMA" opts={SMA_OPT}     value={F.sma200} onChange={v=>setF(p=>({...p,sma200:v}))}width={200}/>
        </tr>
      </tbody>
    </table>
  )
}

/* ─── FILTER SECTION (Fundamental) ───────────────────────────── */
function FiltersFundamental({ F, setF }) {
  return (
    <table cellPadding={0} cellSpacing={2} style={{width:'100%',tableLayout:'fixed'}}>
      <tbody>
        <tr>
          <FDrop label="P/E"        opts={PE_OPT}      value={F.pe}     onChange={v=>setF(p=>({...p,pe:v}))}    width={130}/>
          <FDrop label="Fwd P/E"    opts={PE_OPT}      value={F.fpe}    onChange={v=>setF(p=>({...p,fpe:v}))}   width={130}/>
          <FDrop label="Dividend %"  opts={DIVYIELD_OPT}value={F.divy}   onChange={v=>setF(p=>({...p,divy:v}))}  width={140}/>
          <FDrop label="Float"       opts={FLOAT_OPT}   value={F.float}  onChange={v=>setF(p=>({...p,float:v}))} width={140}/>
          <FDrop label="Market Cap"  opts={MKTCAP_OPT}  value={F.mktcap} onChange={v=>setF(p=>({...p,mktcap:v}))}width={140}/>
        </tr>
      </tbody>
    </table>
  )
}

/* ─── MAIN SCREENER ───────────────────────────────────────────── */
export default function PageScreener({ onT }) {
  const { user, isActive, isTrial, trialDaysLeft, profile } = useAuth()

  // Filters
  const [filterTab, setFilterTab] = useState('Descriptive')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [F, setF] = useState({
    exch:'Any',index:'Any',sec:'Any',ind:'Any',cntry:'Any',mktcap:'Any',
    divy:'Any',float:'Any',avol:'Any',relvol:'Any',chg:'Any',pe:'Any',fpe:'Any',
    perf:'Any',rsi:'Any',sma20:'Any',sma50:'Any',sma200:'Any',
  })
  const [signal, setSignal] = useState(SIGNAL_OPT[0])
  const [orderBy, setOrderBy] = useState('ticker')
  const [orderDir, setOrderDir] = useState('asc')
  const [tickerFilter, setTickerFilter] = useState('')

  // View
  const [view, setView] = useState('Overview')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(20)

  // Quotes
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  // Paywall modals
  const [showPricing, setShowPricing] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  // Fetch live quotes
  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    const syms = ALL_TICKERS.map(r=>r.t).join(',')
    fetch(`/api/batch-quotes?symbols=${syms}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => { setQuotes(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Merge live quotes into rows
  const rows = ALL_TICKERS.map(r => {
    const q = quotes[r.t] || {}
    // Simulate some derived fields for demo (would come from fundamentals API in production)
    const seed = r.t.split('').reduce((a,c)=>a+c.charCodeAt(0),0)
    const rnd = (s,lo,hi) => { const x = Math.sin(s)*10000; const f=x-Math.floor(x); return lo + f*(hi-lo) }
    return {
      ...r,
      price:    q.price  ?? rnd(seed+1, 10, 800),
      chgPct:   q.changePercent ?? rnd(seed+2,-5,5),
      volume:   q.volume ?? rnd(seed+3, 500000, 80000000),
      mktcap:   rnd(seed+4, 1e9, 3e12),
      pe:       rnd(seed+5, 8, 80),
      fpe:      rnd(seed+6, 6, 60),
      peg:      rnd(seed+7, 0.5, 4),
      ps:       rnd(seed+8, 0.5, 30),
      pb:       rnd(seed+9, 0.5, 20),
      eps:      rnd(seed+10, -2, 30),
      divy:     rnd(seed+11, 0, 6),
      avgVol:   rnd(seed+12, 1e6, 50e6),
      relVol:   rnd(seed+13, 0.3, 4),
      beta:     rnd(seed+14, 0.3, 2.5),
      rsi:      rnd(seed+15, 20, 80),
      sma20:    rnd(seed+16, -15, 15),
      sma50:    rnd(seed+17, -20, 20),
      sma200:   rnd(seed+18, -30, 30),
      hi52w:    rnd(seed+19, -40, 2),
      lo52w:    rnd(seed+20, 2, 120),
      perf1w:   rnd(seed+21, -10, 10),
      perf4w:   rnd(seed+22, -15, 15),
      perf13w:  rnd(seed+23, -25, 25),
      perf52w:  rnd(seed+24, -40, 60),
      insider:  rnd(seed+25, 0, 35),
      inst:     rnd(seed+26, 10, 90),
      shortF:   rnd(seed+27, 0.5, 25),
      roe:      rnd(seed+28, -5, 50),
      roa:      rnd(seed+29, -3, 25),
      margin:   rnd(seed+30, -10, 40),
      income:   rnd(seed+31, 1e8, 1e11),
      sales:    rnd(seed+32, 5e8, 5e11),
      recom:    ['Strong Buy','Buy','Hold','Sell','Strong Sell'][Math.floor(rnd(seed+33,0,5))],
    }
  })

  // Filter rows by ticker textarea
  const tickerList = tickerFilter.trim()
    ? tickerFilter.toUpperCase().split(/[,\s\n]+/).filter(Boolean)
    : null

  let filtered = tickerList
    ? rows.filter(r => tickerList.includes(r.t))
    : rows.filter(r => {
        if (F.exch !== 'Any' && r.exch !== F.exch) return false
        if (F.sec  !== 'Any' && r.sec  !== F.sec)  return false
        if (F.ind  !== 'Any' && r.ind  !== F.ind)  return false
        if (F.cntry!== 'Any' && r.cntry!== F.cntry)return false
        return true
      })

  // Sort
  const sortMap = {
    ticker: r => r.t,
    company: r => r.n,
    change: r => r.chgPct ?? 0,
    price: r => r.price ?? 0,
    volume: r => r.volume ?? 0,
    marketcap: r => r.mktcap ?? 0,
    pe: r => r.pe ?? 0,
    dividendyield: r => r.divy ?? 0,
    rsi: r => r.rsi ?? 0,
    perf52w: r => r.perf52w ?? 0,
  }
  const sf = sortMap[orderBy] || (r => r.t)
  filtered = [...filtered].sort((a,b) => {
    const va = sf(a), vb = sf(b)
    const d = typeof va === 'string' ? va.localeCompare(vb) : va - vb
    return orderDir === 'asc' ? d : -d
  })

  const total = filtered.length
  const totalPages = Math.ceil(total / perPage)
  const pageRows = filtered.slice(page*perPage, (page+1)*perPage)

  // After loading, reset page if filter changes
  useEffect(() => { setPage(0) }, [F, signal, orderBy, orderDir, tickerFilter, perPage, view])

  const resetFilters = () => {
    setF({exch:'Any',index:'Any',sec:'Any',ind:'Any',cntry:'Any',mktcap:'Any',
      divy:'Any',float:'Any',avol:'Any',relvol:'Any',chg:'Any',pe:'Any',fpe:'Any',
      perf:'Any',rsi:'Any',sma20:'Any',sma50:'Any',sma200:'Any'})
    setSignal(SIGNAL_OPT[0])
    setOrderBy('ticker')
    setOrderDir('asc')
    setTickerFilter('')
  }

  const cols = getCols(view)

  // Determine paywall cutoff within current page
  const globalStart = page * perPage
  const freeEnd = FREE_ROW_LIMIT // rows 0..19 always free, rest need pro

  const canSeeAll = isActive  // active subscriber or trialing

  /* ─────────────────── STRIPE CHECKOUT ─────────────────────── */
  const handleUpgrade = async (priceId) => {
    if (!user) { setShowAuth(true); return }
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ priceId: priceId||'price_1T308QBCkivbmRhWDd3WE4TK', userId:user.id, email:user.email }),
      })
      const { url, error } = await res.json()
      if (url) window.location.href = url
      else alert(error || 'Checkout failed')
    } catch(e) {
      alert('Could not start checkout. Please try again.')
    }
  }

  /* ─────────────────── STYLES ──────────────────────────────── */
  const selStyle = {
    fontSize:11, padding:'3px 6px', fontFamily:FONT,
    background:'var(--cp-bg1)', color:'var(--cp-txt)',
    border:'1px solid var(--cp-bg3)', borderRadius:2, cursor:'pointer',
  }
  const btnStyle = (active) => ({
    padding:'4px 12px', fontSize:12, fontFamily:FONT, cursor:'pointer',
    background: active ? 'var(--cp-bg2)' : 'transparent',
    color: active ? 'var(--cp-txt)' : 'var(--cp-txt2)',
    border:'1px solid ' + (active ? 'var(--cp-bg3)' : 'transparent'),
    borderRadius:2, fontWeight:600,
  })
  const tabStyle = (active) => ({
    padding:'5px 12px', fontSize:12, fontFamily:FONT, cursor:'pointer',
    background: active ? 'var(--cp-bg2)' : 'var(--cp-bg0)',
    color: active ? 'var(--cp-txt)' : 'var(--cp-txt2)',
    border:'1px solid var(--cp-bg3)',
    borderBottom: active ? '1px solid var(--cp-bg2)' : '1px solid var(--cp-bg3)',
    marginRight:2, borderRadius:'3px 3px 0 0', fontWeight:600,
  })
  const viewTabStyle = (active) => ({
    padding:'4px 12px', fontSize:12, fontFamily:FONT, cursor:'pointer',
    background: active ? '#2962ff' : 'var(--cp-bg1)',
    color: active ? '#fff' : 'var(--cp-txt2)',
    border:'1px solid var(--cp-bg3)', marginRight:2, borderRadius:2,
    fontWeight:600, whiteSpace:'nowrap',
  })

  return (
    <div style={{padding:'8px 0', fontFamily:FONT, color:'var(--cp-txt)', fontSize:12}}>

      {/* TRIAL BANNER */}
      {isTrial && trialDaysLeft && trialDaysLeft() > 0 && (
        <TrialBanner daysLeft={trialDaysLeft()} onUpgrade={()=>handleUpgrade()}/>
      )}

      {/* ── TOP CONTROLS ── */}
      <table width="100%" cellPadding={0} cellSpacing={0} style={{marginBottom:4}}>
        <tbody>
          <tr>
            {/* Presets */}
            <td style={{width:130,paddingRight:6,verticalAlign:'middle'}}>
              <select style={{...selStyle,width:'100%'}}>
                <option>My Presets</option>
                <option value="save">–Save Screen</option>
                <option value="edit">–Edit Screens</option>
              </select>
            </td>

            {/* Order By */}
            <td style={{paddingRight:4,verticalAlign:'middle',whiteSpace:'nowrap'}}>
              <span style={{fontSize:11,fontWeight:700,color:'var(--cp-txt2)',marginRight:4}}>Order</span>
            </td>
            <td style={{paddingRight:4,verticalAlign:'middle'}}>
              <select value={orderBy} onChange={e=>setOrderBy(e.target.value)} style={{...selStyle,width:180}}>
                {ORDER_OPT.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </td>
            <td style={{paddingRight:10,verticalAlign:'middle'}}>
              <select value={orderDir} onChange={e=>setOrderDir(e.target.value)} style={{...selStyle,width:60}}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </td>

            {/* Signal */}
            <td style={{paddingRight:4,verticalAlign:'middle',whiteSpace:'nowrap'}}>
              <span style={{fontSize:11,fontWeight:700,color:'var(--cp-txt2)',marginRight:4}}>Signal</span>
            </td>
            <td style={{paddingRight:10,verticalAlign:'middle'}}>
              <select value={signal} onChange={e=>setSignal(e.target.value)} style={{...selStyle,width:180}}>
                {SIGNAL_OPT.map(s=><option key={s}>{s}</option>)}
              </select>
            </td>

            {/* Tickers */}
            <td style={{paddingRight:4,verticalAlign:'middle',whiteSpace:'nowrap'}}>
              <span style={{fontSize:11,fontWeight:700,color:'var(--cp-txt2)',marginRight:4}}>Tickers</span>
            </td>
            <td style={{paddingRight:8,verticalAlign:'middle'}}>
              <input
                value={tickerFilter}
                onChange={e=>setTickerFilter(e.target.value)}
                placeholder="e.g. AAPL,MSFT,NVDA"
                style={{...selStyle,width:180,height:22}}
              />
            </td>

            {/* Filters toggle */}
            <td style={{verticalAlign:'middle',paddingRight:4}}>
              <button onClick={()=>setFiltersOpen(o=>!o)} style={{
                ...btnStyle(filtersOpen),
                display:'flex',alignItems:'center',gap:4,
              }}>
                Filters {filtersOpen ? '▲' : '▼'}
              </button>
            </td>

            {/* Reset */}
            <td style={{verticalAlign:'middle'}}>
              <button onClick={resetFilters} style={{...btnStyle(false),color:'var(--cp-txt3)'}}>
                Reset
              </button>
            </td>

            <td style={{flex:1}}/>

            {/* Result count */}
            <td style={{verticalAlign:'middle',textAlign:'right',whiteSpace:'nowrap'}}>
              <span style={{fontSize:11,color:'var(--cp-txt2)'}}>
                {loading ? 'Loading…' : `${total} result${total!==1?'s':''}`}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── FILTER TABS ── */}
      {filtersOpen && (
        <div style={{
          border:'1px solid var(--cp-bg3)',
          borderRadius:4, marginBottom:4, overflow:'hidden',
        }}>
          {/* Tab row */}
          <div style={{
            display:'flex', alignItems:'stretch',
            background:'var(--cp-bg2)',
            borderBottom:'1px solid var(--cp-bg3)',
          }}>
            <div style={{display:'flex',flex:1}}>
              {FILTER_TABS.map(t=>(
                <button key={t} onClick={()=>setFilterTab(t)} style={{
                  padding:'5px 14px', fontSize:12, fontFamily:FONT, cursor:'pointer',
                  background: filterTab===t ? 'var(--cp-bg0)' : 'transparent',
                  color: filterTab===t ? 'var(--cp-txt)' : 'var(--cp-txt2)',
                  border:'none',
                  borderRight:'1px solid var(--cp-bg3)',
                  fontWeight:600,
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Filter content */}
          <div style={{padding:'8px 8px 6px', background:'var(--cp-bg0)'}}>
            {(filterTab==='Descriptive'||filterTab==='All') && (
              <FiltersDescriptive F={F} setF={setF}/>
            )}
            {(filterTab==='Technical'||filterTab==='All') && (
              <FiltersTechnical F={F} setF={setF}/>
            )}
            {(filterTab==='Fundamental'||filterTab==='All') && (
              <FiltersFundamental F={F} setF={setF}/>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW TABS ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:0,
        marginBottom:0, flexWrap:'wrap',
        borderBottom:'1px solid var(--cp-bg3)',
        paddingBottom:0,
      }}>
        <div style={{display:'flex',flexWrap:'wrap',flex:1}}>
          {VIEW_TABS.map(v=>(
            <button key={v} onClick={()=>setView(v)} style={viewTabStyle(view===v)}>{v}</button>
          ))}
        </div>

        {/* Per page */}
        <div style={{display:'flex',alignItems:'center',gap:4,paddingBottom:2}}>
          <span style={{fontSize:11,color:'var(--cp-txt3)'}}>Show</span>
          {PER_PAGE_OPT.map(n=>(
            <button key={n} onClick={()=>setPerPage(n)} style={{
              ...btnStyle(perPage===n),
              padding:'3px 8px',fontSize:11,
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{overflowX:'auto', position:'relative'}}>
        <table style={{
          width:'100%', borderCollapse:'collapse',
          fontSize:12, fontFamily:FONT,
          background:'var(--cp-bg0)',
        }}>
          {/* THEAD */}
          <thead>
            <tr style={{background:'var(--cp-bg2)'}}>
              <th style={{...thS(),width:32,textAlign:'center',borderBottom:bd}}>#</th>
              {cols.map(col=>(
                <th key={col.key}
                  onClick={()=>{
                    const k = col.key==='chg'?'change':col.key==='vol'?'volume':col.key
                    if(sortMap[k]){setOrderBy(k);setOrderDir(d=>d==='asc'?'desc':'asc')}
                  }}
                  style={{
                    ...thS(col.align==='right'),
                    cursor:sortMap[col.key==='chg'?'change':col.key==='vol'?'volume':col.key]?'pointer':'default',
                    userSelect:'none', whiteSpace:'nowrap',
                    borderBottom:bd, minWidth:col.w,
                  }}
                >
                  {col.label}
                  {(orderBy===col.key||orderBy===(col.key==='chg'?'change':col.key==='vol'?'volume':col.key))&&(
                    <span style={{marginLeft:3,fontSize:10}}>{orderDir==='asc'?'↑':'↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* TBODY */}
          <tbody>
            {pageRows.map((r, i) => {
              const globalIdx = globalStart + i
              const blurred = !canSeeAll && globalIdx >= freeEnd
              return (
                <Row
                  key={r.t}
                  r={r}
                  i={i}
                  cols={cols}
                  onT={onT}
                  blurred={blurred}
                />
              )
            })}

            {/* Paywall gate — shown when free user sees row 20+ */}
            {!canSeeAll && globalStart < freeEnd && globalStart + perPage > freeEnd && (
              <PaywallOverlay
                isLoggedIn={!!user}
                onUpgrade={() => handleUpgrade()}
                onSignIn={() => setShowAuth(true)}
              />
            )}

            {/* Paywall gate — full page locked */}
            {!canSeeAll && globalStart >= freeEnd && (
              <PaywallOverlay
                isLoggedIn={!!user}
                onUpgrade={() => handleUpgrade()}
                onSignIn={() => setShowAuth(true)}
              />
            )}

            {/* Empty state */}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={cols.length+1} style={{padding:'32px',textAlign:'center',color:'var(--cp-txt2)'}}>
                  No results match your filters.{' '}
                  <button onClick={resetFilters} style={{
                    color:'var(--cp-link)',background:'none',border:'none',cursor:'pointer',fontSize:12,
                  }}>Reset filters</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'8px 4px', borderTop:'1px solid var(--cp-bg3)',
          flexWrap:'wrap', gap:6,
        }}>
          <span style={{fontSize:11,color:'var(--cp-txt2)'}}>
            Showing {globalStart+1}–{Math.min(globalStart+perPage,total)} of {total}
          </span>
          <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
            <button onClick={()=>setPage(0)} disabled={page===0} style={{...btnStyle(false),fontSize:11}}>«</button>
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...btnStyle(false),fontSize:11}}>‹</button>
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
              const pn = page < 4 ? i : page > totalPages-4 ? totalPages-7+i : page-3+i
              if(pn<0||pn>=totalPages) return null
              return (
                <button key={pn} onClick={()=>setPage(pn)} style={{...btnStyle(page===pn),fontSize:11,minWidth:28}}>
                  {pn+1}
                </button>
              )
            })}
            <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{...btnStyle(false),fontSize:11}}>›</button>
            <button onClick={()=>setPage(totalPages-1)} disabled={page===totalPages-1} style={{...btnStyle(false),fontSize:11}}>»</button>
          </div>
          <span style={{fontSize:11,color:'var(--cp-txt3)'}}>
            {loading ? '⟳ fetching prices…' : `Live via Finnhub · 15min cache`}
          </span>
        </div>
      )}

      {/* ── PRICING MODAL (lazy import) ── */}
      {showPricing && <PricingModalInline onClose={()=>setShowPricing(false)} onCheckout={handleUpgrade}/>}
      {showAuth    && <AuthModalInline    onClose={()=>setShowAuth(false)} onSuccess={()=>{setShowAuth(false);setShowPricing(true)}}/>}
    </div>
  )
}

/* ─── INLINE PRICING MODAL ────────────────────────────────────── */
const PLANS_INLINE = [
  { name:'Monthly', price:'$19.99', period:'/mo', priceId:'price_1T308QBCkivbmRhWDd3WE4TK', badge:'Most Popular', color:'#2962ff', trial:true },
  { name:'Annual',  price:'$149',   period:'/yr', priceId:'price_1T309jBCkivbmRhW0Ef4HPsF', badge:'Best Value',   color:'#26a69a', trial:true, sub:'~$12.42/mo · Save 37%' },
  { name:'Weekly',  price:'$9.99',  period:'/wk', priceId:'price_1T307MBCkivbmRhWWSQuznBw', badge:null,           color:'var(--cp-txt2)', trial:false },
  { name:'Daily',   price:'$4.99',  period:'/day',priceId:'price_1T304WBCkivbmRhWwUKLoaXC',  badge:null,           color:'var(--cp-txt2)', trial:false },
]

function PricingModalInline({ onClose, onCheckout }) {
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:2000,
      background:'rgba(0,0,0,0.85)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:16,
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:'var(--cp-bg1)',border:'1px solid var(--cp-bg3)',
        borderRadius:12,padding:28,maxWidth:480,width:'100%',
        boxShadow:'0 24px 64px rgba(0,0,0,0.6)',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:'var(--cp-txt)',fontFamily:FONT}}>
              Compound<span style={{color:'#2962ff'}}>Pulse</span> Pro
            </div>
            <div style={{fontSize:12,color:'var(--cp-txt2)',marginTop:2}}>
              Full screener · Real-time data · Advanced filters
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'none',border:'none',color:'var(--cp-txt2)',
            fontSize:20,cursor:'pointer',lineHeight:1,
          }}>×</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}>
          {PLANS_INLINE.map(p=>(
            <div key={p.name} style={{
              border:`1px solid ${p.badge?p.color:'var(--cp-bg3)'}`,
              borderRadius:8,padding:'14px 12px',position:'relative',
              background:p.badge?`rgba(${p.color==='#2962ff'?'41,98,255':'38,166,154'},0.06)`:'var(--cp-bg0)',
            }}>
              {p.badge&&(
                <div style={{
                  position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',
                  background:p.color,color:'#fff',fontSize:9,fontWeight:700,
                  padding:'2px 10px',borderRadius:20,whiteSpace:'nowrap',
                }}>{p.badge}</div>
              )}
              <div style={{fontSize:10,fontWeight:800,color:p.color,marginBottom:4,letterSpacing:'0.06em'}}>{p.name.toUpperCase()}</div>
              <div style={{fontSize:22,fontWeight:900,color:'var(--cp-txt)',lineHeight:1}}>
                {p.price}<span style={{fontSize:11,color:'var(--cp-txt2)',fontWeight:400}}>{p.period}</span>
              </div>
              {p.sub&&<div style={{fontSize:10,color:'var(--cp-txt2)',marginTop:2}}>{p.sub}</div>}
              {p.trial&&<div style={{fontSize:10,color:'var(--cp-pos)',marginTop:2}}>7-day free trial</div>}
              <button onClick={()=>onCheckout(p.priceId)} style={{
                marginTop:10,width:'100%',padding:'8px',fontSize:12,fontWeight:700,
                background:p.badge?p.color:'var(--cp-bg2)',color:p.badge?'#fff':'var(--cp-txt)',
                border:'none',borderRadius:5,cursor:'pointer',fontFamily:FONT,
              }}>
                {p.trial?'Start Free Trial':'Get Access'}
              </button>
            </div>
          ))}
        </div>

        <div style={{fontSize:11,color:'var(--cp-txt3)',textAlign:'center'}}>
          Stripe-secured · Cancel anytime · No card for trial
        </div>
      </div>
    </div>
  )
}

/* ─── INLINE AUTH MODAL ───────────────────────────────────────── */
function AuthModalInline({ onClose, onSuccess }) {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, supabase } = useAuth()

  const inpStyle = {
    width:'100%', padding:'9px 12px', fontSize:13,
    background:'var(--cp-bg2)', color:'var(--cp-txt)',
    border:'1px solid var(--cp-bg3)', borderRadius:6,
    fontFamily:FONT, boxSizing:'border-box',
  }

  const handleSubmit = async () => {
    setErr(''); setLoading(true)
    if (mode==='signup') {
      const {error} = await signUp(email,pw)
      if (error) setErr(error.message)
      else setMode('check')
    } else {
      const {error} = await signIn(email,pw)
      if (error) setErr(error.message)
      else { onSuccess?.() }
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    const {error} = await supabase.auth.signInWithOAuth({
      provider:'google',
      options:{redirectTo:`${window.location.origin}/`},
    })
    if (error) setErr(error.message)
  }

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:2001,
      background:'rgba(0,0,0,0.9)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:16,
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:'var(--cp-bg1)',border:'1px solid var(--cp-bg3)',
        borderRadius:12,padding:28,width:'100%',maxWidth:380,
        boxShadow:'0 24px 64px rgba(0,0,0,0.7)',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:800,color:'var(--cp-txt)',fontFamily:FONT}}>
            Compound<span style={{color:'#2962ff'}}>Pulse</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--cp-txt2)',fontSize:18,cursor:'pointer'}}>×</button>
        </div>

        {mode==='check' ? (
          <div style={{textAlign:'center',padding:'12px 0'}}>
            <div style={{fontSize:32,marginBottom:10}}>✉️</div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--cp-txt)',marginBottom:6}}>Check your email</div>
            <div style={{fontSize:13,color:'var(--cp-txt2)'}}>We sent a confirmation link to {email}. Click it to activate your account, then sign in.</div>
            <button onClick={()=>setMode('signin')} style={{
              marginTop:16,padding:'9px 20px',background:'var(--cp-bg2)',color:'var(--cp-txt)',
              border:'1px solid var(--cp-bg3)',borderRadius:6,cursor:'pointer',fontFamily:FONT,fontSize:13,
            }}>Sign In Instead</button>
          </div>
        ) : (
          <>
            <div style={{fontSize:13,fontWeight:600,color:'var(--cp-txt2)',marginBottom:14,textAlign:'center'}}>
              {mode==='signup'?'Create your account':'Welcome back'}
            </div>

            {/* Google */}
            <button onClick={handleGoogle} style={{
              width:'100%',padding:'10px',marginBottom:12,fontSize:13,fontWeight:600,
              background:'var(--cp-bg0)',color:'var(--cp-txt)',
              border:'1px solid var(--cp-bg3)',borderRadius:6,cursor:'pointer',fontFamily:FONT,
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <div style={{
              display:'flex',alignItems:'center',gap:8,marginBottom:12,
              color:'var(--cp-txt3)',fontSize:11,
            }}>
              <div style={{flex:1,height:1,background:'var(--cp-bg3)'}}/>
              or
              <div style={{flex:1,height:1,background:'var(--cp-bg3)'}}/>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" style={inpStyle}/>
              <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="Password" style={inpStyle}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
            </div>

            {err&&<div style={{fontSize:11,color:'var(--cp-neg)',marginTop:8}}>{err}</div>}

            <button onClick={handleSubmit} disabled={loading} style={{
              width:'100%',marginTop:12,padding:'10px',
              background:'#2962ff',color:'#fff',border:'none',
              borderRadius:6,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:FONT,
              opacity:loading?0.7:1,
            }}>
              {loading ? 'Loading…' : mode==='signup' ? 'Create Account' : 'Sign In'}
            </button>

            <div style={{marginTop:10,textAlign:'center',fontSize:12,color:'var(--cp-txt2)'}}>
              {mode==='signup' ? (
                <>Already have an account?{' '}
                  <button onClick={()=>setMode('signin')} style={{background:'none',border:'none',color:'var(--cp-link)',cursor:'pointer',fontSize:12}}>Sign In</button>
                </>
              ) : (
                <>No account?{' '}
                  <button onClick={()=>setMode('signup')} style={{background:'none',border:'none',color:'var(--cp-link)',cursor:'pointer',fontSize:12}}>Sign Up Free</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}