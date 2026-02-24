// DashSearch.jsx — header search with live dropdown
'use client'
import { useState, useEffect, useRef } from 'react'
import { C, bd } from './dashTheme'
import { SEARCH_LIST } from './dashData'

export default function DashSearch({ onT }) {
  const [val, setVal] = useState('')
  const [show, setShow] = useState(false)
  const ref = useRef(null)

  const matches = val.length >= 1
    ? SEARCH_LIST.filter(s =>
        s.t.startsWith(val.toUpperCase()) ||
        s.n.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 8)
    : []

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setShow(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const go = t => { onT(t); setVal(''); setShow(false) }

  return (
    <div ref={ref} style={{position:'relative',flex:1,maxWidth:320}}>
      <div style={{display:'flex',alignItems:'center',border:`1px solid ${C.bg3||'var(--cp-bg3)'}`,borderRadius:3,padding:'4px 8px',background:'var(--cp-bg3)'}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,marginRight:6}}>
          <path d="M16.9 15.5l4 4c.2.2.1.5 0 .7l-.7.7a.5.5 0 01-.8 0l-4-4-.3-.4-.7-1a7 7 0 01-11.2-4 7 7 0 1112.2 3l1 .6.5.4z" fill="#aaa"/>
        </svg>
        <input value={val}
          onChange={e=>{setVal(e.target.value);setShow(true)}}
          onKeyDown={e=>{
            if(e.key==='Enter'&&val.trim()) go(val.trim().toUpperCase())
            if(e.key==='Escape') setShow(false)
          }}
          onFocus={()=>val&&setShow(true)}
          placeholder="Search ticker, company or profile"
          style={{border:'none',outline:'none',fontSize:12,color:C.txt,width:'100%',fontFamily:C.fnt,background:'transparent'}}/>
        {val && (
          <span style={{cursor:'pointer',color:'var(--cp-txt3)',fontSize:18,lineHeight:1,marginLeft:4}}
            onClick={()=>{setVal('');setShow(false)}}>×</span>
        )}
      </div>
      {show && matches.length > 0 && (
        <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--cp-bg1)',border:`1px solid #363a45`,borderTop:'none',borderRadius:'0 0 3px 3px',boxShadow:'0 8px 24px rgba(0,0,0,.5)',zIndex:9999,maxHeight:300,overflowY:'auto'}}>
          {matches.map((m,i)=>(
            <div key={i}
              style={{padding:'6px 10px',cursor:'pointer',borderBottom:`1px solid #363a45`,display:'flex',alignItems:'center',gap:8,background:'var(--cp-bg1)'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--cp-bg3)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--cp-bg1)'}
              onMouseDown={()=>go(m.t)}>
              <span style={{fontWeight:700,color:C.link,fontSize:12,fontFamily:C.fnt,minWidth:52}}>{m.t}</span>
              <span style={{color:'var(--cp-txt)',fontSize:11,fontFamily:C.fnt,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.n}</span>
              <span style={{color:'var(--cp-txt2)',fontSize:10,fontFamily:C.fnt,flexShrink:0}}>{m.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}