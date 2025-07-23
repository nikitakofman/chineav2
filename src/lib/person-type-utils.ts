import { Briefcase, ShoppingBag, Users } from 'lucide-react'

export function getPersonTypeInfo(typeName: string) {
  const normalizedType = typeName.toLowerCase()
  
  switch (normalizedType) {
    case 'expert':
      return {
        icon: Briefcase,
        color: 'bg-purple-500',
        lightColor: 'bg-purple-50 dark:bg-purple-950/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        hoverColor: 'hover:border-purple-300 dark:hover:border-purple-700',
        textColor: 'text-purple-500',
      }
    case 'client':
      return {
        icon: Users,
        color: 'bg-blue-500',
        lightColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        hoverColor: 'hover:border-blue-300 dark:hover:border-blue-700',
        textColor: 'text-blue-500',
      }
    case 'seller':
      return {
        icon: ShoppingBag,
        color: 'bg-green-500',
        lightColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-green-200 dark:border-green-800',
        hoverColor: 'hover:border-green-300 dark:hover:border-green-700',
        textColor: 'text-green-500',
      }
    default:
      return {
        icon: Users,
        color: 'bg-gray-500',
        lightColor: 'bg-gray-50 dark:bg-gray-950/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        hoverColor: 'hover:border-gray-300 dark:hover:border-gray-700',
        textColor: 'text-gray-500',
      }
  }
}