import { useState, useRef, useCallback } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onUpload: (file: File) => Promise<string>
  className?: string
}

/**
 * 图片上传组件
 * 支持拖拽上传和点击上传
 */
export function ImageUpload({
  value,
  onChange,
  onUpload,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        await uploadFile(file)
      }
    },
    [onUpload]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        await uploadFile(file)
      }
    },
    [onUpload]
  )

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    try {
      const url = await onUpload(file)
      onChange(url)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleRemove = () => {
    onChange('')
  }

  if (value) {
    return (
      <div className={cn('relative', className)}>
        <img
          src={value}
          alt="封面图"
          className="h-40 w-full rounded-lg object-cover"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col items-center gap-2 text-center">
        {isUploading ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">上传中...</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">点击或拖拽上传图片</p>
            <p className="text-xs text-muted-foreground">支持 JPG、PNG、WebP 格式</p>
          </>
        )}
      </div>
    </div>
  )
}
