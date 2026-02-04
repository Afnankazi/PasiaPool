'use client'
import { useSession } from "next-auth/react"
import { LoaderFive } from "@/components/ui/loader"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  const { status } = useSession()

  if (status === "loading") {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoaderFive text="Loading..." />
        </div>
      )
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoaderFive text="Loading..." />
      </div>
    )
  }

  return <>{children}</>
}