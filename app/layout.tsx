import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Allo Inventory',
  description: 'Multi-warehouse inventory & reservation platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px',
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20, height: 20,
                background: 'var(--accent)',
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              }} />
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                ALLO / INVENTORY
              </span>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              WAREHOUSE MGMT v1.0
            </span>
          </div>
        </header>
        <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          {children}
        </main>
        <Toaster theme="dark" />
      </body>
    </html>
  )
}