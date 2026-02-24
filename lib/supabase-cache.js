// lib/supabase-cache.js
// Supabase key-value cache for market data
// Uses service role key (server-side only, never exposed to client)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const headers = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
})

// Read cache entry - returns { data, fetched_at } or null
export async function cacheGet(key) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/market_cache?key=eq.${encodeURIComponent(key)}&select=data,fetched_at`,
      { headers: headers() }
    )
    if (!res.ok) return null
    const rows = await res.json()
    if (!rows?.length) return null
    return rows[0]
  } catch {
    return null
  }
}

// Write cache entry (upsert)
export async function cacheSet(key, data) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/market_cache`, {
      method: 'POST',
      headers: {
        ...headers(),
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key, data, fetched_at: new Date().toISOString() }),
    })
  } catch {}
}

// Check if cache entry is fresh (within maxAgeMs)
export function isFresh(fetched_at, maxAgeMs = 4 * 60 * 60 * 1000) {
  if (!fetched_at) return false
  return Date.now() - new Date(fetched_at).getTime() < maxAgeMs
}

// Helper: get from cache or fetch fresh
// fetchFn: async function that returns the fresh data
// maxAgeMs: default 4 hours
export async function cacheOr(key, fetchFn, maxAgeMs = 4 * 60 * 60 * 1000) {
  const cached = await cacheGet(key)
  if (cached && isFresh(cached.fetched_at, maxAgeMs)) {
    console.log(`[cache HIT] ${key} (age: ${Math.round((Date.now()-new Date(cached.fetched_at))/60000)}min)`)
    return { data: cached.data, fromCache: true }
  }
  console.log(`[cache MISS] ${key} — fetching fresh`)
  const data = await fetchFn()
  await cacheSet(key, data)
  return { data, fromCache: false }
}