import { NavLink } from 'react-router-dom'
import { ArrowRight, Pencil, MoreVertical, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/utils'
import { ShuoAttachmentGrid } from './ShuoPostModal'
import { LikeButton } from './LikeButton'
import { useAuthStore } from '@/store/useStore'
import type { PostListItem, ShuoAttachment } from '@/types'

interface FeedCardProps {
  post: PostListItem
  onLike?: (id: string) => void
  onEdit?: (post: PostListItem) => void
  onDelete?: (post: PostListItem) => void
  onToggleHide?: (post: PostListItem) => void
}

/**
 * 说说卡片（SHORT类型）
 * 类似朋友圈/QQ空间说说样式
 * 支持九宫格图片、视频、GIF
 */
function ShortCard({ post, onLike, onEdit, onDelete, onToggleHide }: FeedCardProps) {
  const { isAuthenticated } = useAuthStore()

  // 转换attachments格式
  const attachments: ShuoAttachment[] = post.shuoAttachments?.length
    ? post.shuoAttachments
    : post.images.map((url, index) => ({
        id: `legacy-${index}`,
        type: 'IMAGE',
        url,
      }))

  // 预览说说
  const handlePreview = () => {
    window.open(`/post/${post.slug}`, '_blank')
  }

  return (
    <article className="border-b p-4 transition-colors hover:bg-muted/50">
      {/* 作者信息 + 右上角操作菜单 */}
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
        
        {/* 右上角操作菜单（仅管理员可见） */}
        {isAuthenticated && (onEdit || onDelete || onToggleHide) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePreview}>
                <Eye className="mr-2 h-4 w-4" />
                预览
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
              )}
              {onToggleHide && (
                <DropdownMenuItem onClick={() => onToggleHide(post)}>
                  {post.hidden ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      显示
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      隐藏
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(post)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 内容 - 渲染HTML */}
      {post.excerpt && (
        <div
          className="prose prose-sm max-w-none text-sm leading-relaxed dark:prose-invert [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:mt-2 [&>ol]:mt-2 [&>h1]:mt-3 [&>h1]:mb-2 [&>h2]:mt-3 [&>h2]:mb-2 [&>h3]:mt-3 [&>h3]:mb-2"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />
      )}

      {/* 媒体附件 - 九宫格布局 */}
      {attachments.length > 0 && (
        <div className="mt-3">
          <ShuoAttachmentGrid attachments={attachments} />
        </div>
      )}

      {/* 标签 */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <NavLink key={tag.id} to={`/tag/${tag.slug}`}>
              <Badge variant="secondary" className="text-xs hover:bg-primary/10">
                #{tag.name}
              </Badge>
            </NavLink>
          ))}
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="mt-4 flex items-center justify-between">
        <LikeButton 
          postId={post.id} 
          initialCount={post.likeCount} 
          onLike={onLike}
        />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          说说
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

        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <NavLink key={tag.id} to={`/tag/${tag.slug}`}>
                <Badge variant="secondary" className="text-xs hover:bg-primary/10">
                  #{tag.name}
                </Badge>
              </NavLink>
            ))}
          </div>
        )}

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
export function FeedCard({ post, onLike, onEdit, onDelete, onToggleHide }: FeedCardProps) {
  return post.type === 'SHORT' ? (
    <ShortCard post={post} onLike={onLike} onEdit={onEdit} onDelete={onDelete} onToggleHide={onToggleHide} />
  ) : (
    <ArticleCard post={post} />
  )
}
