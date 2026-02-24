"use client"

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const LandingPage = dynamic(() => import('../components/LandingPage.jsx'), {
  ssr: false,
  loading: () => <div style={{ background: '#0e101a', minHeight: '100vh' }} />,
})

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div style={{ background: '#0e101a', minHeight: '100vh' }} />
  return <LandingPage />
}