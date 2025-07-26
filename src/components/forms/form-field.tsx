"use client"

import * as React from "react"
import { FieldValues, FieldPath } from "react-hook-form"
import { cn } from "@/lib/utils"
import {
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormFieldComponentProps } from "@/types/form-types"

// FormField wrapper component that combines Label, Input, and error display
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  placeholder,
  required = false,
  disabled = false,
  className,
  type = "text",
  showRequiredIndicator = true,
  helperText,
  ...props
}: FormFieldComponentProps<TFieldValues, TName>) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn("grid gap-2", className)}>
          {label && (
            <FormLabel className="text-sm font-medium">
              {label}
              {required && showRequiredIndicator && (
                <span className="text-destructive ml-1" aria-label="required">
                  *
                </span>
              )}
            </FormLabel>
          )}
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                fieldState.error && "border-destructive focus-visible:border-destructive"
              )}
              {...field}
              {...props}
            />
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-muted-foreground">
              {description}
            </FormDescription>
          )}
          {helperText && !fieldState.error && (
            <p className="text-xs text-muted-foreground">{helperText}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Specialized form field variants for common use cases
export function EmailField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: Omit<FormFieldComponentProps<TFieldValues, TName>, "type">) {
  return <FormField {...props} type="email" />
}

export function NumberField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: Omit<FormFieldComponentProps<TFieldValues, TName>, "type">) {
  return <FormField {...props} type="number" />
}

export function TelField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: Omit<FormFieldComponentProps<TFieldValues, TName>, "type">) {
  return <FormField {...props} type="tel" />
}

export function UrlField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: Omit<FormFieldComponentProps<TFieldValues, TName>, "type">) {
  return <FormField {...props} type="url" />
}

export function SearchField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: Omit<FormFieldComponentProps<TFieldValues, TName>, "type">) {
  return <FormField {...props} type="search" />
}