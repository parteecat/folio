import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useCallback } from 'react'
import { api } from '@/api/client'

interface LikeButtonProps {
  postId: string
  initialCount: number
  onLike?: (id: string) => void
}

/**
 * 点赞按钮组件
 * 使用 localStorage 记录点赞状态，避免重复点赞
 * 点击后发送API请求，本地状态立即更新
 */
export function LikeButton({ postId, initialCount, onLike }: LikeButtonProps) {
  // 从 localStorage 读取点赞状态
  const [liked, setLiked] = useState(() => {
    const key = `liked:${postId}`
    return localStorage.getItem(key) === 'true'
  })
  
  const [count, setCount] = useState(initialCount)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleLike = useCallback(async () => {
    if (liked) return

    const key = `liked:${postId}`
    
    try {
      // 发送API请求
      const response = await api.posts.like(postId)
      
      // 更新本地状态
      localStorage.setItem(key, 'true')
      setLiked(true)
      setCount(response.likeCount)
      setIsAnimating(true)
      
      // 触发父组件回调
      onLike?.(postId)
      
      // 动画结束后重置
      setTimeout(() => setIsAnimating(false), 300)
    } catch (error) {
      console.error('Failed to like post:', error)
    }
  }, [liked, postId, onLike])

  return (
    <button
      onClick={handleLike}
      disabled={liked}
      className={cn(
        'flex items-center gap-1.5 text-sm transition-all duration-200',
        liked
          ? 'text-red-500 cursor-default'
          : 'text-muted-foreground hover:text-red-500'
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all duration-300',
          liked && 'fill-current',
          isAnimating && 'scale-125'
        )}
      />
      <span>{count}</span>
    </button>
  )
}
