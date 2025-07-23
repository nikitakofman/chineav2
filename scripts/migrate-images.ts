import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Migration script to move existing images from separate tables to centralized images table
 * 
 * This script will:
 * 1. Ensure image_types exist for 'item' and 'incident'
 * 2. Migrate item_images to the centralized images table
 * 3. Migrate incident_images to the centralized images table
 * 4. Preserve all existing metadata and relationships
 */

async function ensureImageTypes() {
  console.log('🔍 Ensuring image types exist...')
  
  // Create 'item' image type if it doesn't exist
  const itemType = await prisma.image_types.upsert({
    where: { name: 'item' },
    update: {},
    create: {
      name: 'item',
      description: 'Images associated with inventory items'
    }
  })
  
  // Create 'incident' image type if it doesn't exist
  const incidentType = await prisma.image_types.upsert({
    where: { name: 'incident' },
    update: {},
    create: {
      name: 'incident',
      description: 'Images associated with item incidents'
    }
  })
  
  console.log('✅ Image types ensured:', { itemTypeId: itemType.id, incidentTypeId: incidentType.id })
  return { itemTypeId: itemType.id, incidentTypeId: incidentType.id }
}

async function migrateItemImages(itemTypeId: string) {
  console.log('🔄 Migrating item images...')
  
  const itemImages = await prisma.item_images.findMany({
    orderBy: { created_at: 'asc' }
  })
  
  console.log(`Found ${itemImages.length} item images to migrate`)
  
  let migratedCount = 0
  let errorCount = 0
  
  for (const itemImage of itemImages) {
    try {
      // Check if this image was already migrated
      const existingImage = await prisma.images.findFirst({
        where: {
          entity_type: 'item',
          entity_id: itemImage.item_id,
          file_path: itemImage.file_path
        }
      })
      
      if (existingImage) {
        console.log(`⏭️  Skipping already migrated image: ${itemImage.id}`)
        continue
      }
      
      await prisma.images.create({
        data: {
          image_type_id: itemTypeId,
          entity_type: 'item',
          entity_id: itemImage.item_id,
          title: null,
          original_name: itemImage.file_name,
          file_name: itemImage.file_name,
          file_path: itemImage.file_path,
          file_size: itemImage.file_size ? BigInt(itemImage.file_size) : null,
          mime_type: itemImage.mime_type,
          storage_provider: 'supabase',
          storage_url: itemImage.url,
          width: null,
          height: null,
          alt_text: null,
          is_primary: itemImage.is_primary || false,
          position: itemImage.position || 0,
          is_deleted: false,
          deleted_at: null,
          created_at: itemImage.created_at,
          updated_at: itemImage.updated_at
        }
      })
      
      migratedCount++
      console.log(`✅ Migrated item image ${migratedCount}/${itemImages.length}: ${itemImage.id}`)
      
    } catch (error) {
      errorCount++
      console.error(`❌ Error migrating item image ${itemImage.id}:`, error)
    }
  }
  
  console.log(`📊 Item images migration complete: ${migratedCount} migrated, ${errorCount} errors`)
  return { migratedCount, errorCount }
}

async function migrateIncidentImages(incidentTypeId: string) {
  console.log('🔄 Migrating incident images...')
  
  const incidentImages = await prisma.incident_images.findMany({
    orderBy: { created_at: 'asc' }
  })
  
  console.log(`Found ${incidentImages.length} incident images to migrate`)
  
  let migratedCount = 0
  let errorCount = 0
  
  for (const incidentImage of incidentImages) {
    try {
      // Check if this image was already migrated
      const existingImage = await prisma.images.findFirst({
        where: {
          entity_type: 'incident',
          entity_id: incidentImage.incident_id,
          file_path: incidentImage.file_path
        }
      })
      
      if (existingImage) {
        console.log(`⏭️  Skipping already migrated image: ${incidentImage.id}`)
        continue
      }
      
      await prisma.images.create({
        data: {
          image_type_id: incidentTypeId,
          entity_type: 'incident',
          entity_id: incidentImage.incident_id,
          title: null,
          original_name: incidentImage.file_name,
          file_name: incidentImage.file_name,
          file_path: incidentImage.file_path,
          file_size: incidentImage.file_size ? BigInt(incidentImage.file_size) : null,
          mime_type: incidentImage.mime_type,
          storage_provider: 'supabase',
          storage_url: incidentImage.url,
          width: null,
          height: null,
          alt_text: null,
          is_primary: false, // Incidents don't have primary images
          position: 0,
          is_deleted: false,
          deleted_at: null,
          created_at: incidentImage.created_at,
          updated_at: incidentImage.updated_at
        }
      })
      
      migratedCount++
      console.log(`✅ Migrated incident image ${migratedCount}/${incidentImages.length}: ${incidentImage.id}`)
      
    } catch (error) {
      errorCount++
      console.error(`❌ Error migrating incident image ${incidentImage.id}:`, error)
    }
  }
  
  console.log(`📊 Incident images migration complete: ${migratedCount} migrated, ${errorCount} errors`)
  return { migratedCount, errorCount }
}

async function validateMigration() {
  console.log('🔍 Validating migration...')
  
  const itemImagesCount = await prisma.item_images.count()
  const incidentImagesCount = await prisma.incident_images.count()
  
  const migratedItemImages = await prisma.images.count({
    where: { entity_type: 'item' }
  })
  
  const migratedIncidentImages = await prisma.images.count({
    where: { entity_type: 'incident' }
  })
  
  console.log('📊 Migration validation:')
  console.log(`  - Original item images: ${itemImagesCount}`)
  console.log(`  - Migrated item images: ${migratedItemImages}`)
  console.log(`  - Original incident images: ${incidentImagesCount}`)
  console.log(`  - Migrated incident images: ${migratedIncidentImages}`)
  
  const allMigrated = (migratedItemImages >= itemImagesCount) && (migratedIncidentImages >= incidentImagesCount)
  
  if (allMigrated) {
    console.log('✅ Migration validation successful!')
  } else {
    console.log('⚠️  Migration validation shows some images may not have been migrated')
  }
  
  return allMigrated
}

async function main() {
  try {
    console.log('🚀 Starting image migration...')
    console.log('⚠️  This script will migrate existing images to the new centralized structure')
    console.log('⚠️  Make sure you have a database backup before proceeding!')
    
    // Ensure image types exist
    const { itemTypeId, incidentTypeId } = await ensureImageTypes()
    
    // Migrate item images
    const itemResults = await migrateItemImages(itemTypeId)
    
    // Migrate incident images
    const incidentResults = await migrateIncidentImages(incidentTypeId)
    
    // Validate migration
    const isValid = await validateMigration()
    
    console.log('🎉 Migration completed!')
    console.log(`📊 Summary:`)
    console.log(`  - Item images: ${itemResults.migratedCount} migrated, ${itemResults.errorCount} errors`)
    console.log(`  - Incident images: ${incidentResults.migratedCount} migrated, ${incidentResults.errorCount} errors`)
    console.log(`  - Validation: ${isValid ? 'PASSED' : 'FAILED'}`)
    
    if (!isValid) {
      console.log('⚠️  Please review the errors above and run the script again if needed')
      process.exit(1)
    }
    
    console.log('')
    console.log('✅ Migration successful! You can now:')
    console.log('   1. Update your application code to use the new centralized images system')
    console.log('   2. Test that everything works correctly')
    console.log('   3. Consider dropping the old image tables after thorough testing')
    console.log('')
    console.log('⚠️  Do NOT drop the old tables until you are confident the migration worked correctly!')
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Allow running as a script
if (require.main === module) {
  main()
}

export { main as migrateImages }