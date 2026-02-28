'use client'

import { useState, useEffect, Activity } from 'react'
import Image, { ImageProps } from 'next/image'

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

    const throwImage = !hasError && imgSrc && src;
    const transitionName = `img-${src.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)}`

    return (<>
        <Activity mode={!throwImage ? 'visible' : 'hidden'} >
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                <span className={`material-symbols-outlined text-4xl text-text-main/80`}>{iconFallback}</span>
            </div>
        </Activity>

        <Activity mode={throwImage ? 'visible' : 'hidden'} >
            {as !== 'next' ? <img
                src={imgSrc || undefined}
                alt={alt}
                className={className}
                onError={handleError}
                style={{ viewTransitionName: transitionName } as React.CSSProperties}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...props as any} // Cast because ImageProps has Next.js specific props
            /> : (imgSrc ? <Image
                src={imgSrc}
                alt={alt}
                className={className}
                onError={handleError}
                style={{ viewTransitionName: transitionName } as React.CSSProperties}
                {...props}
            /> : null)}
        </Activity>
    </>
    )
}
