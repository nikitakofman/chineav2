"use client"

import * as React from "react"
import { DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { CurrencyInputProps } from "@/types/form-types"

// Currency formatting utilities
const formatCurrency = (
  value: number,
  currency: string = "USD",
  locale: string = "en-US",
  precision: number = 2
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(value)
  } catch {
    // Fallback for invalid currency/locale
    return `${currency} ${value.toFixed(precision)}`
  }
}

const parseCurrencyInput = (input: string): number => {
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = input.replace(/[^\d.-]/g, "")
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

const formatInputValue = (value: number, precision: number = 2): string => {
  return value === 0 ? "" : value.toFixed(precision)
}

export function CurrencyInput({
  value = 0,
  onChange,
  currency = "USD",
  locale = "en-US",
  placeholder,
  disabled = false,
  className,
  min,
  max,
  precision = 2,
  ...props
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)
  
  // Initialize input value from prop
  React.useEffect(() => {
    if (typeof value === "number") {
      setInputValue(formatInputValue(value, precision))
    } else if (typeof value === "string") {
      const parsed = parseCurrencyInput(value)
      setInputValue(formatInputValue(parsed, precision))
    }
  }, [value, precision])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    
    // Allow empty input
    if (input === "") {
      setInputValue("")
      onChange?.(0)
      return
    }
    
    // Parse and validate the input
    const numericValue = parseCurrencyInput(input)
    
    // Apply min/max constraints
    let constrainedValue = numericValue
    if (min !== undefined && constrainedValue < min) {
      constrainedValue = min
    }
    if (max !== undefined && constrainedValue > max) {
      constrainedValue = max
    }
    
    setInputValue(input)
    onChange?.(constrainedValue)
  }

  const handleBlur = () => {
    setIsFocused(false)
    
    // Format the input value on blur
    if (inputValue) {
      const numericValue = parseCurrencyInput(inputValue)
      setInputValue(formatInputValue(numericValue, precision))
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  // Get the currency symbol
  const getCurrencySymbol = (): string => {
    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(0)
      
      // Extract symbol by removing the number
      return formatted.replace(/[\d\s]/g, "")
    } catch {
      return "$" // Fallback
    }
  }

  const currencySymbol = getCurrencySymbol()
  const displayValue = isFocused ? inputValue : (inputValue ? formatCurrency(parseCurrencyInput(inputValue), currency, locale, precision) : "")
  const numericValue = inputValue ? parseCurrencyInput(inputValue) : 0

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <DollarSign className="h-4 w-4" />
      </div>
      
      <Input
        type="text"
        value={isFocused ? inputValue : displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || `0.00 ${currency}`}
        disabled={disabled}
        className={cn("pl-10", className)}
        {...props}
      />
      
      {/* Display additional info for screen readers */}
      <span className="sr-only">
        {`Currency input for ${currency}. Current value: ${formatCurrency(numericValue, currency, locale, precision)}`}
      </span>
    </div>
  )
}

// Specialized currency input variants
export function USDInput(props: Omit<CurrencyInputProps, "currency" | "locale">) {
  return <CurrencyInput {...props} currency="USD" locale="en-US" />
}

export function EURInput(props: Omit<CurrencyInputProps, "currency" | "locale">) {
  return <CurrencyInput {...props} currency="EUR" locale="en-EU" />
}

export function GBPInput(props: Omit<CurrencyInputProps, "currency" | "locale">) {
  return <CurrencyInput {...props} currency="GBP" locale="en-GB" />
}

export function CADInput(props: Omit<CurrencyInputProps, "currency" | "locale">) {
  return <CurrencyInput {...props} currency="CAD" locale="en-CA" />
}