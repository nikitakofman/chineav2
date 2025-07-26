"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { FieldGroupProps } from "@/types/form-types"

export function FieldGroup({
  children,
  columns = 2,
  className,
  gap = "md",
  align = "start",
}: FieldGroupProps) {
  const gapClasses = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  }

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  }

  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div
      className={cn(
        "grid",
        columnClasses[columns],
        gapClasses[gap],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

// Specialized field group variants
export function InlineFields({
  children,
  className,
  gap = "sm",
}: {
  children: React.ReactNode
  className?: string
  gap?: "sm" | "md" | "lg"
}) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  }

  return (
    <div className={cn("flex items-end", gapClasses[gap], className)}>
      {children}
    </div>
  )
}

export function TwoColumnFields(props: Omit<FieldGroupProps, "columns">) {
  return <FieldGroup {...props} columns={2} />
}

export function ThreeColumnFields(props: Omit<FieldGroupProps, "columns">) {
  return <FieldGroup {...props} columns={3} />
}

export function FourColumnFields(props: Omit<FieldGroupProps, "columns">) {
  return <FieldGroup {...props} columns={4} />
}

// Responsive field group that adapts to screen size
export function ResponsiveFields({
  children,
  mobile = 1,
  tablet = 2,
  desktop = 3,
  className,
  gap = "md",
  align = "start",
}: {
  children: React.ReactNode
  mobile?: 1 | 2
  tablet?: 1 | 2 | 3
  desktop?: 1 | 2 | 3 | 4
  className?: string
  gap?: "sm" | "md" | "lg"
  align?: "start" | "center" | "end"
}) {
  const gapClasses = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  }

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  }

  const getGridClasses = () => {
    const mobileClass = mobile === 1 ? "grid-cols-1" : "grid-cols-2"
    const tabletClass = 
      tablet === 1 ? "sm:grid-cols-1" :
      tablet === 2 ? "sm:grid-cols-2" :
      "sm:grid-cols-3"
    const desktopClass = 
      desktop === 1 ? "lg:grid-cols-1" :
      desktop === 2 ? "lg:grid-cols-2" :
      desktop === 3 ? "lg:grid-cols-3" :
      "lg:grid-cols-4"

    return `${mobileClass} ${tabletClass} ${desktopClass}`
  }

  return (
    <div
      className={cn(
        "grid",
        getGridClasses(),
        gapClasses[gap],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

// Address field group - common pattern
export function AddressFields({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Street address - full width */}
      <div className="grid grid-cols-1">
        {React.Children.toArray(children)[0]}
      </div>
      
      {/* City, State, ZIP - responsive columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {React.Children.toArray(children).slice(1, 4)}
      </div>
      
      {/* Country - full width if present */}
      {React.Children.count(children) > 4 && (
        <div className="grid grid-cols-1">
          {React.Children.toArray(children)[4]}
        </div>
      )}
    </div>
  )
}

// Name field group - common pattern
export function NameFields({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {children}
    </div>
  )
}

// Contact field group - common pattern
export function ContactFields({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Email - full width */}
      <div className="grid grid-cols-1">
        {React.Children.toArray(children)[0]}
      </div>
      
      {/* Phone numbers - responsive columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {React.Children.toArray(children).slice(1)}
      </div>
    </div>
  )
}

// Date range field group
export function DateRangeFields({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {children}
    </div>
  )
}

// Price/amount field group
export function PriceFields({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const childArray = React.Children.toArray(children)
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main price - full width */}
      <div className="grid grid-cols-1">
        {childArray[0]}
      </div>
      
      {/* Additional price fields - responsive columns */}
      {childArray.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childArray.slice(1)}
        </div>
      )}
    </div>
  )
}

// Compact field group for tight spaces
export function CompactFields({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-2", className)}>
      {children}
    </div>
  )
}

// Stack fields vertically with consistent spacing
export function StackedFields({
  children,
  spacing = "md",
  className,
}: {
  children: React.ReactNode
  spacing?: "sm" | "md" | "lg"
  className?: string
}) {
  const spacingClasses = {
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
  }

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}

// Conditional field group that shows/hides based on a condition
export function ConditionalFields({
  children,
  show = true,
  className,
}: {
  children: React.ReactNode
  show?: boolean
  className?: string
}) {
  if (!show) return null

  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  )
}

// Animated field group for dynamic forms
export function AnimatedFields({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4 animate-in fade-in-50 duration-200", className)}>
      {children}
    </div>
  )
}