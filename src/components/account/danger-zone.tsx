'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LogOut, Trash2, AlertTriangle } from 'lucide-react'

interface DangerZoneProps {
  onSignOut: () => Promise<void>
}

export function DangerZone({ onSignOut }: DangerZoneProps) {
  const t = useTranslations('account')
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const handleDeleteAccount = async () => {
    if (deleteConfirmation === 'DELETE') {
      // TODO: Implement account deletion
      console.log('Account deletion requested')
    }
  }

  return (
    <>
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-600">{t('dangerZone')}</CardTitle>
          </div>
          <CardDescription>{t('dangerZoneDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              onClick={() => setShowSignOutDialog(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('signOut')}
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmSignOut')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('signOutDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onSignOut}>
              {t('signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {t('deleteAccountTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{t('deleteAccountWarning')}</p>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t('deleteAccountConfirm')}
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2 w-full px-3 py-2 border border-red-300 rounded-md text-center font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('permanentlyDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}