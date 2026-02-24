'use client'
import { useState } from 'react'
import { useAuth } from '../app/hooks/useAuth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    if (mode === 'signup') {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else { setSuccess('Account created! Check your email to confirm, then sign in.'); setMode('signin') }
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else { onSuccess?.(); onClose() }
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        backgroundColor: '#131722',
        border: '1px solid #2A2E39',
        borderRadius: 12,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
            Compound<span style={{ color: '#2962FF' }}>Pulse</span>
          </div>
          <div style={{ fontSize: 13, color: '#787B86', marginTop: 6 }}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </div>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{
            width: '100%', padding: '11px 0',
            backgroundColor: '#fff',
            color: '#1a1a1a', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 16,
            opacity: googleLoading ? 0.7 : 1,
          }}
        >
          {!googleLoading && (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
            </svg>
          )}
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#2A2E39' }} />
          <span style={{ fontSize: 12, color: '#4C525E' }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#2A2E39' }} />
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#1E222D', borderRadius: 8, padding: 4, marginBottom: 20 }}>
          {['signin', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 6,
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                backgroundColor: mode === m ? '#2962FF' : 'transparent',
                color: mode === m ? '#fff' : '#787B86',
                transition: 'all 0.15s',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#787B86', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="you@example.com"
              style={{
                width: '100%', padding: '10px 12px',
                backgroundColor: '#1E222D', border: '1px solid #2A2E39',
                borderRadius: 6, color: '#D1D4DC', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: '#787B86', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••" minLength={6}
              style={{
                width: '100%', padding: '10px 12px',
                backgroundColor: '#1E222D', border: '1px solid #2A2E39',
                borderRadius: 6, color: '#D1D4DC', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)',
              borderRadius: 6, padding: '10px 12px', marginBottom: 16,
              fontSize: 13, color: '#EF5350',
            }}>{error}</div>
          )}

          {success && (
            <div style={{
              backgroundColor: 'rgba(38,166,154,0.1)', border: '1px solid rgba(38,166,154,0.3)',
              borderRadius: 6, padding: '10px 12px', marginBottom: 16,
              fontSize: 13, color: '#26A69A',
            }}>{success}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px 0',
              backgroundColor: loading ? '#2A2E39' : '#2962FF',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {mode === 'signup' && (
          <div style={{ marginTop: 14, fontSize: 12, color: '#4C525E', textAlign: 'center' }}>
            By signing up you agree to our Terms of Service
          </div>
        )}
      </div>
    </div>
  )
}