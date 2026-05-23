import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params


  try {
    const released = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } })

      if (!reservation) throw new Error('NOT_FOUND')
      if (reservation.status !== 'pending') throw new Error('NOT_PENDING')

      // Give the stock back
      await tx.$executeRaw`
        UPDATE "Stock"
        SET reserved = reserved - ${reservation.quantity}
        WHERE "productId" = ${reservation.productId}
          AND "warehouseId" = ${reservation.warehouseId}
      `

      return tx.reservation.update({
        where: { id },
        data: { status: 'released' },
        include: { product: true }
      })
    })

    return NextResponse.json(released)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (error.message === 'NOT_PENDING') {
      return NextResponse.json(
        { error: 'Reservation already completed or released' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}