import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed person types
  const personTypes = [
    { name: 'expert' },
    { name: 'client' },
    { name: 'seller' }
  ]

  for (const type of personTypes) {
    const existing = await prisma.person_type.findFirst({
      where: { name: type.name }
    })
    
    if (!existing) {
      await prisma.person_type.create({
        data: type
      })
    }
  }

  console.log('Person types seeded successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })