import { useState, useCallback, useRef, useEffect } from 'react'
import { X, Image as ImageIcon, Film, Smile, Send, Check } from 'lucide-react'
import Plyr from 'plyr-react'
import 'plyr-react/plyr.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { ImageLightbox } from './ImageLightbox'
import { api } from '@/api/client'
import { cn, generateSlug } from '@/lib/utils'
import type { ShuoAttachment, PostListItem } from '@/types'

interface ShuoPostModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingPost?: PostListItem | null
}

/**
 * 说说发布弹窗
 * 类似朋友圈/QQ空间说说的发布界面
 * 支持：文字、图片(最多9张)、视频、GIF
 */
export function ShuoPostModal({ open, onClose, onSuccess, editingPost }: ShuoPostModalProps) {
  // 判断是否是编辑模式（有有效的 id）
  const isEditing = editingPost && 'id' in editingPost && editingPost.id
  
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<ShuoAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载编辑内容
  useEffect(() => {
    // 打开弹窗时
    if (open) {
      // 如果是编辑模式（有有效 ID）
      if (isEditing && editingPost) {
        // 加载内容
        setContent(editingPost.excerpt || '')
        
        // 加载附件
        if (editingPost.shuoAttachments?.length) {
          setAttachments(editingPost.shuoAttachments)
        } else if (editingPost.images?.length) {
          // 兼容旧数据
          setAttachments(
            editingPost.images.map((url, index) => ({
              id: `legacy-${index}`,
              type: url.toLowerCase().endsWith('.gif') ? 'GIF' : 'IMAGE',
              url,
            }))
          )
        } else {
          setAttachments([])
        }
      } else {
        // 新建模式：清空表单
        setContent('')
        setAttachments([])
      }
    }
  }, [editingPost, open, isEditing])

  // 计算剩余可添加数量
  const imageCount = attachments.filter((a) => a.type === 'IMAGE').length
  const videoCount = attachments.filter((a) => a.type === 'VIDEO').length
  const gifCount = attachments.filter((a) => a.type === 'GIF').length
  const canAddImage = imageCount < 9 && videoCount === 0
  const canAddVideo = videoCount === 0 && imageCount === 0 && gifCount === 0
  const canAddGif = gifCount === 0 && videoCount === 0 && imageCount === 0

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true)
      try {
        const response = await api.upload(file)
        
        // 判断文件类型
        const mimeType = file.type
        let type: 'IMAGE' | 'VIDEO' | 'GIF'
        
        if (mimeType.startsWith('video/')) {
          type = 'VIDEO'
        } else if (mimeType === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
          type = 'GIF'
        } else {
          type = 'IMAGE'
        }

        const newAttachment: ShuoAttachment = {
          id: Date.now().toString(),
          type,
          url: response.url,
          mimeType,
          size: file.size,
        }

        setAttachments((prev) => [...prev, newAttachment])
      } catch (error) {
        console.error('Upload failed:', error)
        alert('上传失败，请重试')
      } finally {
        setIsUploading(false)
      }
    },
    []
  )

  // 处理文件选择
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return

      // 检查总数量限制
      const newFiles = Array.from(files)
      const newImages = newFiles.filter((f) => f.type.startsWith('image/') && f.type !== 'image/gif' && !f.name.toLowerCase().endsWith('.gif'))
      
      if (newImages.length > 0 && !canAddImage) {
        alert('最多只能添加9张图片，且不能与视频/GIF同时发布')
        return
      }

      // 检查是否包含视频
      const videos = newFiles.filter((f) => f.type.startsWith('video/'))
      if (videos.length > 0 && !canAddVideo) {
        alert('视频不能与图片/GIF同时发布')
        return
      }

      // 检查是否包含GIF
      const gifs = newFiles.filter((f) => f.type === 'image/gif' || f.name.toLowerCase().endsWith('.gif'))
      if (gifs.length > 0 && !canAddGif) {
        alert('GIF不能与图片/视频同时发布')
        return
      }

      // 批量上传
      newFiles.forEach((file) => {
        handleFileUpload(file)
      })

      // 重置 input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [handleFileUpload, canAddImage, canAddVideo, canAddGif]
  )

  // 删除附件
  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // 处理拖拽上传
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      files.forEach((file) => handleFileUpload(file))
    },
    [handleFileUpload]
  )

  // 提交说说
  const handleSubmit = useCallback(async () => {
    if (!content.trim() && attachments.length === 0) {
      alert('请输入内容或添加附件')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && editingPost) {
        // 更新说说
        await api.admin.updatePost(editingPost.id, {
          type: 'SHORT',
          contentHTML: content,
          contentMD: content,
          excerpt: content.trim() || '分享了一条说说',
          shuoAttachments: attachments,
          published: true,
        })
      } else {
        // 创建新说说
        await api.admin.createPost({
          type: 'SHORT',
          slug: `shuo-${Date.now()}`,
          contentHTML: content,
          contentMD: content,
          excerpt: content.trim() || '分享了一条说说',
          shuoAttachments: attachments,
          published: true,
        })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to save shuo:', error)
      alert(isEditing ? '更新失败，请重试' : '发布失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }, [content, attachments, onSuccess, onClose, isEditing, editingPost])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-center text-base font-medium">
            {isEditing ? '编辑说说' : '发布说说'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* 编辑器 */}
          <div className="min-h-[120px]">
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="分享新鲜事..."
              className="border-0 p-0 focus-visible:ring-0"
            />
          </div>

          {/* 附件预览 - 九宫格布局 */}
          {attachments.length > 0 && (
            <ShuoAttachmentGrid
              attachments={attachments}
              onRemove={handleRemoveAttachment}
            />
          )}

          {/* 上传中提示 */}
          {isUploading && (
            <div className="mt-4 rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              上传中...
            </div>
          )}

          {/* 工具栏 */}
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              {/* 图片按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAddImage || isUploading}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

              {/* 视频按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAddVideo || isUploading}
              >
                <Film className="h-5 w-5" />
              </Button>

              {/* 表情按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* 字数限制提示 */}
              {content.length > 0 && (
                <span
                  className={cn(
                    'text-xs',
                    content.length > 2000 ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {content.length}/2000
                </span>
              )}

              {/* 发布按钮 */}
              <Button
                size="sm"
                disabled={
                  isSubmitting ||
                  (!content.trim() && attachments.length === 0) ||
                  content.length > 2000
                }
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  isEditing ? '更新中...' : '发布中...'
                ) : isEditing ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    更新
                  </>
                ) : (
                  <>
                    <Send className="mr-1 h-4 w-4" />
                    发布
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple={canAddImage}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 说说附件九宫格
 * 参考微信朋友圈的图片布局
 * 视频特殊处理：全宽显示，支持横竖屏自适应
 */
function ShuoAttachmentGrid({
  attachments,
  onRemove,
  readOnly = false,
}: {
  attachments: ShuoAttachment[]
  onRemove?: (id: string) => void
  readOnly?: boolean
}) {
  const count = attachments.length
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // 过滤出可预览的图片（IMAGE 和 GIF）
  const previewableImages = attachments
    .filter((a) => a.type === 'IMAGE' || a.type === 'GIF')
    .map((a) => a.url)

  // 检测是否是纯视频内容（只有视频没有图片）
  const hasVideo = attachments.some((a) => a.type === 'VIDEO')
  const hasImages = attachments.some((a) => a.type === 'IMAGE' || a.type === 'GIF')
  const isVideoOnly = hasVideo && !hasImages && attachments.length === 1

  // 获取网格类名
  const getGridClass = () => {
    // 纯视频：不使用网格，全宽显示
    if (isVideoOnly) return ''
    if (count === 1) return 'grid-cols-1 max-w-[300px]'
    if (count === 2 || count === 4) return 'grid-cols-2 max-w-[300px]'
    return 'grid-cols-3 max-w-[400px]'
  }

  // 获取单个项目的类名
  const getItemClass = (index: number) => {
    // 纯视频：自适应
    if (isVideoOnly) return ''
    // 单张图片：自适应宽高比
    if (count === 1) {
      const attachment = attachments[0]
      if (attachment.type === 'GIF') {
        return 'aspect-auto'
      }
      return 'aspect-auto'
    }
    // 其他情况：固定正方形
    return 'aspect-square'
  }

  // 处理图片点击
  const handleImageClick = (index: number, attachment: ShuoAttachment) => {
    if (attachment.type === 'IMAGE' || attachment.type === 'GIF') {
      // 计算在可预览图片列表中的索引
      const previewIndex = previewableImages.indexOf(attachment.url)
      if (previewIndex >= 0) {
        setLightboxIndex(previewIndex)
        setLightboxOpen(true)
      }
    }
  }

  // 如果是纯视频，单独渲染视频播放器
  if (isVideoOnly) {
    const videoAttachment = attachments.find((a) => a.type === 'VIDEO')!
    return (
      <>
        <div className="relative mt-4">
          <VideoPlayer 
            src={videoAttachment.url} 
            width={videoAttachment.width}
            height={videoAttachment.height}
          />

          {/* 删除按钮（编辑模式） */}
          {onRemove && (
            <button
              onClick={() => onRemove(videoAttachment.id)}
              className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-opacity hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div
        className={cn('mt-4 grid gap-1', getGridClass())}
        onDragOver={(e) => e.preventDefault()}
      >
        {attachments.map((attachment, index) => (
          <div
            key={attachment.id}
            className={cn(
              'relative overflow-hidden rounded-lg bg-muted',
              getItemClass(index),
              (attachment.type === 'IMAGE' || attachment.type === 'GIF') && !onRemove && 'cursor-pointer'
            )}
            onClick={() => !onRemove && handleImageClick(index, attachment)}
          >
            {attachment.type === 'IMAGE' && (
              <img
                src={attachment.url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            )}

            {attachment.type === 'VIDEO' && (
              <div className="h-full w-full">
                <VideoPlayer 
                  src={attachment.url}
                  width={attachment.width}
                  height={attachment.height}
                />
              </div>
            )}

            {attachment.type === 'GIF' && (
              <img
                src={attachment.url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            )}

            {/* 删除按钮 */}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(attachment.id)
                }}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                style={{ opacity: 1 }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 图片灯箱 */}
      {!readOnly && (
        <ImageLightbox
          images={previewableImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}

export { ShuoAttachmentGrid }

/**
 * 视频播放器组件
 * 使用 Plyr - 功能完善的 HTML5 视频播放器
 * 支持横屏/竖屏自适应，无黑边
 */
function VideoPlayer({
  src,
  width,
  height,
}: {
  src: string
  width?: number
  height?: number
}) {
  const plyrRef = useRef<Plyr>(null)
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(16 / 9)
  const [isPortrait, setIsPortrait] = useState(false)

  // Plyr 配置
  const plyrOptions = {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'mute',
      'volume',
      'settings',
      'fullscreen',
    ],
    settings: ['quality', 'speed'],
    // 不设置固定比例，让视频自适应
    ratio: null,
  }

  // 处理视频元数据加载
  const handleLoadedMetadata = () => {
    const video = plyrRef.current?.plyr?.media as HTMLVideoElement
    if (video && video.videoWidth && video.videoHeight) {
      const ratio = video.videoWidth / video.videoHeight
      setVideoAspectRatio(ratio)
      setIsPortrait(ratio < 0.9)
    } else if (width && height) {
      const ratio = width / height
      setVideoAspectRatio(ratio)
      setIsPortrait(ratio < 0.9)
    }
  }

  // 计算容器样式 - 根据实际视频比例
  const containerStyle: React.CSSProperties = {
    aspectRatio: `${videoAspectRatio}`,
    ...(isPortrait
      ? {
          maxWidth: '350px',
          maxHeight: '600px',
          margin: '0 auto',
        }
      : {
          maxHeight: '500px',
        }),
  }

  return (
    <div 
      className="plyr-wrapper overflow-hidden rounded-lg bg-black" 
      style={containerStyle}
    >
      <style>{`
        .plyr-wrapper .plyr {
          width: 100%;
          height: 100%;
        }
        .plyr-wrapper .plyr__video-wrapper {
          background: transparent;
        }
        .plyr-wrapper video {
          object-fit: contain;
          width: 100%;
          height: 100%;
        }
        /* 确保控制条不会遮挡视频太多 */
        .plyr-wrapper .plyr__controls {
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
        }
      `}</style>
      <Plyr
        ref={plyrRef}
        source={{
          type: 'video',
          sources: [
            {
              src,
              type: 'video/mp4',
            },
          ],
        }}
        options={plyrOptions}
        onLoadedMetadata={handleLoadedMetadata}
      />
    </div>
  )
}
