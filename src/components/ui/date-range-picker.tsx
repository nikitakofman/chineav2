'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DateInput } from './date-input'

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  onUpdate?: (values: { range: DateRange; rangeCompare?: DateRange }) => void
  initialDateFrom?: Date | string
  initialDateTo?: Date | string
  initialCompareFrom?: Date | string
  initialCompareTo?: Date | string
  align?: 'start' | 'center' | 'end'
  locale?: string
  showCompare?: boolean
}

const formatDate = (date: Date | string | undefined, locale = 'en-US'): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getDateAdjusted = (dateString: string | Date): Date => {
  if (typeof dateString === 'string') {
    const date = new Date(dateString)
    date.setHours(0, 0, 0, 0)
    return date
  }
  return dateString
}

export function DateRangePicker({
  onUpdate,
  initialDateFrom,
  initialDateTo,
  initialCompareFrom,
  initialCompareTo,
  align = 'end',
  locale = 'en-US',
  showCompare = true,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const [range, setRange] = React.useState<DateRange>(() => ({
    from: initialDateFrom ? getDateAdjusted(initialDateFrom) : undefined,
    to: initialDateTo ? getDateAdjusted(initialDateTo) : undefined,
  }))

  const [rangeCompare, setRangeCompare] = React.useState<DateRange | undefined>(
    initialCompareFrom
      ? {
          from: getDateAdjusted(initialCompareFrom),
          to: initialCompareTo
            ? getDateAdjusted(initialCompareTo)
            : getDateAdjusted(initialCompareFrom),
        }
      : undefined
  )

  // Refs to store the values between renders
  const openedRangeRef = React.useRef<DateRange | undefined>()
  const [selectedPreset, setSelectedPreset] = React.useState<string | undefined>()

  const [isSmallScreen, setIsSmallScreen] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  )

  React.useEffect(() => {
    const handleResize = (): void => {
      setIsSmallScreen(window.innerWidth < 960)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getPresetRange = (preset: string): DateRange => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (preset) {
      case 'today':
        return { from: today, to: today }
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return { from: yesterday, to: yesterday }
      case 'last7':
        const last7Days = new Date(today)
        last7Days.setDate(last7Days.getDate() - 6)
        return { from: last7Days, to: today }
      case 'last30':
        const last30Days = new Date(today)
        last30Days.setDate(last30Days.getDate() - 29)
        return { from: last30Days, to: today }
      case 'thisMonth':
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        }
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return {
          from: lastMonth,
          to: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
        }
      default:
        return { from: undefined, to: undefined }
    }
  }

  const setPreset = (preset: string): void => {
    const rangeLocal = getPresetRange(preset)
    setRange(rangeLocal)
    setSelectedPreset(preset)
  }

  const checkPreset = (): void => {
    for (const preset of ['today', 'yesterday', 'last7', 'last30', 'thisMonth', 'lastMonth']) {
      const presetRange = getPresetRange(preset)

      const normalizedRangeFrom = range.from ? new Date(range.from.setHours(0, 0, 0, 0)) : undefined
      const normalizedRangeTo = range.to ? new Date(range.to.setHours(0, 0, 0, 0)) : undefined
      const normalizedPresetFrom = presetRange.from ? new Date(presetRange.from.setHours(0, 0, 0, 0)) : undefined
      const normalizedPresetTo = presetRange.to ? new Date(presetRange.to.setHours(0, 0, 0, 0)) : undefined

      if (
        normalizedRangeFrom?.getTime() === normalizedPresetFrom?.getTime() &&
        normalizedRangeTo?.getTime() === normalizedPresetTo?.getTime()
      ) {
        setSelectedPreset(preset)
        return
      }
    }

    setSelectedPreset(undefined)
  }

  const resetValues = (): void => {
    setRange({
      from: initialDateFrom ? getDateAdjusted(initialDateFrom) : undefined,
      to: initialDateTo ? getDateAdjusted(initialDateTo) : undefined,
    })
    setRangeCompare(
      initialCompareFrom
        ? {
            from: getDateAdjusted(initialCompareFrom),
            to: initialCompareTo
              ? getDateAdjusted(initialCompareTo)
              : getDateAdjusted(initialCompareFrom),
          }
        : undefined
    )
  }

  React.useEffect(() => {
    checkPreset()
  }, [range])

  const PresetButton = ({
    preset,
    children,
  }: {
    preset: string
    children: React.ReactNode
  }): JSX.Element => (
    <Button
      variant={selectedPreset === preset ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setPreset(preset)}
      className="justify-start"
    >
      {children}
    </Button>
  )

  // Helper function to check if two date ranges are equal
  const areRangesEqual = (a?: DateRange, b?: DateRange) => {
    if (!a || !b) return a === b
    return (
      a.from?.getTime() === b.from?.getTime() &&
      a.to?.getTime() === b.to?.getTime()
    )
  }

  React.useEffect(() => {
    if (isOpen) {
      openedRangeRef.current = range
    }
  }, [isOpen, range])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover
        modal={true}
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetValues()
          }
          setIsOpen(open)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !range && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {formatDate(range.from, locale)} - {formatDate(range.to, locale)}
                </>
              ) : (
                formatDate(range.from, locale)
              )
            ) : (
              <span>Pick a date range</span>
            )}
            {isOpen ? (
              <ChevronUp className="ml-auto h-4 w-4 opacity-50" />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex">
            <div className="flex flex-col">
              <div className="flex flex-col lg:flex-row gap-2 p-3 items-start lg:items-center pb-1">
                {isSmallScreen && (
                  <Select defaultValue={selectedPreset} onValueChange={setPreset}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last7">Last 7 days</SelectItem>
                      <SelectItem value="last30">Last 30 days</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex gap-2">
                  <DateInput
                    value={range.from}
                    onChange={(date) => {
                      const toDate =
                        range.to && range.from && date && date > range.to ? date : range.to
                      setRange({ from: date, to: toDate })
                    }}
                    placeholder="Start date"
                  />
                  <div className="py-1">-</div>
                  <DateInput
                    value={range.to}
                    onChange={(date) => {
                      const fromDate = date && range.from && date < range.from ? date : range.from
                      setRange({ from: fromDate, to: date })
                    }}
                    placeholder="End date"
                    disabled={!range.from}
                  />
                </div>
                {showCompare && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="compare"
                      checked={Boolean(rangeCompare)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (!range.from || !range.to) {
                            setRangeCompare(undefined)
                          } else {
                            const daysDiff = Math.round(
                              (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
                            )
                            const compareFrom = new Date(range.from)
                            compareFrom.setDate(compareFrom.getDate() - daysDiff - 1)
                            const compareTo = new Date(range.from)
                            compareTo.setDate(compareTo.getDate() - 1)
                            setRangeCompare({ from: compareFrom, to: compareTo })
                          }
                        } else {
                          setRangeCompare(undefined)
                        }
                      }}
                    />
                    <Label htmlFor="compare" className="text-sm font-medium cursor-pointer">
                      Compare
                    </Label>
                  </div>
                )}
              </div>
              {rangeCompare && (
                <div className="flex gap-2 items-center p-3 pt-0">
                  <DateInput
                    value={rangeCompare?.from}
                    onChange={(date) => {
                      if (rangeCompare) {
                        const compareToDate =
                          rangeCompare.to && date && date > rangeCompare.to ? date : rangeCompare.to
                        setRangeCompare({ from: date, to: compareToDate })
                      }
                    }}
                    placeholder="Start date"
                  />
                  <div className="py-1">-</div>
                  <DateInput
                    value={rangeCompare?.to}
                    onChange={(date) => {
                      if (rangeCompare) {
                        const compareFromDate =
                          date && rangeCompare.from && date < rangeCompare.from
                            ? date
                            : rangeCompare.from
                        setRangeCompare({ from: compareFromDate, to: date })
                      }
                    }}
                    placeholder="End date"
                    disabled={!rangeCompare?.from}
                  />
                </div>
              )}
            </div>
            {!isSmallScreen && (
              <div className="flex flex-col items-end gap-1 pr-2 pl-1 pb-2">
                <PresetButton preset="today">Today</PresetButton>
                <PresetButton preset="yesterday">Yesterday</PresetButton>
                <PresetButton preset="last7">Last 7 days</PresetButton>
                <PresetButton preset="last30">Last 30 days</PresetButton>
                <PresetButton preset="thisMonth">This Month</PresetButton>
                <PresetButton preset="lastMonth">Last Month</PresetButton>
              </div>
            )}
          </div>
          <Calendar
            mode="range"
            disabled={false}
            selected={range}
            onSelect={setRange}
            numberOfMonths={isSmallScreen ? 1 : 2}
            defaultMonth={
              range?.from
                ? new Date(range.from.getFullYear(), range.from.getMonth())
                : new Date()
            }
          />
          <div className="flex gap-2 py-2 pr-2 pl-auto ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsOpen(false)
                resetValues()
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsOpen(false)
                if (!areRangesEqual(range, openedRangeRef.current)) {
                  onUpdate?.({ range, rangeCompare })
                }
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}