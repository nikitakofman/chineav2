"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { FormSectionProps } from "@/types/form-types"

export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  className,
  headerClassName,
  contentClassName,
  required = false,
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  const SectionHeader = () => (
    <div className={cn("space-y-1", headerClassName)}>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">
          {title}
          {required && (
            <span className="text-destructive ml-1" aria-label="required section">
              *
            </span>
          )}
        </h3>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )

  const SectionContent = () => (
    <div className={cn("space-y-4", contentClassName)}>
      {children}
    </div>
  )

  if (collapsible) {
    return (
      <Collapsible
        open={isExpanded}
        onOpenChange={setIsExpanded}
        className={cn("space-y-4", className)}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2 w-full">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex-1 text-left">
                <SectionHeader />
              </div>
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4">
          <SectionContent />
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <SectionHeader />
      <SectionContent />
    </div>
  )
}

// Specialized section variants
export function RequiredSection(props: Omit<FormSectionProps, "required">) {
  return <FormSection {...props} required={true} />
}

export function CollapsibleSection(props: Omit<FormSectionProps, "collapsible">) {
  return <FormSection {...props} collapsible={true} />
}

export function CompactSection({
  children,
  className,
  contentClassName,
  ...props
}: FormSectionProps) {
  return (
    <FormSection
      {...props}
      className={cn("space-y-2", className)}
      headerClassName="mb-2"
      contentClassName={cn("space-y-2", contentClassName)}
    >
      {children}
    </FormSection>
  )
}

// Section with separator
export function SeparatedSection({
  children,
  className,
  showTopSeparator = false,
  showBottomSeparator = true,
  ...props
}: FormSectionProps & {
  showTopSeparator?: boolean
  showBottomSeparator?: boolean
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {showTopSeparator && <Separator />}
      <FormSection {...props}>{children}</FormSection>
      {showBottomSeparator && <Separator />}
    </div>
  )
}

// Nested section for sub-sections
export function NestedSection({
  children,
  className,
  headerClassName,
  ...props
}: FormSectionProps) {
  return (
    <FormSection
      {...props}
      className={cn("ml-4 border-l-2 border-muted pl-4", className)}
      headerClassName={cn("text-base", headerClassName)}
    >
      {children}
    </FormSection>
  )
}

// Section group for organizing multiple sections
export function SectionGroup({
  children,
  title,
  description,
  className,
}: {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      
      <div className="space-y-6">
        {React.Children.map(children, (child, index) => (
          <div key={index}>
            {child}
            {index < React.Children.count(children) - 1 && <Separator className="mt-6" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// Advanced section with status indicators
export function StatusSection({
  children,
  status = "default",
  statusMessage,
  className,
  ...props
}: FormSectionProps & {
  status?: "default" | "success" | "warning" | "error"
  statusMessage?: string
}) {
  const statusColors = {
    default: "border-muted",
    success: "border-green-200 bg-green-50/50",
    warning: "border-yellow-200 bg-yellow-50/50",
    error: "border-red-200 bg-red-50/50",
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        statusColors[status],
        className
      )}
    >
      <FormSection {...props}>
        {children}
        {statusMessage && (
          <div className="mt-4">
            <p
              className={cn(
                "text-sm",
                status === "success" && "text-green-700",
                status === "warning" && "text-yellow-700",
                status === "error" && "text-red-700",
                status === "default" && "text-muted-foreground"
              )}
            >
              {statusMessage}
            </p>
          </div>
        )}
      </FormSection>
    </div>
  )
}

// Tabbed sections for complex forms
export function TabbedSections({
  sections,
  className,
}: {
  sections: Array<{
    id: string
    title: string
    content: React.ReactNode
    disabled?: boolean
  }>
  className?: string
}) {
  const [activeTab, setActiveTab] = React.useState(sections[0]?.id)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tab navigation */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => !section.disabled && setActiveTab(section.id)}
              disabled={section.disabled}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap",
                activeTab === section.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground",
                section.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {sections.map((section) => (
          <div
            key={section.id}
            className={cn(
              "space-y-4",
              activeTab !== section.id && "hidden"
            )}
          >
            {section.content}
          </div>
        ))}
      </div>
    </div>
  )
}