import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './hooks/useAuth'

export const metadata: Metadata = {
  title: 'CompoundPulse',
  description: 'Professional chart pattern detection for serious traders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}