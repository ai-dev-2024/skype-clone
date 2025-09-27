import React from 'react'

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  online?: boolean
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  className = '',
  online = false
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  }

  const getFallbackText = () => {
    if (fallback) return fallback
    if (alt && alt.length > 0) {
      return alt.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    }
    return 'U'
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center overflow-hidden`}>
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-medium text-gray-700">
            {getFallbackText()}
          </span>
        )}
      </div>

      {online && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  )
}

export default Avatar
