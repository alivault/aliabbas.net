import React from 'react'
import Image from 'next/image'

interface AvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  src?: string
  alt?: string
  quality?: number
  priority?: boolean
}

const sizeMapping = {
  xs: 16,
  sm: 20,
  md: 40,
  lg: 64,
  xl: 80,
  '2xl': 144,
}

const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  src = '/img/ali-headshot.jpg',
  alt = 'Avatar image',
  quality = 100,
  priority = false,
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={sizeMapping[size]}
      height={sizeMapping[size]}
      quality={quality}
      priority={priority}
      className='relative shrink-0 overflow-hidden rounded-full'
    />
  )
}

export default Avatar
