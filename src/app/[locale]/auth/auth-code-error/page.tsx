import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <Card className="w-full max-w-md sm:max-w-lg mx-auto">
        <CardHeader className="text-center space-y-3 px-4 sm:px-6">
          <div className="flex justify-center mb-2">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            There was an error confirming your authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            The authentication link may have expired or already been used. 
            Please try signing in again or request a new confirmation email.
          </p>
          <div className="flex justify-center pt-2">
            <Link href="/connect">
              <Button className="h-11 px-6 text-base font-medium">Back to Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}