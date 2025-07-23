'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createBook } from '@/app/actions/books'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface BookType {
  id: string
  name: string
  display_name: string | null
  description: string | null
}

interface BookSetupFormProps {
  bookTypes: BookType[]
  onSuccess?: () => void
}

export function BookSetupForm({ bookTypes, onSuccess }: BookSetupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const t = useTranslations()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    
    try {
      const result = await createBook(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        // Call onSuccess if provided, otherwise redirect to dashboard
        if (onSuccess) {
          onSuccess()
          router.refresh()
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="bookTypeId" className="text-sm font-medium">{t('books.bookType')}</Label>
        <Select name="bookTypeId" required>
          <SelectTrigger className="h-11">
            <SelectValue placeholder={t('books.selectBookType')} />
          </SelectTrigger>
          <SelectContent>
            {bookTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.display_name || type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference" className="text-sm font-medium">{t('books.reference')}</Label>
        <Input
          id="reference"
          name="reference"
          placeholder={t('books.referencePlaceholder')}
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">{t('books.description')}</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={t('books.descriptionPlaceholder')}
          className="min-h-[88px] resize-none"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 text-base font-medium mt-6"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('books.creating')}
          </>
        ) : (
          t('books.createBook')
        )}
      </Button>
    </form>
  )
}