"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { FormCardProps } from "@/types/form-types"

export function FormCard({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
  footer,
}: FormCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      {(title || description) && (
        <CardHeader className={cn("space-y-1", headerClassName)}>
          {title && <CardTitle className="text-xl font-semibold">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      
      <CardContent className={cn("space-y-6", contentClassName)}>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className="flex items-center justify-end space-x-2 pt-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}

// Specialized form card variants
export function LoginCard(props: Omit<FormCardProps, "title" | "description">) {
  return (
    <FormCard
      {...props}
      title="Sign In"
      description="Enter your credentials to access your account"
      className={cn("max-w-md mx-auto", props.className)}
    />
  )
}

export function RegisterCard(props: Omit<FormCardProps, "title" | "description">) {
  return (
    <FormCard
      {...props}
      title="Create Account"
      description="Fill out the form below to create your account"
      className={cn("max-w-md mx-auto", props.className)}
    />
  )
}

export function SettingsCard(props: Omit<FormCardProps, "title">) {
  return (
    <FormCard
      {...props}
      title="Settings"
      className={cn("max-w-2xl", props.className)}
    />
  )
}

export function ProfileCard(props: Omit<FormCardProps, "title" | "description">) {
  return (
    <FormCard
      {...props}
      title="Profile Information"
      description="Update your personal information and preferences"
      className={cn("max-w-2xl", props.className)}
    />
  )
}

export function CompactFormCard({
  children,
  className,
  contentClassName,
  ...props
}: FormCardProps) {
  return (
    <FormCard
      {...props}
      className={cn("shadow-sm", className)}
      headerClassName="pb-3"
      contentClassName={cn("space-y-4", contentClassName)}
    >
      {children}
    </FormCard>
  )
}

export function ModalFormCard({
  children,
  className,
  ...props
}: FormCardProps) {
  return (
    <FormCard
      {...props}
      className={cn("border-0 shadow-none", className)}
      headerClassName="px-0 pt-0"
      contentClassName="px-0 space-y-4"
    >
      {children}
    </FormCard>
  )
}

// Form wrapper with automatic spacing and layout
export function FormWrapper({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("w-full max-w-2xl mx-auto p-6", className)}>
      {children}
    </div>
  )
}

// Grid layout for multiple form cards
export function FormGrid({
  children,
  columns = 1,
  className,
}: {
  children: React.ReactNode
  columns?: 1 | 2 | 3
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 lg:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  )
}

// Stepper form card for multi-step forms
export function StepperFormCard({
  title,
  description,
  children,
  currentStep,
  totalSteps,
  stepTitles = [],
  className,
  ...props
}: FormCardProps & {
  currentStep: number
  totalSteps: number
  stepTitles?: string[]
}) {
  return (
    <FormCard
      {...props}
      title={title}
      description={description}
      className={cn("max-w-2xl mx-auto", className)}
      headerClassName="border-b pb-4"
    >
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        
        {stepTitles.length > 0 && (
          <div className="flex justify-between mt-2">
            {stepTitles.map((stepTitle, index) => (
              <span
                key={index}
                className={cn(
                  "text-xs",
                  index + 1 <= currentStep
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {stepTitle}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {children}
    </FormCard>
  )
}