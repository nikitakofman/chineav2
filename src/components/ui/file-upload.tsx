'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Upload, X, Image as ImageIcon, FileText, File } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize, getFileCategory, validateFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '@/lib/storage'

export interface FileUploadItem {
  file: File
  preview?: string
  id: string
}

interface FileUploadProps {
  onFilesChange: (files: FileUploadItem[]) => void
  accept?: string
  maxFiles?: number
  maxSizeMB?: number
  allowImages?: boolean
  allowDocuments?: boolean
  className?: string
  disabled?: boolean
}

export function FileUpload({
  onFilesChange,
  accept,
  maxFiles = 10,
  maxSizeMB = 10,
  allowImages = true,
  allowDocuments = true,
  className,
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine accepted file types
  const getAcceptedTypes = () => {
    if (accept) return accept
    
    const types: string[] = []
    if (allowImages) types.push(...ALLOWED_IMAGE_TYPES)
    if (allowDocuments) types.push(...ALLOWED_DOCUMENT_TYPES)
    
    return types.join(',')
  }

  const processFiles = async (fileList: FileList) => {
    const newFiles: FileUploadItem[] = []
    
    for (let i = 0; i < Math.min(fileList.length, maxFiles - files.length); i++) {
      const file = fileList[i]
      
      // Validate file
      const allowedTypes = []
      if (allowImages) allowedTypes.push(...ALLOWED_IMAGE_TYPES)
      if (allowDocuments) allowedTypes.push(...ALLOWED_DOCUMENT_TYPES)
      
      const validation = validateFile(file, maxSizeMB, allowedTypes)
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`)
        continue
      }
      
      const fileItem: FileUploadItem = {
        file,
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        try {
          const preview = await createImagePreview(file)
          fileItem.preview = preview
        } catch (error) {
          console.error('Error creating preview:', error)
        }
      }
      
      newFiles.push(fileItem)
    }
    
    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(item => item.id !== fileId)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file.type)
    switch (category) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const canAddMore = files.length < maxFiles

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card 
        className={cn(
          'border-2 border-dashed transition-colors',
          isDragOver && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Upload className={cn(
            'h-10 w-10 mb-4 text-muted-foreground',
            isDragOver && 'text-primary'
          )} />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {allowImages && allowDocuments && 'Images and documents supported'}
              {allowImages && !allowDocuments && 'Images only'}
              {!allowImages && allowDocuments && 'Documents only'}
              {' '}(max {formatFileSize(maxSizeMB * 1024 * 1024)})
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || !canAddMore}
          >
            Select Files ({files.length}/{maxFiles})
          </Button>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedTypes()}
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
          <div className="space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                      {getFileIcon(fileItem.file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileItem.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getFileCategory(fileItem.file.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(fileItem.file.size)}
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileItem.id)}
                  disabled={disabled}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}