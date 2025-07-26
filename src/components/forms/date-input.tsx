"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateInputProps } from "@/types/form-types"

// Date formatting utilities
const formatDate = (date: Date, formatString: string = "PPP"): string => {
  try {
    return format(date, formatString)
  } catch {
    return ""
  }
}

const parseDate = (value: Date | string | undefined): Date | undefined => {
  if (!value) return undefined
  
  if (value instanceof Date) {
    return isValid(value) ? value : undefined
  }
  
  if (typeof value === "string") {
    try {
      // Try parsing ISO string first
      const parsed = parseISO(value)
      if (isValid(parsed)) return parsed
      
      // Try parsing as Date
      const dateFromString = new Date(value)
      if (isValid(dateFromString)) return dateFromString
    } catch {
      // Ignore parsing errors
    }
  }
  
  return undefined
}

export function DateInput({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  minDate,
  maxDate,
  showTime = false,
  format: formatString = "PPP",
  ...props
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  
  const selectedDate = parseDate(value)
  
  // Update input value when date changes
  React.useEffect(() => {
    if (selectedDate) {
      setInputValue(formatDate(selectedDate, formatString))
    } else {
      setInputValue("")
    }
  }, [selectedDate, formatString])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Apply time constraints if needed
      let finalDate = date
      
      if (minDate && date < minDate) {
        finalDate = minDate
      }
      if (maxDate && date > maxDate) {
        finalDate = maxDate
      }
      
      onChange?.(finalDate)
    } else {
      onChange?.(undefined)
    }
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setInputValue(input)
    
    // Try to parse the manual input
    if (input) {
      const parsed = parseDate(input)
      if (parsed) {
        onChange?.(parsed)
      }
    } else {
      onChange?.(undefined)
    }
  }

  const handleInputBlur = () => {
    // Reset input to formatted date if parsing failed
    if (selectedDate) {
      setInputValue(formatDate(selectedDate, formatString))
    } else {
      setInputValue("")
    }
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("pr-10", className)}
            {...props}
          />
          
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              disabled={disabled}
              aria-label="Open calendar"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </div>
        
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (disabled) return true
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            initialFocus
          />
          
          {showTime && selectedDate && (
            <div className="border-t p-3">
              <TimeSelector
                date={selectedDate}
                onChange={(time) => {
                  if (time && selectedDate) {
                    const newDate = new Date(selectedDate)
                    newDate.setHours(time.hours, time.minutes, 0, 0)
                    onChange?.(newDate)
                  }
                }}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Time selector component for date-time inputs
interface TimeValue {
  hours: number
  minutes: number
}

interface TimeSelectorProps {
  date: Date
  onChange: (time: TimeValue | null) => void
}

function TimeSelector({ date, onChange }: TimeSelectorProps) {
  const [hours, setHours] = React.useState(date.getHours())
  const [minutes, setMinutes] = React.useState(date.getMinutes())

  const handleTimeChange = () => {
    onChange({ hours, minutes })
  }

  React.useEffect(() => {
    handleTimeChange()
  }, [hours, minutes])

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Time</p>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={hours.toString().padStart(2, "0")}
          onChange={(e) => {
            const value = parseInt(e.target.value)
            if (value >= 0 && value <= 23) {
              setHours(value)
            }
          }}
          min={0}
          max={23}
          className="w-16 text-center"
          placeholder="00"
        />
        <span className="text-sm text-muted-foreground">:</span>
        <Input
          type="number"
          value={minutes.toString().padStart(2, "0")}
          onChange={(e) => {
            const value = parseInt(e.target.value)
            if (value >= 0 && value <= 59) {
              setMinutes(value)
            }
          }}
          min={0}
          max={59}
          step={5}
          className="w-16 text-center"
          placeholder="00"
        />
      </div>
    </div>
  )
}

// Specialized date input variants
export function DateTimeInput(props: Omit<DateInputProps, "showTime">) {
  return <DateInput {...props} showTime={true} format="PPp" />
}

export function DateOnlyInput(props: Omit<DateInputProps, "showTime" | "format">) {
  return <DateInput {...props} showTime={false} format="PP" />
}

export function CompactDateInput(props: Omit<DateInputProps, "format">) {
  return <DateInput {...props} format="dd/MM/yyyy" />
}