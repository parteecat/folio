import { Loader2, FileText } from 'lucide-react'
import { FeedCard } from './FeedCard'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { PostListItem } from '@/types'

interface FeedListProps {
  posts: PostListItem[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onLike?: (id: string) => void
  onEdit?: (post: PostListItem) => void
  onDelete?: (post: PostListItem) => void
  onToggleHide?: (post: PostListItem) => void
}

export function FeedList({
  posts,
  isLoading,
  hasMore,
  onLoadMore,
  onLike,
  onEdit,
  onDelete,
  onToggleHide,
}: FeedListProps) {
  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    threshold: 100,
  })

  // 空状态
  if (posts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无内容</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          稍后再来看看吧
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {posts.map((post) => (
        <FeedCard 
          key={post.id} 
          post={post} 
          onLike={onLike} 
          onEdit={onEdit} 
          onDelete={onDelete}
          onToggleHide={onToggleHide}
        />
      ))}

      {/* 加载指示器 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
        </div>
      )}

      {/* 加载更多触发器 */}
      {hasMore && !isLoading && (
        <div ref={loadMoreRef} className="h-10" />
      )}

      {/* 没有更多提示 */}
      {!hasMore && posts.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">没有更多内容了</p>
        </div>
      )}
    </div>
  )
}
