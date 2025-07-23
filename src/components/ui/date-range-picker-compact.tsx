'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocale, useTranslations } from 'next-intl'

interface DateRangePickerCompactProps {
  onUpdate?: (values: { range: DateRange }) => void
  initialDateFrom?: Date | string
  initialDateTo?: Date | string
  align?: 'start' | 'center' | 'end'
  locale?: string
  className?: string
}

const formatDate = (date: Date | string | undefined, locale = 'en'): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const dateLocale = locale === 'fr' ? fr : enUS
  return format(d, 'dd MMM yyyy', { locale: dateLocale })
}

const getDateAdjusted = (dateString: string | Date): Date => {
  if (typeof dateString === 'string') {
    const date = new Date(dateString)
    date.setHours(0, 0, 0, 0)
    return date
  }
  return dateString
}

export function DateRangePickerCompact({
  onUpdate,
  initialDateFrom,
  initialDateTo,
  align = 'end',
  locale,
  className,
}: DateRangePickerCompactProps) {
  const currentLocale = useLocale()
  const dateLocale = locale || currentLocale
  const t = useTranslations('items')
  const [isOpen, setIsOpen] = React.useState(false)

  const [range, setRange] = React.useState<DateRange>(() => ({
    from: initialDateFrom ? getDateAdjusted(initialDateFrom) : undefined,
    to: initialDateTo ? getDateAdjusted(initialDateTo) : undefined,
  }))

  const handleSelect = (newRange: DateRange | undefined) => {
    if (newRange) {
      setRange(newRange)
    }
  }

  const handleApply = () => {
    setIsOpen(false)
    onUpdate?.({ range })
  }

  const handleClear = () => {
    setRange({ from: undefined, to: undefined })
    onUpdate?.({ range: { from: undefined, to: undefined } })
    setIsOpen(false)
  }

  // Get current month and year from the displayed month
  const [currentMonth, setCurrentMonth] = React.useState<Date>(range?.from || new Date())
  
  // Generate year options (10 years before and after current year)
  const currentYear = new Date().getFullYear()
  const yearOptions = React.useMemo(() => {
    const years = []
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i)
    }
    return years
  }, [currentYear])

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(parseInt(year))
    setCurrentMonth(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-10 bg-white",
              !range.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {formatDate(range.from, dateLocale)} - {formatDate(range.to, dateLocale)}
                </>
              ) : (
                formatDate(range.from, dateLocale)
              )
            ) : (
              <span>{t('selectDates')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Select
                value={currentMonth.getFullYear().toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleSelect}
              numberOfMonths={1}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={dateLocale === 'fr' ? fr : enUS}
            />
            <div className="flex justify-between gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
              >
                {t('clear')}
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
              >
                {t('apply')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}