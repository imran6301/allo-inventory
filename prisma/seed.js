const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.reservation.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.product.deleteMany()
  await prisma.warehouse.deleteMany()

  const w1 = await prisma.warehouse.create({ data: { name: 'Mumbai Central', location: 'Mumbai, MH' } })
  const w2 = await prisma.warehouse.create({ data: { name: 'Delhi North', location: 'Delhi, DL' } })
  const w3 = await prisma.warehouse.create({ data: { name: 'Bangalore Hub', location: 'Bangalore, KA' } })

  const p1 = await prisma.product.create({ data: { name: 'Wireless Noise-Cancelling Headphones', description: 'Premium audio with 30hr battery life', price: 8999, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' } })
  const p2 = await prisma.product.create({ data: { name: 'Mechanical Keyboard', description: 'TKL layout, Cherry MX switches', price: 5499, imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400' } })
const p3 = await prisma.product.create({
  data: {
    name: 'SONY Headphones',
    description: 'Deep bass. Zero distractions.',
    price: 2999,
   imageUrl:'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1200&auto=format&fit=crop'
  }
})

  const stockData = [
    { productId: p1.id, warehouseId: w1.id, total: 3 },
    { productId: p1.id, warehouseId: w2.id, total: 1 },
    { productId: p1.id, warehouseId: w3.id, total: 5 },
    { productId: p2.id, warehouseId: w1.id, total: 2 },
    { productId: p2.id, warehouseId: w2.id, total: 4 },
    { productId: p3.id, warehouseId: w1.id, total: 1 },
    { productId: p3.id, warehouseId: w3.id, total: 6 },
  ]

  for (const s of stockData) {
    await prisma.stock.create({ data: s })
  }

  console.log('✅ Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())