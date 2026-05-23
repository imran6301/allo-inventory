'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
  }, [])

  async function handleReserve(productId: string, warehouseId: string) {
    const key = `${productId}-${warehouseId}`
    setReserving(key)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 })
      })
      if (res.status === 409) { toast.error('No units available at this warehouse.'); return }
      if (!res.ok) { toast.error('Something went wrong.'); return }
      const reservation = await res.json()
      router.push(`/reservations/${reservation.id}`)
    } finally {
      setReserving(null)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 1 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 280, background: 'var(--bg-card)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <h1 className="mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Product Catalogue
          </h1>
          <span className="mono" style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: 2 }}>
            {products.length} items
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Reserve units across the warehouse network. Holds expire in 10 minutes.
        </p>
      </div>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 1, border: '1px solid var(--border)' }}>
        {products.map((product, pi) => (
          <div
            key={product.id}
            className={`fade-up-${Math.min(pi + 1, 4)}`}
            style={{
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
          >
            {/* Product image */}
      {/* Product image */}
<div
  style={{
    height: 220,
    overflow: 'hidden',
    borderBottom: '1px solid var(--border)',
    position: 'relative',
    background: '#111',
  }}
>
  {product.imageUrl ? (
    <img
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        transition: 'transform 0.4s ease',
        filter: 'brightness(0.92)',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'
      }}
      onError={e => {
        ;(e.currentTarget as HTMLImageElement).src =
          'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop'
      }}
    />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(135deg, #1a1a1a 0%, #101010 100%)',
      }}
    />
  )}

  {/* dark overlay */}
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background:
        'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 45%, transparent 70%)',
    }}
  />

  {/* product title */}
  <div
    style={{
      position: 'absolute',
      bottom: 14,
      left: 16,
      right: 16,
    }}
  >
    <p
      className="mono"
      style={{
        fontSize: 20,
        fontWeight: 600,
        color: '#fff',
        lineHeight: 1.2,
        textShadow: '0 2px 10px rgba(0,0,0,0.45)',
      }}
    >
      {product.name}
    </p>
  </div>
</div>
            {/* Info */}
            <div style={{ padding: '16px 16px 0' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{product.description}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--accent)' }}>
                  ₹{product.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stock rows */}
            <div style={{ flex: 1, padding: '0 0 16px' }}>
              <div style={{ padding: '0 16px', marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  WAREHOUSE STOCK
                </span>
              </div>
              {product.stocks.map(stock => {
                const available = stock.available
                const isOut = available === 0
                const isLow = available === 1
                const key = `${product.id}-${stock.warehouseId}`
                const isLoading = reserving === key

                return (
                  <div
                    key={stock.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderTop: '1px solid var(--border)',
                      opacity: isOut ? 0.5 : 1,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {stock.warehouse.name}
                      </p>
                      <p className="mono" style={{ fontSize: 11, color: isOut ? 'var(--red)' : isLow ? '#f59e0b' : 'var(--green)', marginTop: 2 }}>
                        {isOut ? 'OUT OF STOCK' : isLow ? '⚠ LAST UNIT' : `${available} units`}
                      </p>
                    </div>
                    <button
                      disabled={isOut || isLoading}
                      onClick={() => handleReserve(product.id, stock.warehouseId)}
                      style={{
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        padding: '7px 14px',
                        border: isOut ? '1px solid var(--border)' : '1px solid var(--accent)',
                        background: isLoading ? 'var(--accent-dim)' : isOut ? 'transparent' : 'rgba(249,115,22,0.1)',
                        color: isOut ? 'var(--text-muted)' : 'var(--accent)',
                        borderRadius: 'var(--radius)',
                        cursor: isOut ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        minWidth: 80,
                        textAlign: 'center',
                      }}
                      onMouseEnter={e => { if (!isOut && !isLoading) { (e.target as HTMLButtonElement).style.background = 'var(--accent)'; (e.target as HTMLButtonElement).style.color = '#000' } }}
                      onMouseLeave={e => { if (!isOut && !isLoading) { (e.target as HTMLButtonElement).style.background = 'rgba(249,115,22,0.1)'; (e.target as HTMLButtonElement).style.color = 'var(--accent)' } }}
                    >
                      {isLoading ? '...' : isOut ? 'SOLD OUT' : 'RESERVE'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          · Reservations hold for 10 min
        </span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          · Concurrency-safe stock locking
        </span>
      </div>
    </div>
  )
}