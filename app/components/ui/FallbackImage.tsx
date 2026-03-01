'use client'

import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

const icons = {
    quest: 'assignment_late',
    expedition: 'flag',
    user: 'person',
    default: 'image'
}

interface FallbackImageProps extends Omit<ImageProps, 'src'> {
    src: string
    as?: 'img' | 'next'
    type?: 'quest' | 'expedition' | 'user' | 'default'
}

export function FallbackImage({
    src,
    as = 'next',
    type = 'default',
    alt,
    className,
    ...props
}: FallbackImageProps) {

    const [imgSrc, setImgSrc] = useState<string | null>(src)
    const [hasError, setHasError] = useState(false)
    const iconFallback = icons[type] || icons.default

    const handleError = () => {
        if (!hasError) {
            setImgSrc(null)
            setHasError(true)
        }
    }

    const transitionName = `img-${src.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)}`

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {/* Fallback Icon */}
            {(!imgSrc || hasError) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none z-0">
                    <span className="material-symbols-outlined text-4xl text-text-main/80">{iconFallback}</span>
                </div>
            )}

            {/* Main Image */}
            {!hasError && imgSrc && (
                as === 'next' ? (
                    <Image
                        src={imgSrc}
                        alt={alt}
                        className={cn("w-full h-full object-cover", className)}
                        onError={handleError}
                        style={{ viewTransitionName: transitionName } as React.CSSProperties}
                        width={props.width || 500}
                        height={props.height || 500}
                        {...props}
                    />
                ) : (
                    <img
                        src={imgSrc}
                        alt={alt}
                        className={cn("w-full h-full object-cover", className)}
                        onError={handleError}
                        style={{ viewTransitionName: transitionName } as React.CSSProperties}
                        {...(props as unknown as React.ImgHTMLAttributes<HTMLImageElement>)}
                    />
                )
            )}
        </div>
    )
}
