import { AccessControlService, EntityType as AccessEntityType } from './access-control'
import { ValidationService } from './validation'
import { SerializationService } from './serialization'
import {
  uploadFile,
  deleteFile,
  uploadImageToCentralized,
  deleteImageFromCentralized,
  uploadEntityDocument,
  deleteEntityDocument,
  getImagesForEntity,
  getEntityDocuments,
  validateFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  FileCategory,
  EntityType
} from '@/lib/storage'
import { prisma } from '@/lib/prisma'

export interface FileUploadOptions {
  checkAccessControl?: boolean
  validateFile?: boolean
  maxSizeMB?: number
  allowedTypes?: string[]
  isPrimary?: boolean
  title?: string
  altText?: string
  description?: string
}

export interface FileServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: string[]
}

export interface ImageData {
  id: string
  url: string
  file_path: string
  file_name: string
  original_name: string
  file_size: number
  mime_type: string
  is_primary: boolean
  position: number
  title?: string
  alt_text?: string
}

export interface DocumentData {
  id: string
  url: string
  file_path: string
  file_name: string
  original_name: string
  file_size: bigint
  mime_type: string
  title: string
  description?: string
  document_type: {
    id: string
    name: string
  }
}

/**
 * FileService - Centralized file management service
 * 
 * This service provides:
 * - Unified file upload/download operations
 * - Access control for file operations
 * - File validation
 * - Integration with storage system
 */
export class FileService {
  /**
   * Upload an image for an entity
   */
  static async uploadImage(
    file: File,
    entityType: EntityType,
    entityId: string,
    options: FileUploadOptions = {}
  ): Promise<FileServiceResult<ImageData>> {
    try {
      // Check access control
      if (options.checkAccessControl !== false) {
        const accessCheck = await AccessControlService.checkEntityOwnership(
          entityType as AccessEntityType,
          entityId
        )
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Validate file
      if (options.validateFile !== false) {
        const validation = validateFile(
          file,
          options.maxSizeMB || 10,
          options.allowedTypes || ALLOWED_IMAGE_TYPES
        )
        
        if (!validation.valid) {
          return {
            success: false,
            validationErrors: [validation.error || 'Invalid file']
          }
        }
      }
      
      // Get user ID
      const userId = await AccessControlService.getCurrentUserId()
      if (!userId) {
        return {
          success: false,
          error: 'User not authenticated'
        }
      }
      
      // Upload image
      const uploadResult = await uploadImageToCentralized(
        file,
        entityType,
        entityId,
        userId,
        {
          isPrimary: options.isPrimary,
          title: options.title,
          altText: options.altText
        }
      )
      
      if (!uploadResult.success || !uploadResult.image) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload image'
        }
      }
      
      // Serialize and return
      const serializedImage = SerializationService.serialize<ImageData>(uploadResult.image)
      
      return {
        success: true,
        data: serializedImage
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image'
      }
    }
  }

  /**
   * Upload multiple images for an entity
   */
  static async uploadImages(
    files: File[],
    entityType: EntityType,
    entityId: string,
    options: FileUploadOptions = {}
  ): Promise<FileServiceResult<ImageData[]>> {
    const results: ImageData[] = []
    const errors: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isPrimary = i === 0 && options.isPrimary // Only first image can be primary
      
      const result = await this.uploadImage(
        file,
        entityType,
        entityId,
        { ...options, isPrimary }
      )
      
      if (result.success && result.data) {
        results.push(result.data)
      } else {
        errors.push(`${file.name}: ${result.error || 'Upload failed'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      data: results,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Delete an image
   */
  static async deleteImage(
    imageId: string,
    options: { checkAccessControl?: boolean } = {}
  ): Promise<FileServiceResult> {
    try {
      // Get image details to check ownership
      if (options.checkAccessControl !== false) {
        const image = await prisma.images.findUnique({
          where: { id: imageId }
        })
        
        if (!image) {
          return {
            success: false,
            error: 'Image not found'
          }
        }
        
        const accessCheck = await AccessControlService.checkEntityOwnership(
          image.entity_type as AccessEntityType,
          image.entity_id
        )
        
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Delete image
      const result = await deleteImageFromCentralized(imageId)
      
      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      console.error('Failed to delete image:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image'
      }
    }
  }

  /**
   * Upload a document for an entity
   */
  static async uploadDocument(
    file: File,
    entityType: EntityType,
    entityId: string,
    documentTypeId: string,
    options: FileUploadOptions = {}
  ): Promise<FileServiceResult<DocumentData>> {
    try {
      // Check access control
      if (options.checkAccessControl !== false) {
        const accessCheck = await AccessControlService.checkEntityOwnership(
          entityType as AccessEntityType,
          entityId
        )
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Validate file
      if (options.validateFile !== false) {
        const validation = validateFile(
          file,
          options.maxSizeMB || 50,
          options.allowedTypes || ALLOWED_DOCUMENT_TYPES
        )
        
        if (!validation.valid) {
          return {
            success: false,
            validationErrors: [validation.error || 'Invalid file']
          }
        }
      }
      
      // Get user ID
      const userId = await AccessControlService.getCurrentUserId()
      if (!userId) {
        return {
          success: false,
          error: 'User not authenticated'
        }
      }
      
      // Upload document
      const uploadResult = await uploadEntityDocument(
        file,
        entityType,
        entityId,
        userId,
        documentTypeId,
        options.title || file.name,
        options.description
      )
      
      if (!uploadResult.success || !uploadResult.documentId) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload document'
        }
      }
      
      // Get the created document with type info
      const document = await prisma.documents.findUnique({
        where: { id: uploadResult.documentId },
        include: {
          document_type: true
        }
      })
      
      if (!document) {
        return {
          success: false,
          error: 'Document created but not found'
        }
      }
      
      // Serialize and return
      const serializedDocument = SerializationService.serialize<DocumentData>({
        id: document.id,
        url: document.storage_url || '',
        file_path: document.file_path,
        file_name: document.file_name,
        original_name: document.original_name,
        file_size: document.file_size,
        mime_type: document.mime_type || '',
        title: document.title,
        description: document.description || undefined,
        document_type: document.document_type
      })
      
      return {
        success: true,
        data: serializedDocument
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document'
      }
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(
    documentId: string,
    options: { checkAccessControl?: boolean } = {}
  ): Promise<FileServiceResult> {
    try {
      // Get document details to check ownership
      if (options.checkAccessControl !== false) {
        const document = await prisma.documents.findUnique({
          where: { id: documentId }
        })
        
        if (!document) {
          return {
            success: false,
            error: 'Document not found'
          }
        }
        
        const accessCheck = await AccessControlService.checkEntityOwnership(
          document.entity_type as AccessEntityType,
          document.entity_id
        )
        
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Delete document
      const result = await deleteEntityDocument(documentId)
      
      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document'
      }
    }
  }

  /**
   * Get images for an entity
   */
  static async getImages(
    entityType: EntityType,
    entityId: string,
    options: { checkAccessControl?: boolean; onlyPrimary?: boolean } = {}
  ): Promise<FileServiceResult<ImageData[]>> {
    try {
      // Check access control
      if (options.checkAccessControl !== false) {
        const accessCheck = await AccessControlService.checkEntityOwnership(
          entityType as AccessEntityType,
          entityId
        )
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Get images
      const images = await getImagesForEntity(entityType, entityId, {
        onlyPrimary: options.onlyPrimary
      })
      
      // Serialize and return
      const serializedImages = images.map(image => 
        SerializationService.serialize<ImageData>({
          id: image.id,
          url: image.storage_url || image.file_path,
          file_path: image.file_path,
          file_name: image.file_name,
          original_name: image.original_name,
          file_size: Number(image.file_size || 0),
          mime_type: image.mime_type || '',
          is_primary: image.is_primary,
          position: image.position || 0,
          title: image.title || undefined,
          alt_text: image.alt_text || undefined
        })
      )
      
      return {
        success: true,
        data: serializedImages
      }
    } catch (error) {
      console.error('Failed to get images:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get images'
      }
    }
  }

  /**
   * Get documents for an entity
   */
  static async getDocuments(
    entityType: EntityType,
    entityId: string,
    options: { checkAccessControl?: boolean } = {}
  ): Promise<FileServiceResult<DocumentData[]>> {
    try {
      // Check access control
      if (options.checkAccessControl !== false) {
        const accessCheck = await AccessControlService.checkEntityOwnership(
          entityType as AccessEntityType,
          entityId
        )
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Get documents
      const documents = await getEntityDocuments(entityType, entityId)
      
      // Serialize and return
      const serializedDocuments = documents.map(doc => 
        SerializationService.serialize<DocumentData>({
          id: doc.id,
          url: doc.storage_url || '',
          file_path: doc.file_path,
          file_name: doc.file_name,
          original_name: doc.original_name,
          file_size: doc.file_size,
          mime_type: doc.mime_type || '',
          title: doc.title,
          description: doc.description || undefined,
          document_type: doc.document_type
        })
      )
      
      return {
        success: true,
        data: serializedDocuments
      }
    } catch (error) {
      console.error('Failed to get documents:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get documents'
      }
    }
  }

  /**
   * Get file download URL with access control
   */
  static async getFileUrl(
    fileType: 'image' | 'document',
    fileId: string,
    options: { checkAccessControl?: boolean } = {}
  ): Promise<FileServiceResult<string>> {
    try {
      let entityType: string
      let entityId: string
      let url: string | null = null
      
      if (fileType === 'image') {
        const image = await prisma.images.findUnique({
          where: { id: fileId }
        })
        
        if (!image) {
          return {
            success: false,
            error: 'Image not found'
          }
        }
        
        entityType = image.entity_type
        entityId = image.entity_id
        url = image.storage_url
      } else {
        const document = await prisma.documents.findUnique({
          where: { id: fileId }
        })
        
        if (!document) {
          return {
            success: false,
            error: 'Document not found'
          }
        }
        
        entityType = document.entity_type
        entityId = document.entity_id
        url = document.storage_url
      }
      
      // Check access control
      if (options.checkAccessControl !== false) {
        const accessCheck = await AccessControlService.checkEntityOwnership(
          entityType as AccessEntityType,
          entityId
        )
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      if (!url) {
        return {
          success: false,
          error: 'File URL not available'
        }
      }
      
      return {
        success: true,
        data: url
      }
    } catch (error) {
      console.error('Failed to get file URL:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file URL'
      }
    }
  }

  /**
   * Update image metadata
   */
  static async updateImage(
    imageId: string,
    data: {
      title?: string
      alt_text?: string
      is_primary?: boolean
      position?: number
    },
    options: { checkAccessControl?: boolean } = {}
  ): Promise<FileServiceResult<ImageData>> {
    try {
      // Get image details to check ownership
      const image = await prisma.images.findUnique({
        where: { id: imageId }
      })
      
      if (!image) {
        return {
          success: false,
          error: 'Image not found'
        }
      }
      
      // Check access control
      if (options.checkAccessControl !== false) {
        const accessCheck = await AccessControlService.checkEntityOwnership(
          image.entity_type as AccessEntityType,
          image.entity_id
        )
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // If setting as primary, unset other primary images
      if (data.is_primary) {
        await prisma.images.updateMany({
          where: {
            entity_type: image.entity_type,
            entity_id: image.entity_id,
            is_primary: true,
            id: { not: imageId }
          },
          data: { is_primary: false }
        })
      }
      
      // Update image
      const updatedImage = await prisma.images.update({
        where: { id: imageId },
        data: {
          ...data,
          updated_at: new Date()
        }
      })
      
      // Serialize and return
      const serializedImage = SerializationService.serialize<ImageData>({
        id: updatedImage.id,
        url: updatedImage.storage_url || updatedImage.file_path,
        file_path: updatedImage.file_path,
        file_name: updatedImage.file_name,
        original_name: updatedImage.original_name,
        file_size: Number(updatedImage.file_size || 0),
        mime_type: updatedImage.mime_type || '',
        is_primary: updatedImage.is_primary,
        position: updatedImage.position || 0,
        title: updatedImage.title || undefined,
        alt_text: updatedImage.alt_text || undefined
      })
      
      return {
        success: true,
        data: serializedImage
      }
    } catch (error) {
      console.error('Failed to update image:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update image'
      }
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(
    documentId: string,
    data: {
      title?: string
      description?: string
    },
    options: { checkAccessControl?: boolean } = {}
  ): Promise<FileServiceResult<DocumentData>> {
    try {
      // Get document details to check ownership
      const document = await prisma.documents.findUnique({
        where: { id: documentId },
        include: { document_type: true }
      })
      
      if (!document) {
        return {
          success: false,
          error: 'Document not found'
        }
      }
      
      // Check access control
      if (options.checkAccessControl !== false) {
        const accessCheck = await AccessControlService.checkEntityOwnership(
          document.entity_type as AccessEntityType,
          document.entity_id
        )
        if (!accessCheck.isOwner) {
          return {
            success: false,
            error: accessCheck.error || 'Access denied'
          }
        }
      }
      
      // Update document
      const updatedDocument = await prisma.documents.update({
        where: { id: documentId },
        data: {
          ...data,
          updated_at: new Date()
        },
        include: { document_type: true }
      })
      
      // Serialize and return
      const serializedDocument = SerializationService.serialize<DocumentData>({
        id: updatedDocument.id,
        url: updatedDocument.storage_url || '',
        file_path: updatedDocument.file_path,
        file_name: updatedDocument.file_name,
        original_name: updatedDocument.original_name,
        file_size: updatedDocument.file_size,
        mime_type: updatedDocument.mime_type || '',
        title: updatedDocument.title,
        description: updatedDocument.description || undefined,
        document_type: updatedDocument.document_type
      })
      
      return {
        success: true,
        data: serializedDocument
      }
    } catch (error) {
      console.error('Failed to update document:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update document'
      }
    }
  }
}