import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTypes() {
  console.log('🌱 Seeding document and image types...')

  try {
    // Insert document types
    const documentTypes = [
      'export_permit',
      'appraisal_report', 
      'authenticity_certificate',
      'sale_certificate',
      'item',
      'incident',
      'user',
      'person'
    ]

    for (const typeName of documentTypes) {
      await prisma.document_types.upsert({
        where: { name: typeName },
        update: {},
        create: { name: typeName }
      })
      console.log(`✅ Document type "${typeName}" created/updated`)
    }

    // Insert image types
    const imageTypes = [
      'item',
      'incident', 
      'profile',
      'document_preview',
      'user',
      'person'
    ]

    for (const typeName of imageTypes) {
      await prisma.image_types.upsert({
        where: { name: typeName },
        update: {},
        create: { name: typeName }
      })
      console.log(`✅ Image type "${typeName}" created/updated`)
    }

    console.log('🎉 Successfully seeded all types!')

  } catch (error) {
    console.error('❌ Error seeding types:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTypes()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })