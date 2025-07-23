import { getTranslations } from 'next-intl/server'
import { getBookTypes } from '@/app/actions/books'
import { BookSetupForm } from '@/components/books/book-setup-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default async function BookSetupPage() {
  const t = await getTranslations()
  const bookTypes = await getBookTypes()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4 py-8">
      <Card className="w-full max-w-md sm:max-w-lg lg:max-w-2xl mx-auto">
        <CardHeader className="text-center space-y-3 px-4 sm:px-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">{t('books.setupTitle')}</CardTitle>
          <CardDescription className="text-sm sm:text-base leading-relaxed">
            {t('books.setupDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <BookSetupForm bookTypes={bookTypes} />
        </CardContent>
      </Card>
    </div>
  )
}