import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Heart, Eye, Calendar } from 'lucide-react'
import { useParams, Navigate, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ThreeColumnLayout } from '@/components/layout/ThreeColumnLayout'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { ReadingProgress } from '@/components/post/ReadingProgress'
import { Toc } from '@/components/post/Toc'
import { ImageLightbox } from '@/components/post/ImageLightbox'
import { LikeButton } from '@/components/feed/LikeButton'
import { api } from '@/api/client'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import type { PostDetail } from '@/types'

/**
 * 文章内容渲染组件
 * 处理HTML内容，添加图片点击事件和代码块复制功能
 */
function PostContent({
  html,
  contentRef,
  onImageClick,
}: {
  html: string
  contentRef: React.RefObject<HTMLElement | null>
  onImageClick: (src: string) => void
}) {
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    // 为所有图片添加点击事件
    const images = content.querySelectorAll('img')
    images.forEach((img) => {
      img.style.cursor = 'zoom-in'
      img.addEventListener('click', () => onImageClick(img.src))
    })

    // 为所有代码块添加复制按钮
    const preElements = content.querySelectorAll('pre')
    preElements.forEach((pre) => {
      const codeElement = pre.querySelector('code')
      if (codeElement && !pre.querySelector('.copy-code-btn')) {
        const code = codeElement.textContent || ''
        pre.style.position = 'relative'

        const button = document.createElement('button')
        button.className = 'copy-code-btn'
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span style="margin-left: 4px">复制</span>
        `

        button.addEventListener('click', async () => {
          await navigator.clipboard.writeText(code)
          button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style="margin-left: 4px">已复制</span>
          `
          button.style.background = 'hsl(var(--primary))'
          button.style.color = 'hsl(var(--primary-foreground))'
          button.style.borderColor = 'hsl(var(--primary))'

          setTimeout(() => {
            button.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span style="margin-left: 4px">复制</span>
            `
            button.style.background = ''
            button.style.color = ''
            button.style.borderColor = ''
          }, 2000)
        })

        pre.appendChild(button)
      }
    })

    return () => {
      images.forEach((img) => {
        img.removeEventListener('click', () => onImageClick(img.src))
      })
    }
  }, [html, contentRef, onImageClick])

  return (
    <div
      ref={contentRef as React.RefObject<HTMLDivElement>}
      className="prose prose-lg max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * 文章详情页
 *
 * 功能：
 * - 显示文章完整内容
 * - 阅读进度条
 * - 目录导航（仅长文章显示）
 * - 代码块高亮+复制
 * - 图片灯箱
 * - 点赞功能
 */
export default function Post() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const contentRef = useRef<HTMLElement>(null)

  const [post, setPost] = useState<PostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState('')

  // 加载文章数据
  useEffect(() => {
    if (!slug) return

    setIsLoading(true)
    api.posts
      .get(slug)
      .then((data) => {
        setPost(data)
      })
      .catch((error) => {
        console.error('Failed to load post:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [slug])

  // 处理图片点击
  const handleImageClick = useCallback((src: string) => {
    setCurrentImage(src)
    setLightboxOpen(true)
  }, [])

  // 处理点赞
  const handleLike = useCallback(() => {
    if (post) {
      setPost({ ...post, likeCount: post.likeCount + 1 })
    }
  }, [post])

  if (!slug) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return (
      <ThreeColumnLayout
        leftSidebar={<LeftSidebar />}
        rightSidebar={<RightSidebar />}
      >
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </ThreeColumnLayout>
    )
  }

  if (!post) {
    return (
      <ThreeColumnLayout
        leftSidebar={<LeftSidebar />}
        rightSidebar={<RightSidebar />}
      >
        <div className="flex h-[50vh] flex-col items-center justify-center">
          <p className="text-lg text-muted-foreground">文章不存在</p>
          <Button variant="link" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </ThreeColumnLayout>
    )
  }

  const isArticle = post.type === 'ARTICLE'

  return (
    <>
      {/* 阅读进度条（仅长文章显示） */}
      {isArticle && <ReadingProgress />}

      <ThreeColumnLayout
        leftSidebar={<LeftSidebar />}
        rightSidebar={
          isArticle ? (
            <div className="hidden xl:block">
              <Toc contentRef={contentRef} />
            </div>
          ) : (
            <RightSidebar />
          )
        }
      >
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="line-clamp-1 flex-1 text-lg font-semibold">
            {post.title || '文章详情'}
          </h1>
        </header>

        {/* 文章内容区域 */}
        <article className="p-4 lg:p-8">
          {/* 文章头部信息（仅长文章显示详细头部） */}
          {isArticle && (
            <header className="mb-8">
              {post.coverImage && (
                <div className="mb-6 aspect-video overflow-hidden rounded-lg">
                  <img
                    src={post.coverImage}
                    alt={post.title || ''}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <h1 className="mb-4 text-3xl font-bold leading-tight lg:text-4xl">
                {post.title}
              </h1>

              {/* 作者和元信息 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author?.avatar || undefined} />
                    <AvatarFallback>
                      {post.author?.name?.[0] || '博'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author?.name || '博主'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount} 阅读</span>
                </div>

                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{post.likeCount} 点赞</span>
                </div>
              </div>

              {/* 标签 */}
              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link key={tag.id} to={`/tag/${tag.slug}`}>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </header>
          )}

          {/* 文章内容 */}
          <PostContent
            html={post.contentHTML}
            contentRef={contentRef}
            onImageClick={handleImageClick}
          />

          {/* 底部操作栏 */}
          <footer className="mt-12 border-t pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <LikeButton
                  postId={post.id}
                  initialCount={post.likeCount}
                  onLike={handleLike}
                />

                {!isArticle && (
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(post.publishedAt || post.createdAt)}
                  </span>
                )}
              </div>

              {/* 分享按钮等可以在这里添加 */}
            </div>
          </footer>
        </article>
      </ThreeColumnLayout>

      {/* 图片灯箱 */}
      <ImageLightbox
        src={currentImage}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
