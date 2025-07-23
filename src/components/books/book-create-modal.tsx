'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useBook } from '@/contexts/book-context'
import { checkUserBooks } from '@/app/actions/books'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BookSetupForm } from './book-setup-form'
import { BookOpen } from 'lucide-react'

interface BookCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookTypes: Array<{
    id: string
    name: string
    display_name: string | null
    description: string | null
  }>
}

export function BookCreateModal({ open, onOpenChange, bookTypes }: BookCreateModalProps) {
  const t = useTranslations('books')
  const router = useRouter()
  const { setBooks, setSelectedBook } = useBook()

  const handleSuccess = async () => {
    // Refresh the books list
    const updatedBooks = await checkUserBooks()
    setBooks(updatedBooks)
    
    // Select the newly created book (it will be the first one due to orderBy)
    if (updatedBooks.length > 0) {
      setSelectedBook(updatedBooks[0])
    }
    
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t('createNewBook')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('setupDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <BookSetupForm 
            bookTypes={bookTypes} 
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}