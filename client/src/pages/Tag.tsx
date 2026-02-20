import { useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThreeColumnLayout } from '@/components/layout/ThreeColumnLayout'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { FeedList } from '@/components/feed/FeedList'
import { useUIStore } from '@/store/useStore'
import { api } from '@/api/client'
import type { PostListItem } from '@/types'
import { useState } from 'react'

/**
 * 标签文章列表页面
 *
 * 功能：
 * - 显示特定标签的所有文章
 * - 支持无限滚动加载
 */
export default function Tag() {
  const { slug } = useParams<{ slug: string }>()
  useUIStore()
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [tagName, setTagName] = useState('')

  const isLoadingRef = useRef(isLoading)
  isLoadingRef.current = isLoading

  /**
   * 加载标签文章
   */
  const loadPosts = useCallback(() => {
    if (!slug || isLoadingRef.current) return

    setIsLoading(true)

    const params: { cursor?: string; tag: string; limit: string } = {
      tag: slug,
      limit: '10',
    }

    if (cursor) {
      params.cursor = cursor
    }

    api.posts
      .list(params)
      .then((response) => {
        // 从返回的数据中提取标签名称
        if (response.data.length > 0 && response.data[0].tags) {
          const currentTag = response.data[0].tags.find((t) => t.slug === slug)
          if (currentTag) {
            setTagName(currentTag.name)
          }
        }

        if (cursor) {
          setPosts((prev) => [...prev, ...response.data])
        } else {
          setPosts(response.data)
        }
        setCursor(response.nextCursor)
        setHasMore(response.hasMore)
      })
      .catch((error) => {
        console.error('Failed to load tag posts:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [slug, cursor])

  /**
   * 初始加载
   */
  useEffect(() => {
    // 重置状态
    setPosts([])
    setCursor(undefined)
    setHasMore(true)
    setTagName('')

    // 延迟加载，让状态重置完成
    const timer = setTimeout(() => {
      loadPosts()
    }, 0)

    return () => clearTimeout(timer)
  }, [slug])

  /**
   * 处理加载更多
   */
  const handleLoadMore = useCallback(() => {
    loadPosts()
  }, [loadPosts])

  /**
   * 处理点赞
   */
  const handleLike = useCallback((id: string) => {
    console.log('Liked post:', id)
  }, [])

  return (
    <ThreeColumnLayout
      leftSidebar={<LeftSidebar />}
      rightSidebar={<RightSidebar />}
    >
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">#{tagName || slug}</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} 篇文章
          </p>
        </div>
      </header>

      {/* 文章列表 */}
      <div className="min-h-[calc(100vh-200px)]">
        {posts.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">暂无文章</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              该标签下还没有文章
            </p>
          </div>
        ) : (
          <FeedList
            posts={posts}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onLike={handleLike}
          />
        )}
      </div>
    </ThreeColumnLayout>
  )
}
