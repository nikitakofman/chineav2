import { getTranslations } from 'next-intl/server'
import { DocumentationContent } from '@/components/documentation/documentation-content'

export default async function DocumentationPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t('documentation.title')}</h1>
      <DocumentationContent locale={locale} />
    </div>
  )
}