"use client"

import * as React from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { PasswordInputProps } from "@/types/form-types"

// Password strength calculation
function calculatePasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  if (!password) return { score: 0, label: "None", color: "bg-gray-200" }
  
  let score = 0
  const checks = [
    password.length >= 8, // Length
    /[a-z]/.test(password), // Lowercase
    /[A-Z]/.test(password), // Uppercase
    /[0-9]/.test(password), // Numbers
    /[^A-Za-z0-9]/.test(password), // Special chars
  ]
  
  score = checks.filter(Boolean).length
  
  if (score <= 1) return { score: 20, label: "Very Weak", color: "bg-red-500" }
  if (score === 2) return { score: 40, label: "Weak", color: "bg-orange-500" }
  if (score === 3) return { score: 60, label: "Fair", color: "bg-yellow-500" }
  if (score === 4) return { score: 80, label: "Good", color: "bg-blue-500" }
  return { score: 100, label: "Strong", color: "bg-green-500" }
}

export function PasswordInput({
  value = "",
  onChange,
  placeholder = "Enter password",
  disabled = false,
  className,
  showStrength = false,
  autoComplete = "current-password",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  
  const strength = React.useMemo(() => 
    calculatePasswordStrength(value), 
    [value]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Lock className="h-4 w-4" />
        </div>
        
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn("pl-10 pr-10", className)}
          {...props}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      
      {showStrength && (isFocused || value) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Password strength:</span>
            <span className={cn(
              "font-medium",
              strength.score <= 40 && "text-red-600",
              strength.score > 40 && strength.score <= 60 && "text-yellow-600",
              strength.score > 60 && strength.score <= 80 && "text-blue-600",
              strength.score > 80 && "text-green-600"
            )}>
              {strength.label}
            </span>
          </div>
          
          <Progress 
            value={strength.score} 
            className="h-2"
            style={{
              background: `linear-gradient(to right, ${strength.color} ${strength.score}%, rgb(229 231 235) ${strength.score}%)`
            }}
          />
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Password should include:</p>
            <ul className="space-y-0.5 ml-2">
              <li className={cn(value.length >= 8 ? "text-green-600" : "text-muted-foreground")}>
                ✓ At least 8 characters
              </li>
              <li className={cn(/[a-z]/.test(value) ? "text-green-600" : "text-muted-foreground")}>
                ✓ Lowercase letter
              </li>
              <li className={cn(/[A-Z]/.test(value) ? "text-green-600" : "text-muted-foreground")}>
                ✓ Uppercase letter
              </li>
              <li className={cn(/[0-9]/.test(value) ? "text-green-600" : "text-muted-foreground")}>
                ✓ Number
              </li>
              <li className={cn(/[^A-Za-z0-9]/.test(value) ? "text-green-600" : "text-muted-foreground")}>
                ✓ Special character
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}