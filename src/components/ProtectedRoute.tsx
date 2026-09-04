import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="w-full space-y-6 py-8 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-gray-200" />
          <Skeleton className="h-4 w-96 bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-28 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-28 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-28 w-full bg-gray-200 rounded-lg" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-6 w-48 bg-gray-200" />
          <Skeleton className="h-16 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-16 w-full bg-gray-200 rounded-lg" />
          <Skeleton className="h-16 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
