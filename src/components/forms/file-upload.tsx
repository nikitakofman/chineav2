"use client"

import * as React from "react"
import { Upload, X, File, Image, FileText, Video, Music } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileUploadProps } from "@/types/form-types"

// File type utilities
const getFileIcon = (file: File): React.ReactNode => {
  const type = file.type.toLowerCase()
  
  if (type.startsWith("image/")) {
    return <Image className="h-4 w-4" />
  }
  if (type.startsWith("video/")) {
    return <Video className="h-4 w-4" />
  }
  if (type.startsWith("audio/")) {
    return <Music className="h-4 w-4" />
  }
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) {
    return <FileText className="h-4 w-4" />
  }
  
  return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const isValidFileType = (file: File, accept?: string): boolean => {
  if (!accept) return true
  
  const acceptedTypes = accept.split(",").map(type => type.trim())
  
  return acceptedTypes.some(type => {
    if (type.startsWith(".")) {
      // File extension
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    } else if (type.includes("/*")) {
      // MIME type wildcard (e.g., image/*)
      const baseType = type.split("/")[0]
      return file.type.toLowerCase().startsWith(baseType.toLowerCase())
    } else {
      // Exact MIME type
      return file.type.toLowerCase() === type.toLowerCase()
    }
  })
}

export function FileUpload({
  value,
  onChange,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  disabled = false,
  className,
  showPreview = true,
  previewClassName,
  dragAndDrop = true,
  children,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Normalize files for consistent handling
  const normalizeFiles = (files: FileUploadProps["value"]): File[] => {
    if (!files) return []
    if (Array.isArray(files)) {
      return files.filter((f): f is File => f instanceof File)
    }
    if (files instanceof File) {
      return [files]
    }
    return []
  }
  
  const currentFiles = normalizeFiles(value)
  
  const validateFile = (file: File): string | null => {
    if (!isValidFileType(file, accept)) {
      return `File type "${file.type}" is not accepted`
    }
    
    if (file.size > maxSize) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum (${formatFileSize(maxSize)})`
    }
    
    return null
  }
  
  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []
    
    if (!multiple && files.length > 1) {
      errors.push("Only one file is allowed")
      return { valid: files.slice(0, 1), errors }
    }
    
    if (multiple && currentFiles.length + files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
    }
    
    files.forEach((file, index) => {
      const error = validateFile(file)
      if (error) {
        errors.push(`File ${index + 1}: ${error}`)
      } else if (multiple && currentFiles.length + valid.length < maxFiles) {
        valid.push(file)
      } else if (!multiple && valid.length === 0) {
        valid.push(file)
      }
    })
    
    return { valid, errors }
  }
  
  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const { valid, errors } = validateFiles(fileArray)
    
    setErrors(errors)
    
    if (valid.length > 0) {
      if (multiple) {
        const newFiles = [...currentFiles, ...valid]
        onChange?.(newFiles.length === 1 ? newFiles[0] : newFiles)
      } else {
        onChange?.(valid[0])
      }
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFiles(files)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && dragAndDrop) {
      setIsDragOver(true)
    }
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ""
  }
  
  const removeFile = (index: number) => {
    if (multiple) {
      const newFiles = currentFiles.filter((_, i) => i !== index)
      onChange?.(newFiles.length === 0 ? null : newFiles.length === 1 ? newFiles[0] : newFiles)
    } else {
      onChange?.(null)
    }
  }
  
  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragOver && !disabled
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:border-primary hover:bg-primary/5"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          {children || (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {dragAndDrop ? "Drop files here or click to upload" : "Click to upload files"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept && `Accepted types: ${accept}`}
                  {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
                  {multiple && ` • Max files: ${maxFiles}`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}
      
      {/* File previews */}
      {showPreview && currentFiles.length > 0 && (
        <div className={cn("space-y-2", previewClassName)}>
          <p className="text-sm font-medium">
            {multiple ? `Selected files (${currentFiles.length})` : "Selected file"}
          </p>
          
          <div className="space-y-2">
            {currentFiles.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => removeFile(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// File preview component
interface FilePreviewProps {
  file: File
  onRemove: () => void
  disabled?: boolean
}

function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  
  // Generate image preview for image files
  React.useEffect(() => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
    
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [file])
  
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      {/* File icon or image preview */}
      <div className="flex-shrink-0">
        {imagePreview ? (
          <div className="relative w-10 h-10 rounded overflow-hidden">
            <img
              src={imagePreview}
              alt={`Preview of ${file.name}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-background rounded flex items-center justify-center">
            {getFileIcon(file)}
          </div>
        )}
      </div>
      
      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          <Badge variant="outline" className="text-xs">
            {file.type || "Unknown"}
          </Badge>
        </div>
      </div>
      
      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={disabled}
        className="flex-shrink-0 h-8 w-8 p-0"
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Specialized file upload variants
export function ImageUpload(props: Omit<FileUploadProps, "accept">) {
  return <FileUpload {...props} accept="image/*" />
}

export function DocumentUpload(props: Omit<FileUploadProps, "accept">) {
  return <FileUpload {...props} accept=".pdf,.doc,.docx,.txt,.rtf" />
}

export function VideoUpload(props: Omit<FileUploadProps, "accept">) {
  return <FileUpload {...props} accept="video/*" />
}

export function AudioUpload(props: Omit<FileUploadProps, "accept">) {
  return <FileUpload {...props} accept="audio/*" />
}