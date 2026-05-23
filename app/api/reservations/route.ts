import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ReserveSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int().positive()
})

export async function POST(request: Request) {
  // --- Idempotency (bonus) ---
  const idempotencyKey = request.headers.get('Idempotency-Key')
  if (idempotencyKey) {
    const existing = await prisma.reservation.findUnique({
      where: { idempotencyKey },
      include: { product: true }
    })
    if (existing) {
      return NextResponse.json(existing) // return cached result
    }
  }

  // --- Validate body ---
  const body = await request.json().catch(() => null)
  const parsed = ReserveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { productId, warehouseId, quantity } = parsed.data

  try {
    // --- CONCURRENCY-SAFE RESERVATION using FOR UPDATE ---
    const reservation = await prisma.$transaction(async (tx) => {
      // Lock the specific stock row — no other transaction can read/write it until we're done
      const stocks = await tx.$queryRaw<Array<{
        id: string; total: number; reserved: number
      }>>`
        SELECT id, total, reserved
        FROM "Stock"
        WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
        FOR UPDATE
      `

      if (!stocks.length) {
        throw new Error('STOCK_NOT_FOUND')
      }

      const stock = stocks[0]
      const available = stock.total - stock.reserved

      if (available < quantity) {
        throw new Error('INSUFFICIENT_STOCK')
      }

      // Increment reserved
      await tx.$executeRaw`
        UPDATE "Stock"
        SET reserved = reserved + ${quantity}
        WHERE id = ${stock.id}
      `

      // Create reservation (expires in 10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      const newReservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: 'pending',
          expiresAt,
          ...(idempotencyKey ? { idempotencyKey } : {})
        },
        include: { product: true }
      })

      return newReservation
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json(
        { error: 'Not enough stock available' },
        { status: 409 }
      )
    }
    if (error.message === 'STOCK_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Product/warehouse combination not found' },
        { status: 404 }
      )
    }
    console.error('Reservation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}