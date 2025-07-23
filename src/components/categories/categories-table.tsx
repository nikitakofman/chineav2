'use client'

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface CategoriesTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoriesTable({ categories, onEdit, onDelete }: CategoriesTableProps) {
  const t = useTranslations()
  const locale = useLocale()

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-border p-12 text-center">
        <p className="text-muted-foreground">{t('categories.noCategoriesFound')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('categories.addFirstCategory')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-card rounded-lg border border-border">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-muted-foreground">{t('categories.categoryName')}</TableHead>
            <TableHead className="text-muted-foreground">{t('categories.createdDate')}</TableHead>
            <TableHead className="w-[70px] text-muted-foreground">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">
                {category.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {category.created_at ? formatDistanceToNow(new Date(category.created_at), {
                  addSuffix: true,
                  locale: locale === 'fr' ? fr : enUS
                }) : '-'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('categories.categoryActions')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(category)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(category)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}