'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface ImageViewerProps {
  imageUrl: string
  alt?: string
  title?: string
  width?: number
  height?: number
  isOpen: boolean
  onClose: () => void
}

export function ImageViewer({ imageUrl, alt = 'Image', title, width, height, isOpen, onClose }: ImageViewerProps) {
  if (!imageUrl) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black border-0">
        <VisuallyHidden>
          <DialogTitle>{title || alt || 'Image viewer'}</DialogTitle>
          <DialogDescription>Viewing image: {title || alt}</DialogDescription>
        </VisuallyHidden>
        <div className="relative w-full h-full flex items-center justify-center min-h-[400px]">
          <img
            src={imageUrl}
            alt={title || alt}
            width={width}
            height={height}
            className="max-w-full max-h-[85vh] object-contain"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.png'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}