import { NavLink } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { ImageGrid } from './ImageGrid'
import { LikeButton } from './LikeButton'
import type { PostListItem } from '@/types'

interface FeedCardProps {
  post: PostListItem
  onLike?: (id: string) => void
}

/**
 * 短内容卡片（SHORT类型）
 * 直接展示全文+图片网格
 */
function ShortCard({ post, onLike }: FeedCardProps) {
  return (
    <article className="border-b p-4 transition-colors hover:bg-muted/50">
      {/* 作者信息 */}
      <div className="mb-3 flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={post.author?.avatar || undefined} />
          <AvatarFallback>{post.author?.name?.[0] || '博'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium">{post.author?.name || '博主'}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(post.publishedAt || new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* 内容 */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {post.excerpt || '暂无内容'}
        </p>
      </div>

      {/* 图片网格 */}
      <ImageGrid images={post.images} />

      {/* 底部操作栏 */}
      <div className="mt-4 flex items-center justify-between">
        <LikeButton 
          postId={post.id} 
          initialCount={post.likeCount} 
          onLike={onLike}
        />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          短内容
        </span>
      </div>
    </article>
  )
}

/**
 * 文章卡片（ARTICLE类型）
 * 封面+标题+摘要+"阅读全文"按钮
 */
function ArticleCard({ post }: { post: PostListItem }) {
  return (
    <article className="border-b p-4 transition-colors hover:bg-muted/50">
      {/* 作者信息 */}
      <div className="mb-3 flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={post.author?.avatar || undefined} />
          <AvatarFallback>{post.author?.name?.[0] || '博'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium">{post.author?.name || '博主'}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(post.publishedAt || new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* 文章预览 */}
      <NavLink to={`/post/${post.slug}`} className="group block">
        {/* 封面图 */}
        {post.coverImage && (
          <div className="mb-3 aspect-video overflow-hidden rounded-lg">
            <img
              src={post.coverImage}
              alt={post.title || '文章封面'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* 标题 */}
        <h3 className="mb-2 text-lg font-bold leading-tight group-hover:text-primary">
          {post.title || '无标题'}
        </h3>

        {/* 摘要 */}
        <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
          {post.excerpt || '暂无摘要'}
        </p>

        {/* 底部信息栏 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="group/btn gap-1 px-0 hover:bg-transparent">
            <span>阅读全文</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            长文
          </span>
        </div>
      </NavLink>
    </article>
  )
}

/**
 * Feed卡片组件
 * 根据帖子类型渲染不同的卡片样式
 */
export function FeedCard({ post, onLike }: FeedCardProps) {
  return post.type === 'SHORT' ? (
    <ShortCard post={post} onLike={onLike} />
  ) : (
    <ArticleCard post={post} />
  )
}
