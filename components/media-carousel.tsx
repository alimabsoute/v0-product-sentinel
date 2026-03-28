'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/mock-data'

interface MediaCarouselProps {
  product: Product
}

export function MediaCarousel({ product }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(!!product.videoUrl)

  const hasVideo = !!product.videoUrl
  const totalItems = product.screenshots.length + (hasVideo ? 1 : 0)

  const goTo = (index: number) => {
    if (index < 0) {
      setCurrentIndex(totalItems - 1)
    } else if (index >= totalItems) {
      setCurrentIndex(0)
    } else {
      setCurrentIndex(index)
    }
    setShowVideo(hasVideo && index === 0)
  }

  const currentIsVideo = hasVideo && currentIndex === 0
  const screenshotIndex = hasVideo ? currentIndex - 1 : currentIndex

  return (
    <div className="space-y-3">
      {/* Main display */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-secondary">
        {currentIsVideo && product.videoUrl ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <iframe
              src={product.videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          product.screenshots[screenshotIndex] && (
            <Image
              src={product.screenshots[screenshotIndex]}
              alt={`${product.name} screenshot ${screenshotIndex + 1}`}
              fill
              className="object-cover transition-opacity duration-300"
            />
          )
        )}

        {/* Navigation arrows */}
        {totalItems > 1 && (
          <>
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background hover:scale-110"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {Array.from({ length: totalItems }).map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                currentIndex === index
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/75'
              )}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {hasVideo && (
          <button
            onClick={() => goTo(0)}
            className={cn(
              'relative shrink-0 h-16 w-24 overflow-hidden rounded-lg transition-all',
              currentIndex === 0
                ? 'ring-2 ring-[var(--sentinel-accent)]'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            {product.screenshots[0] ? (
              <Image
                src={product.screenshots[0]}
                alt="Video thumbnail"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-secondary" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Play className="h-6 w-6 text-white" fill="white" />
            </div>
          </button>
        )}
        {product.screenshots.map((screenshot, index) => (
          <button
            key={index}
            onClick={() => goTo(hasVideo ? index + 1 : index)}
            className={cn(
              'relative shrink-0 h-16 w-24 overflow-hidden rounded-lg transition-all',
              currentIndex === (hasVideo ? index + 1 : index)
                ? 'ring-2 ring-[var(--sentinel-accent)]'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            <Image
              src={screenshot}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
