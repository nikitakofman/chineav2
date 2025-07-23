'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { setSelectedBookId } from '@/app/actions/books'

interface Book {
  id: string
  book_type_id: string | null
  description: string | null
  reference: string | null
  user_id: string | null
  created_at: Date | null
  updated_at: Date | null
  book_type: {
    id: string
    name: string
    display_name: string | null
  } | null
}

interface BookContextType {
  selectedBook: Book | null
  books: Book[]
  setSelectedBook: (book: Book) => Promise<void>
  setBooks: (books: Book[]) => void
}

const BookContext = createContext<BookContextType | undefined>(undefined)

export function BookProvider({ children, initialBooks = [] }: { children: ReactNode, initialBooks?: Book[] }) {
  const [selectedBook, setSelectedBookState] = useState<Book | null>(
    initialBooks.length > 0 ? initialBooks[0] : null
  )
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const router = useRouter()

  const setSelectedBook = async (book: Book) => {
    setSelectedBookState(book)
    // Store selected book ID in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBookId', book.id)
    }
    // Also save to cookie via server action
    await setSelectedBookId(book.id)
    router.refresh()
  }

  // Load selected book from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && books.length > 0) {
      const storedBookId = localStorage.getItem('selectedBookId')
      if (storedBookId) {
        const book = books.find(b => b.id === storedBookId)
        if (book) {
          setSelectedBookState(book)
          // Also sync to cookie
          setSelectedBookId(book.id)
        }
      } else if (selectedBook) {
        // If no stored book but we have a selected book, save it
        localStorage.setItem('selectedBookId', selectedBook.id)
        setSelectedBookId(selectedBook.id)
      }
    }
  }, [books])

  return (
    <BookContext.Provider value={{ selectedBook, books, setSelectedBook, setBooks }}>
      {children}
    </BookContext.Provider>
  )
}

export function useBook() {
  const context = useContext(BookContext)
  if (context === undefined) {
    throw new Error('useBook must be used within a BookProvider')
  }
  return context
}