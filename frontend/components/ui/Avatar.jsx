'use client'

import Image from 'next/image'

export function Avatar({
  src,
  name,
  size = 'md',
  isOnline = false,
  className = '',
}) {
  const getInitials = (fullName) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const sizes = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  }

  const initials = name ? getInitials(name) : '?'

  return (
    <div className={`relative ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={name || 'Avatar'}
          width={48}
          height={48}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`
          ${sizes[size]} rounded-full
          bg-accent text-white
          flex items-center justify-center font-semibold
        `}>
          {initials}
        </div>
      )}
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full ring-2 ring-bg" />
      )}
    </div>
  )
}
