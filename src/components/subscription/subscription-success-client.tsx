'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import confetti from 'canvas-confetti'

export function SubscriptionSuccessClient() {
  const router = useRouter()
  const t = useTranslations('subscription')
  const locale = useLocale()
  const [countdown, setCountdown] = useState(3)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30) // 30 updates over 3 seconds
      })
    }, 100)

    return () => {
      clearInterval(timer)
      clearInterval(progressInterval)
    }
  }, [])

  // Separate effect for navigation
  useEffect(() => {
    if (countdown === 0) {
      router.push('/dashboard')
    }
  }, [countdown, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 bg-green-100 dark:bg-green-900/20 rounded-full animate-pulse" />
          </div>
          <CheckCircle2 className="h-32 w-32 text-green-600 mx-auto relative z-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-600">
            {locale === 'fr' ? 'Abonnement Réussi!' : 'Subscription Successful!'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {locale === 'fr' ? 'Bienvenue dans Premium!' : 'Welcome to Premium!'}
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <p className="font-medium">
            {locale === 'fr' 
              ? 'Vous avez maintenant accès à toutes les fonctionnalités Premium'
              : 'You now have access to all Premium features'
            }
          </p>
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {locale === 'fr' 
              ? `Redirection vers le tableau de bord dans ${countdown} secondes...`
              : `Redirecting to dashboard in ${countdown} seconds...`
            }
          </p>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            {locale === 'fr'
              ? 'Un email de confirmation a été envoyé à votre adresse'
              : 'A confirmation email has been sent to your address'
            }
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}