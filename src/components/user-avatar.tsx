"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import Image from "next/image"

interface UserAvatarProps {
  user: {
    name: string
    image?: string | null
  }
  size?: "sm" | "md" | "lg"
  className?: string
  fallbackClassName?: string
  showFallbackIcon?: boolean
}

export function UserAvatar({ 
  user, 
  size = "md", 
  className = "", 
  fallbackClassName = "",
  showFallbackIcon = false
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Size configurations
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6"
  }

  const hasValidImage = user.image && !imageError && user.image.trim() !== ""

  return (
    <Avatar className={`${sizeClasses[size]} rounded-full ${className}`}>
      {hasValidImage && (
        <AvatarImage 
          src={user.image!} 
          alt={user.name}
          onError={handleImageError}
        />
      )}
      <AvatarFallback className={`rounded-full bg-primary text-primary-foreground ${fallbackClassName}`}>
        {showFallbackIcon ? (
          <User className={iconSizes[size]} />
        ) : (
          getInitials(user.name)
        )}
      </AvatarFallback>
    </Avatar>
  )
}

// Simple avatar for use in tight spaces
export function SimpleUserAvatar({ 
  user, 
  size = 20,
  className = ""
}: {
  user: { name: string; image?: string | null }
  size?: number
  className?: string
}) {
  const [imageError, setImageError] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  const hasValidImage = user.image && !imageError && user.image.trim() !== ""

  if (hasValidImage) {
    return (
      <Image 
        src={user.image!} 
        alt={user.name}
        className={`rounded-full ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImageError(true)}
        width={100}
        height={100}
      />
    )
  }

  return (
    <div 
      className={`bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium ${className}`}
      style={{ width: size, height: size }}
    >
      {getInitials(user.name)}
    </div>
  )
}
