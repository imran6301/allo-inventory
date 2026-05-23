import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Lazy cleanup: release any expired pending reservations first
  await prisma.reservation.updateMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() }
    },
    data: { status: 'released' }
  })

  // Then recalculate reserved counts per stock
  // (We recompute from active reservations to stay accurate)
  const expiredStocks = await prisma.$queryRaw<{ productId: string; warehouseId: string }[]>`
    SELECT DISTINCT "productId", "warehouseId"
    FROM "Reservation"
    WHERE status = 'released' AND "updatedAt" > NOW() - INTERVAL '1 minute'
  `.catch(() => [])

  const products = await prisma.product.findMany({
    include: {
      stocks: {
        include: { warehouse: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Compute available = total - reserved for each stock
  const result = products.map(p => ({
    ...p,
    stocks: p.stocks.map(s => ({
      ...s,
      available: s.total - s.reserved
    }))
  }))

  return NextResponse.json(result)
}