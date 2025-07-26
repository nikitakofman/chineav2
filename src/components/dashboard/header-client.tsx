'use client'

import { useState } from 'react'
import { Search, BookOpen, ChevronDown, Plus, Menu, HelpCircle, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationDropdown } from '@/components/dashboard/notification-dropdown'
import { useTranslations } from 'next-intl'
import { useBook } from '@/contexts/book-context'
import { BookCreateModal } from '@/components/shared/modal-configurations'
import { useMobileSidebar } from '@/contexts/mobile-sidebar-context'
import { Separator } from '@/components/ui/separator'
import { useRouter, useParams, usePathname } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardHeaderClientProps {
  bookTypes: Array<{
    id: string
    name: string
    display_name: string | null
    description: string | null
  }>
  unreadNotificationCount: number
}

export function DashboardHeaderClient({ bookTypes, unreadNotificationCount }: DashboardHeaderClientProps) {
  const t = useTranslations()
  const { selectedBook, books, setSelectedBook, setBooks } = useBook()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { toggle } = useMobileSidebar()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()

  const handleBookCreated = async (newBook: any) => {
    console.log('Book created:', newBook) // Debug log
    
    try {
      // Close the modal first
      setShowCreateModal(false)
      
      // Add the new book to the books list
      const updatedBooks = [...books, newBook]
      setBooks(updatedBooks)
      
      // Update the selected book to the new book (this also saves to localStorage and cookie)
      await setSelectedBook(newBook)
      
      console.log('Book selection updated')
    } catch (error) {
      console.error('Error updating book selection:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8 flex-1 min-w-0">
          {/* Mobile burger menu */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden flex-shrink-0"
            onClick={toggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <span className="text-lg sm:text-xl font-semibold text-primary truncate">{t('common.appName')}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 min-w-0 max-w-[200px] sm:max-w-none"
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="truncate text-sm sm:text-base">
                  {selectedBook?.reference || t('books.selectBook')}
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>{t('books.selectBook')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {books.map((book) => (
                <DropdownMenuItem
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className={selectedBook?.id === book.id ? 'bg-muted' : ''}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>{book.reference}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                <span>{t('books.createNewBook')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              type="text" 
              placeholder={t('common.search')} 
              className="pl-10 pr-4 py-2 bg-muted/50 dark:bg-muted/20 rounded-lg text-sm w-48 xl:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
          <div className="hidden sm:block">
            <NotificationDropdown 
              unreadCount={unreadNotificationCount} 
              isActive={pathname?.includes('/notifications')}
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => router.push(`/${params.locale}/dashboard/admin`)}
            title="Admin"
          >
            <Shield className="w-5 h-5" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <LanguageSwitcher />
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => router.push(`/${params.locale}/dashboard/documentation`)}
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <BookCreateModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        bookTypes={bookTypes}
        onSuccess={handleBookCreated}
      />
    </div>
  )
}