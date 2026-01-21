"use client"

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'

const AssetAnalyzer = dynamic(() => import('../components/AssetAnalyzer.jsx'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div>Loading...</div>
  }

  return (
    <main className="min-h-screen p-4">
      <AssetAnalyzer />
    </main>
  )
}