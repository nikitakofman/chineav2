'use client'

import { Edit, Trash2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'

interface Category {
  id: string
  name: string
  description: string | null
  user_id: string | null
  created_at: Date | null
  updated_at: Date | null
}

interface CategoriesGridProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoriesGrid({ categories, onEdit, onDelete }: CategoriesGridProps) {
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-border p-8">
        <div className="text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('categories.noCategoriesFound')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('categories.addFirstCategory')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Card key={category.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <FolderOpen className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg truncate flex-1">{category.name}</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            <div className="space-y-3">
              {category.description ? (
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                  {category.description}
                </p>
              ) : (
                <div className="min-h-[3.75rem] flex items-center justify-center text-muted-foreground text-sm">
                  No description provided
                </div>
              )}
              
              <div className="pt-2 border-t text-xs text-muted-foreground">
                {category.created_at && (
                  <div>
                    Created {formatDistanceToNow(new Date(category.created_at), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </div>
                )}
                {category.updated_at && category.updated_at !== category.created_at && (
                  <div>
                    Updated {formatDistanceToNow(new Date(category.updated_at), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-0">
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onEdit(category)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}