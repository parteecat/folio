import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number
}

/**
 * 无限滚动 Hook
 * 使用 Intersection Observer 监听底部触发器
 * 
 * 修复：避免重复触发请求，正确清理 observer
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 100,
}: UseInfiniteScrollOptions) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  const hasMoreRef = useRef(hasMore)
  const isLoadingRef = useRef(isLoading)

  // 保持最新值
  onLoadMoreRef.current = onLoadMore
  hasMoreRef.current = hasMore
  isLoadingRef.current = isLoading

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    // 创建 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        // 只有当元素可见、有数据且未在加载时才触发
        if (
          entry.isIntersecting &&
          hasMoreRef.current &&
          !isLoadingRef.current
        ) {
          onLoadMoreRef.current()
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  return { loadMoreRef }
}
