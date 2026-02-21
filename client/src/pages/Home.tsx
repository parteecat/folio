import { useEffect, useCallback, useRef, useState } from 'react'
import { Menu, Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThreeColumnLayout } from '@/components/layout/ThreeColumnLayout'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { TypeFilter } from '@/components/feed/TypeFilter'
import { FeedList } from '@/components/feed/FeedList'
import { ShuoPostModal } from '@/components/feed/ShuoPostModal'
import { useUIStore, useFeedStore, useAuthStore } from '@/store/useStore'
import { api } from '@/api/client'
import type { PostListItem } from '@/types'

/**
 * 首页（Feed流）
 *
 * 功能：
 * - 三栏布局展示
 * - 帖子列表（无限滚动）
 * - 类型筛选（全部/短文/文章）
 * - 发说说功能
 */
export default function Home() {
  const { toggleLeftSidebar } = useUIStore()
  const { isAuthenticated } = useAuthStore()
  const [shuoModalOpen, setShuoModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<PostListItem | null>(null)
  const {
    posts,
    cursor,
    hasMore,
    isLoading,
    selectedType,
    setLoading,
    setPosts,
    appendPosts,
    setSelectedType,
  } = useFeedStore()

  // 使用 ref 追踪加载状态和类型，避免 effect 依赖循环
  const isLoadingRef = useRef(isLoading)
  const cursorRef = useRef(cursor)
  const selectedTypeRef = useRef(selectedType)
  const initializedRef = useRef(false)

  // 同步 ref
  isLoadingRef.current = isLoading
  cursorRef.current = cursor
  selectedTypeRef.current = selectedType

  /**
   * 初始加载 - 只在 selectedType 变化时触发
   */
  useEffect(() => {
    // 如果已经在加载中，不重复请求
    if (isLoadingRef.current) return

    // 防止 React 严格模式导致的重复请求
    if (initializedRef.current) return
    initializedRef.current = true

    setLoading(true)

    const params: { cursor?: string; type?: string; limit: string } = {
      limit: '10',
    }

    // 添加类型筛选
    if (selectedType !== 'ALL') {
      params.type = selectedType
    }

    api.posts
      .list(params)
      .then((response) => {
        // 首次加载使用 setPosts 替换数据，避免重复
        setPosts(response.data)
        useFeedStore.setState({ 
          cursor: response.nextCursor, 
          hasMore: response.hasMore 
        })
      })
      .catch((error) => {
        console.error('Failed to load feed:', error)
      })
      .finally(() => {
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, setPosts])

  /**
   * 处理类型筛选变化
   */
  const handleTypeChange = useCallback((type: 'ALL' | 'SHORT' | 'ARTICLE') => {
    if (type === selectedTypeRef.current) return
    
    // 重置初始化标志，触发新的加载
    initializedRef.current = false
    setSelectedType(type)
  }, [setSelectedType])

  /**
   * 处理加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return

    setLoading(true)

    const params: { cursor?: string; type?: string; limit: string } = {
      limit: '10',
    }

    // 使用 cursor 分页
    if (cursorRef.current) {
      params.cursor = cursorRef.current
    }

    // 添加类型筛选
    if (selectedTypeRef.current !== 'ALL') {
      params.type = selectedTypeRef.current
    }

    api.posts
      .list(params)
      .then((response) => {
        appendPosts(response.data, response.nextCursor, response.hasMore)
      })
      .catch((error) => {
        console.error('Failed to load more:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [hasMore, setLoading, appendPosts])

  /**
   * 处理点赞（可选：更新本地状态）
   */
  const handleLike = useCallback((id: string) => {
    console.log('Liked post:', id)
  }, [])

  /**
   * 刷新列表
   */
  const refreshFeed = useCallback(() => {
    // 重置状态并重新加载
    initializedRef.current = false
    setLoading(true)

    const params: { cursor?: string; type?: string; limit: string } = {
      limit: '10',
    }

    if (selectedType !== 'ALL') {
      params.type = selectedType
    }

    api.posts
      .list(params)
      .then((response) => {
        setPosts(response.data)
        useFeedStore.setState({
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        })
        initializedRef.current = true
      })
      .catch((error) => {
        console.error('Failed to refresh feed:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [selectedType, setLoading, setPosts])

  return (
    <ThreeColumnLayout
      leftSidebar={<LeftSidebar />}
      rightSidebar={<RightSidebar />}
    >
      {/* 顶部导航栏（移动端显示） */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Folio</h1>
        <div className="w-9" /> {/* 占位保持居中 */}
      </header>

      {/* 桌面端标题栏 */}
      <header className="hidden border-b px-4 py-3 lg:block">
        <h1 className="text-xl font-bold">首页</h1>
      </header>

      {/* 发说说按钮（登录后显示） */}
      {isAuthenticated && (
        <div className="border-b p-4 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => setShuoModalOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            发说说...
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => window.location.href = '/admin/editor'}
          >
            <Plus className="h-4 w-4" />
            新建文章...
          </Button>
        </div>
      )}

      {/* 类型筛选器 */}
      <TypeFilter value={selectedType} onChange={handleTypeChange} />

      {/* Feed流内容区域 */}
      <div className="min-h-[calc(100vh-200px)]">
        <FeedList
          posts={posts}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onLike={handleLike}
          onEdit={setEditingPost}
        />
      </div>

      {/* 发说说弹窗 */}
      <ShuoPostModal
        open={shuoModalOpen}
        onClose={() => setShuoModalOpen(false)}
        onSuccess={refreshFeed}
      />

      {/* 编辑说说弹窗 */}
      <ShuoPostModal
        open={Boolean(editingPost)}
        editingPost={editingPost}
        onClose={() => setEditingPost(null)}
        onSuccess={refreshFeed}
      />
    </ThreeColumnLayout>
  )
}
