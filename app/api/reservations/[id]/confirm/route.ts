import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const confirmed = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } })

      if (!reservation) {
        throw new Error('NOT_FOUND')
      }
      if (reservation.status !== 'pending') {
        throw new Error('NOT_PENDING')
      }
      if (new Date() > reservation.expiresAt) {
        // Also release the stock hold
        await tx.$executeRaw`
          UPDATE "Stock"
          SET reserved = reserved - ${reservation.quantity}
          WHERE "productId" = ${reservation.productId}
            AND "warehouseId" = ${reservation.warehouseId}
        `
        await tx.reservation.update({
          where: { id },
          data: { status: 'released' }
        })
        throw new Error('EXPIRED')
      }

      // Permanently decrement total stock (the units are sold)
      await tx.$executeRaw`
        UPDATE "Stock"
        SET
          total    = total    - ${reservation.quantity},
          reserved = reserved - ${reservation.quantity}
        WHERE "productId" = ${reservation.productId}
          AND "warehouseId" = ${reservation.warehouseId}
      `

      return tx.reservation.update({
        where: { id },
        data: { status: 'confirmed' },
        include: { product: true }
      })
    })

    return NextResponse.json(confirmed)
  } catch (error: any) {
    if (error.message === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Reservation has expired' },
        { status: 410 }
      )
    }
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }
    if (error.message === 'NOT_PENDING') {
      return NextResponse.json(
        { error: 'Reservation is no longer pending' },
        { status: 400 }
      )
    }
    console.error('Confirm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}