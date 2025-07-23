import { uploadMultipleFiles } from './storage'
import { FileUploadItem } from '@/components/ui/file-upload'

export interface CentralizedImageData {
  imageTypeId: string
  entityType: string
  entityId: string
  url: string
  filePath: string
  originalName: string
  fileName: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  altText?: string
  isPrimary?: boolean
  position?: number
  title?: string
}

export interface CentralizedDocumentData {
  documentTypeId: string
  entityType: string
  entityId: string
  url: string
  filePath: string
  originalName: string
  fileName: string
  fileSize: number
  mimeType: string
  title?: string
  description?: string
  issuedBy?: string
  issuedDate?: Date
  documentNumber?: string
  expiryDate?: Date
}

/**
 * Upload images to centralized storage system
 */
export async function uploadCentralizedImages(
  files: FileUploadItem[],
  imageTypeId: string,
  entityType: string,
  entityId: string,
  userId: string,
  storageCategory: 'items' | 'incidents' | 'documents' = 'items'
): Promise<{ success: boolean; images?: any[]; error?: string }> {
  try {
    // Upload files to storage
    const uploadResults = await uploadMultipleFiles(
      files.map(f => f.file),
      storageCategory,
      userId,
      entityId
    )

    const images = []

    // Save image records to centralized database
    for (let i = 0; i < uploadResults.length; i++) {
      const upload = uploadResults[i]
      const file = files[i]

      if (upload.success && upload.url && upload.path) {
        const imageData: CentralizedImageData = {
          imageTypeId,
          entityType,
          entityId,
          url: upload.url,
          filePath: upload.path,
          originalName: file.file.name,
          fileName: file.file.name,
          fileSize: file.file.size,
          mimeType: file.file.type,
          isPrimary: i === 0, // First image is primary
          position: i
        }

        const response = await fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imageData)
        })

        if (response.ok) {
          const result = await response.json()
          images.push(result.image)
        } else {
          console.error('Failed to save image metadata:', await response.text())
        }
      }
    }

    return { success: true, images }
  } catch (error) {
    console.error('Error uploading centralized images:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Upload documents to centralized storage system
 */
export async function uploadCentralizedDocuments(
  files: FileUploadItem[],
  documentTypeId: string,
  entityType: string,
  entityId: string,
  userId: string,
  storageCategory: 'items' | 'incidents' | 'documents' = 'items'
): Promise<{ success: boolean; documents?: any[]; error?: string }> {
  try {
    // Upload files to storage
    const uploadResults = await uploadMultipleFiles(
      files.map(f => f.file),
      storageCategory,
      userId,
      entityId
    )

    const documents = []

    // Save document records to centralized database
    for (let i = 0; i < uploadResults.length; i++) {
      const upload = uploadResults[i]
      const file = files[i]

      if (upload.success && upload.url && upload.path) {
        const documentData: CentralizedDocumentData = {
          documentTypeId,
          entityType,
          entityId,
          url: upload.url,
          filePath: upload.path,
          originalName: file.file.name,
          fileName: file.file.name,
          fileSize: file.file.size,
          mimeType: file.file.type,
          title: file.file.name
        }

        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(documentData)
        })

        if (response.ok) {
          const result = await response.json()
          documents.push(result.document)
        } else {
          console.error('Failed to save document metadata:', await response.text())
        }
      }
    }

    return { success: true, documents }
  } catch (error) {
    console.error('Error uploading centralized documents:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get image type ID by name, creating if it doesn't exist
 */
export async function getOrCreateImageType(name: string): Promise<string | null> {
  try {
    // Try to get existing image type
    let response = await fetch(`/api/image-types?name=${encodeURIComponent(name)}`)
    
    if (response.ok) {
      const data = await response.json()
      return data.imageType.id
    }

    // Create new image type if it doesn't exist
    response = await fetch('/api/image-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })

    if (response.ok) {
      const data = await response.json()
      return data.imageType.id
    }

    return null
  } catch (error) {
    console.error('Error getting or creating image type:', error)
    return null
  }
}

/**
 * Get document type ID by name, creating if it doesn't exist
 */
export async function getOrCreateDocumentType(name: string): Promise<string | null> {
  try {
    // Try to get existing document type
    let response = await fetch(`/api/document-types?name=${encodeURIComponent(name)}`)
    
    if (response.ok) {
      const data = await response.json()
      return data.documentType.id
    }

    // Create new document type if it doesn't exist
    response = await fetch('/api/document-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })

    if (response.ok) {
      const data = await response.json()
      return data.documentType.id
    }

    return null
  } catch (error) {
    console.error('Error getting or creating document type:', error)
    return null
  }
}

/**
 * Delete image from centralized system
 */
export async function deleteCentralizedImage(imageId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/images?imageId=${imageId}`, {
      method: 'DELETE'
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting centralized image:', error)
    return false
  }
}

/**
 * Delete document from centralized system
 */
export async function deleteCentralizedDocument(documentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/documents?documentId=${documentId}`, {
      method: 'DELETE'
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting centralized document:', error)
    return false
  }
}

/**
 * Reorder images in centralized system
 */
export async function reorderCentralizedImages(imagePositions: Array<{ imageId: string; position: number }>): Promise<boolean> {
  try {
    const response = await fetch('/api/images', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePositions })
    })

    return response.ok
  } catch (error) {
    console.error('Error reordering centralized images:', error)
    return false
  }
}