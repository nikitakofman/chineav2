import { createClient } from '@/utils/supabase/client'

const BUCKET_NAME = 'uploads'

export type FileUploadResult = {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export type FileCategory = 'items' | 'incidents' | 'documents'
export type EntityType = 'item' | 'incident' | 'user' | 'person' | 'book' | 'document'

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  category: FileCategory,
  userId: string,
  itemId?: string
): Promise<FileUploadResult> {
  try {
    const supabase = createClient()
    
    // Create unique filename with timestamp
    const timestamp = new Date().getTime()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    
    // Create file path: category/userId/fileName or category/userId/itemId/fileName
    const filePath = itemId 
      ? `${category}/${userId}/${itemId}/${fileName}`
      : `${category}/${userId}/${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  category: FileCategory,
  userId: string,
  itemId?: string
): Promise<FileUploadResult[]> {
  const uploads = files.map(file => uploadFile(file, category, userId, itemId))
  return Promise.all(uploads)
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get file type category
 */
export function getFileCategory(mimeType: string): 'image' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) {
    return 'image'
  }
  
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
  
  if (documentTypes.includes(mimeType)) {
    return 'document'
  }
  
  return 'other'
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File, 
  maxSizeMB: number = 10,
  allowedTypes?: string[]
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { 
      valid: false, 
      error: `File size must be less than ${maxSizeMB}MB` 
    }
  }
  
  // Check file type if specified
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type ${file.type} is not allowed` 
    }
  }
  
  return { valid: true }
}

/**
 * Common allowed file types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
]

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]

/**
 * Upload a document file for a specific entity using the centralized documents table
 */
export async function uploadEntityDocument(
  file: File,
  entityType: EntityType,
  entityId: string,
  userId: string,
  documentTypeId: string,
  title?: string,
  description?: string
): Promise<FileUploadResult & { documentId?: string }> {
  try {
    // First upload the file to storage
    const uploadResult = await uploadFile(file, 'documents', userId, entityId)
    
    if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
      return uploadResult
    }

    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma')
    
    // Save document metadata to centralized documents table
    const document = await prisma.documents.create({
      data: {
        document_type_id: documentTypeId,
        entity_type: entityType,
        entity_id: entityId,
        title: title || file.name,
        original_name: file.name,
        file_name: uploadResult.path?.split('/').pop() || file.name,
        file_path: uploadResult.path,
        file_size: BigInt(file.size),
        mime_type: file.type,
        storage_provider: 'supabase',
        storage_url: uploadResult.url,
        description
      }
    })

    return {
      ...uploadResult,
      documentId: document.id
    }
  } catch (error) {
    console.error('Document upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Upload multiple documents for a specific entity
 */
export async function uploadMultipleEntityDocuments(
  files: File[],
  entityType: EntityType,
  entityId: string,
  userId: string,
  documentTypeId: string,
  titles?: string[],
  descriptions?: string[]
): Promise<(FileUploadResult & { documentId?: string })[]> {
  const uploads = files.map((file, index) => 
    uploadEntityDocument(
      file, 
      entityType, 
      entityId, 
      userId, 
      documentTypeId,
      titles?.[index],
      descriptions?.[index]
    )
  )
  return Promise.all(uploads)
}

/**
 * Delete a document from both storage and database
 */
export async function deleteEntityDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Get document info first
    const document = await prisma.documents.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Delete file from storage if it exists
    if (document.file_path) {
      const deleteResult = await deleteFile(document.file_path)
      if (!deleteResult.success) {
        console.warn('Failed to delete file from storage:', deleteResult.error)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Soft delete the document record
    await prisma.documents.update({
      where: { id: documentId },
      data: {
        is_deleted: true,
        deleted_at: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Document deletion error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get documents for a specific entity
 */
export async function getEntityDocuments(entityType: EntityType, entityId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    return await prisma.documents.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        is_deleted: false
      },
      include: {
        document_type: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  } catch (error) {
    console.error('Error fetching entity documents:', error)
    return []
  }
}

/**
 * Image upload result with database record info
 */
export type ImageUploadResult = {
  success: boolean
  image?: {
    id: string
    url: string
    file_path: string
    file_name: string
    original_name: string
    file_size: number
    mime_type: string
    is_primary: boolean
    position: number
  }
  error?: string
}

/**
 * Get image type ID by name (item, incident, etc.)
 */
export async function getImageTypeId(typeName: string): Promise<string | null> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const imageType = await prisma.image_types.findUnique({
      where: { name: typeName }
    })
    return imageType?.id || null
  } catch (error) {
    console.error('Error getting image type:', error)
    return null
  }
}

/**
 * Upload image with centralized storage
 */
export async function uploadImageToCentralized(
  file: File,
  entityType: EntityType,
  entityId: string,
  userId: string,
  options: {
    isPrimary?: boolean
    title?: string
    altText?: string
  } = {}
): Promise<ImageUploadResult> {
  try {
    // First upload to storage
    const uploadResult = await uploadFile(file, entityType === 'item' ? 'items' : entityType === 'incident' ? 'incidents' : 'documents', userId, entityId)
    
    if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
      return { success: false, error: uploadResult.error || 'Upload failed' }
    }

    // Get image type ID
    const imageTypeId = await getImageTypeId(entityType)
    if (!imageTypeId) {
      return { success: false, error: `Image type '${entityType}' not found` }
    }

    // Save to centralized images table
    const { prisma } = await import('@/lib/prisma')
    
    // Get next position for this entity
    const highestPositionImage = await prisma.images.findFirst({
      where: { 
        entity_type: entityType,
        entity_id: entityId,
        is_deleted: false
      },
      orderBy: { position: 'desc' },
      select: { position: true }
    })
    const nextPosition = (highestPositionImage?.position ?? -1) + 1

    // If this is being set as primary, unset any existing primary image
    if (options.isPrimary) {
      await prisma.images.updateMany({
        where: {
          entity_type: entityType,
          entity_id: entityId,
          is_primary: true,
          is_deleted: false
        },
        data: { is_primary: false }
      })
    }

    const image = await prisma.images.create({
      data: {
        image_type_id: imageTypeId,
        entity_type: entityType,
        entity_id: entityId,
        title: options.title || null,
        original_name: file.name,
        file_name: uploadResult.path?.split('/').pop() || file.name,
        file_path: uploadResult.path,
        file_size: BigInt(file.size),
        mime_type: file.type,
        storage_provider: 'supabase',
        storage_url: uploadResult.url,
        alt_text: options.altText || null,
        is_primary: options.isPrimary || false,
        position: nextPosition
      }
    })

    return {
      success: true,
      image: {
        id: image.id,
        url: image.storage_url || uploadResult.url,
        file_path: image.file_path,
        file_name: image.file_name,
        original_name: image.original_name,
        file_size: Number(image.file_size),
        mime_type: image.mime_type || file.type,
        is_primary: image.is_primary,
        position: image.position || 0
      }
    }
  } catch (error) {
    console.error('Error uploading image to centralized system:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete image from centralized system
 */
export async function deleteImageFromCentralized(imageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Get the image record
    const image = await prisma.images.findUnique({
      where: { id: imageId, is_deleted: false }
    })

    if (!image) {
      return { success: false, error: 'Image not found' }
    }

    // Delete from storage
    const deleteResult = await deleteFile(image.file_path)
    if (!deleteResult.success) {
      console.error('Failed to delete from storage:', deleteResult.error)
      // Continue with soft delete even if storage deletion fails
    }

    // Soft delete from database
    await prisma.images.update({
      where: { id: imageId },
      data: { 
        is_deleted: true,
        deleted_at: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting image from centralized system:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get images for an entity
 */
export async function getImagesForEntity(
  entityType: EntityType,
  entityId: string,
  options: {
    includeDeleted?: boolean
    onlyPrimary?: boolean
  } = {}
) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const where: any = {
      entity_type: entityType,
      entity_id: entityId
    }

    if (!options.includeDeleted) {
      where.is_deleted = false
    }

    if (options.onlyPrimary) {
      where.is_primary = true
    }

    return await prisma.images.findMany({
      where,
      include: {
        image_type: true
      },
      orderBy: [
        { is_primary: 'desc' },
        { position: 'asc' },
        { created_at: 'asc' }
      ]
    })
  } catch (error) {
    console.error('Error getting images for entity:', error)
    return []
  }
}

/**
 * Update image position/ordering
 */
export async function updateImagePositions(
  imagePositions: Array<{ imageId: string; position: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    await prisma.$transaction(
      imagePositions.map(({ imageId, position }) =>
        prisma.images.update({
          where: { id: imageId, is_deleted: false },
          data: { position }
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error('Error updating image positions:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}