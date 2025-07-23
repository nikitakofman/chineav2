'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText } from 'lucide-react'

interface DocumentViewerProps {
  documentUrl: string
  fileName?: string
  title?: string
  isOpen: boolean
  onClose: () => void
}

export function DocumentViewer({ documentUrl, fileName = 'Document', title, isOpen, onClose }: DocumentViewerProps) {
  if (!documentUrl) return null

  // Check if the document is a PDF
  const isPdf = documentUrl.toLowerCase().endsWith('.pdf') || fileName.toLowerCase().endsWith('.pdf')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] w-[90vw] h-[85vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Reader
          </DialogTitle>
          {(title || fileName) && (
            <p className="text-sm text-muted-foreground">
              {title || fileName}
            </p>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden rounded-md border">
          {isPdf ? (
            <iframe
              src={documentUrl}
              className="w-full h-full"
              title={title || fileName}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <p className="text-muted-foreground mb-4">
                  Preview not available for this file type.
                </p>
                <a 
                  href={documentUrl} 
                  download={fileName}
                  className="text-primary hover:underline"
                >
                  Download {title || fileName}
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}