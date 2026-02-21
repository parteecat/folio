import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  images: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

/**
 * 图片灯箱组件
 * 支持：左右切换、缩放、键盘快捷键(ESC关闭, 左右箭头切换)
 */
export function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  // 重置状态当打开时
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setScale(1)
    }
  }, [isOpen, initialIndex])

  // 键盘事件处理
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrev()
          break
        case 'ArrowRight':
          goToNext()
          break
        case '+':
        case '=':
          zoomIn()
          break
        case '-':
          zoomOut()
          break
        case '0':
          resetZoom()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, images.length])

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    setScale(1)
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    setScale(1)
  }, [images.length])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 3))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.5, 0.5))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1)
  }, [])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* 顶部工具栏 */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-4"
      >
        {/* 图片计数 */}
        <div className="text-sm text-white/80">
          {currentIndex + 1} / {images.length}
        </div>

        {/* 缩放控制 */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              zoomOut()
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            title="缩小 (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-sm text-white/80">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              zoomIn()
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            title="放大 (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            title="关闭 (ESC)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 图片显示区域 */}
      <div
        className="relative flex h-full w-full items-center justify-center p-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 上一张按钮 */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToPrev()
            }}
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            title="上一张 (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* 图片 */}
        <img
          src={currentImage}
          alt={`图片 ${currentIndex + 1}`}
          className={cn(
            'max-h-full max-w-full object-contain transition-transform duration-200',
            isDragging && 'cursor-grabbing',
            scale > 1 && 'cursor-grab'
          )}
          style={{
            transform: `scale(${scale})`,
          }}
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
        />

        {/* 下一张按钮 */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            title="下一张 (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* 底部缩略图 */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4"
        >
          <div className="flex justify-center gap-2">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(index)
                  setScale(1)
                }}
                className={cn(
                  'h-12 w-12 overflow-hidden rounded border-2 transition-all',
                  index === currentIndex
                    ? 'border-white'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 提示文字 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
        ← → 切换 | ESC 关闭 | +/- 缩放
      </div>
    </div>
  )
}
