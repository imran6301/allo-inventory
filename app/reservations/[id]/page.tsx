'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Reservation } from '@/types'
import { toast } from 'sonner'

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    function update() {
      setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const isUrgent = secondsLeft < 60
  const isExpired = secondsLeft === 0
  const progress = Math.max(0, (secondsLeft / 600) * 100)

  return (
    <div style={{
      border: `1px solid ${isExpired ? 'var(--red)' : isUrgent ? '#f59e0b' : 'var(--border-bright)'}`,
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      background: isExpired ? 'rgba(239,68,68,0.05)' : isUrgent ? 'rgba(245,158,11,0.05)' : 'var(--bg-elevated)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {isExpired ? 'HOLD EXPIRED' : 'HOLD EXPIRES IN'}
        </span>
        <span className="mono" style={{
          fontSize: 32,
          fontWeight: 600,
          color: isExpired ? 'var(--red)' : isUrgent ? '#f59e0b' : 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--border)', borderRadius: 1 }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: isExpired ? 'var(--red)' : isUrgent ? '#f59e0b' : 'var(--accent)',
          borderRadius: 1,
          transition: 'width 1s linear',
        }} />
      </div>
    </div>
  )
}

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReservation = useCallback(async () => {
    const res = await fetch(`/api/reservations/${id}`)
    if (res.ok) setReservation(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { fetchReservation() }, [fetchReservation])

  async function handleConfirm() {
    setActionLoading(true)
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: 'POST' })
    if (res.status === 410) {
      toast.error('Hold expired — please reserve again.')
      await fetchReservation()
      setActionLoading(false)
      return
    }
    if (!res.ok) { toast.error('Could not confirm. Try again.'); setActionLoading(false); return }
    setReservation(await res.json())
    toast.success('Order confirmed!')
    setActionLoading(false)
  }

  async function handleCancel() {
    setActionLoading(true)
    const res = await fetch(`/api/reservations/${id}/release`, { method: 'POST' })
    if (!res.ok) { toast.error('Could not cancel.'); setActionLoading(false); return }
    setReservation(await res.json())
    toast('Hold released — stock returned.')
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ height: 400, background: 'var(--bg-card)', borderRadius: 'var(--radius)', animation: 'pulse 1.5s infinite' }} />
      </div>
    )
  }

  if (!reservation) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <p className="mono" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>RESERVATION NOT FOUND</p>
        <button onClick={() => router.push('/')} style={btnStyle('outline')}>← Back to catalogue</button>
      </div>
    )
  }

  const isPending = reservation.status === 'pending'
  const isConfirmed = reservation.status === 'confirmed'

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <button
        onClick={() => router.push('/')}
        className="mono"
        style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 32, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        ← CATALOGUE
      </button>

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-card)' }}>
        {/* Top bar */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            RESERVATION / {reservation.id.slice(-8).toUpperCase()}
          </span>
          <span className="mono" style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            padding: '3px 8px',
            borderRadius: 2,
            background: isPending ? 'rgba(249,115,22,0.15)' : isConfirmed ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
            color: isPending ? 'var(--accent)' : isConfirmed ? 'var(--green)' : 'var(--text-muted)',
            border: `1px solid ${isPending ? 'var(--accent-dim)' : isConfirmed ? '#166534' : 'var(--border)'}`,
          }}>
            {reservation.status.toUpperCase()}
          </span>
        </div>

        <div style={{ padding: 20 }}>
          {/* Product info */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
            {reservation.product.imageUrl && (
              <img
                src={reservation.product.imageUrl}
                alt={reservation.product.name}
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius)', filter: 'brightness(0.9) saturate(0.8)', flexShrink: 0 }}
              />
            )}
            <div>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{reservation.product.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{reservation.product.description}</p>
              <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>
                ₹{reservation.product.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'QTY', value: `${reservation.quantity} unit` },
              { label: 'STATUS', value: reservation.status.toUpperCase() },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                <p className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                <p className="mono" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Countdown */}
          {isPending && (
            <div style={{ marginBottom: 20 }}>
              <Countdown expiresAt={reservation.expiresAt} />
            </div>
          )}

          {/* Confirmed state */}
          {isConfirmed && (
            <div style={{
              marginBottom: 20, padding: '20px',
              border: '1px solid #166534',
              borderRadius: 'var(--radius)',
              background: 'rgba(34,197,94,0.05)',
              textAlign: 'center',
            }}>
              <p className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--green)', marginBottom: 6 }}>ORDER CONFIRMED</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your purchase is complete. Stock has been allocated.</p>
            </div>
          )}

          {/* Released state */}
          {reservation.status === 'released' && (
            <div style={{
              marginBottom: 20, padding: '20px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-elevated)',
              textAlign: 'center',
            }}>
              <p className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>HOLD RELEASED</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Stock has been returned to inventory.</p>
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="mono"
                style={{
                  flex: 1, padding: '12px',
                  background: actionLoading ? 'var(--accent-dim)' : 'var(--accent)',
                  color: '#000', border: 'none',
                  borderRadius: 'var(--radius)',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                {actionLoading ? 'PROCESSING...' : 'CONFIRM PURCHASE'}
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="mono"
                style={{
                  flex: 1, padding: '12px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                CANCEL HOLD
              </button>
            </div>
          )}

          {(isConfirmed || reservation.status === 'released') && (
            <button
              onClick={() => router.push('/')}
              className="mono"
              style={{
                width: '100%', padding: '12px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              ← BACK TO CATALOGUE
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function btnStyle(variant: 'outline' | 'primary'): React.CSSProperties {
  return {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    padding: '10px 20px',
    background: variant === 'primary' ? 'var(--accent)' : 'transparent',
    color: variant === 'primary' ? '#000' : 'var(--text-secondary)',
    border: variant === 'primary' ? 'none' : '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  }
}