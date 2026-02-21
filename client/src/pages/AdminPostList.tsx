import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ShuoPostModal } from '@/components/feed/ShuoPostModal'
import { api } from '@/api/client'
import { formatRelativeTime } from '@/lib/utils'
import type { PostListItem } from '@/types'

interface PostListProps {
  posts: PostListItem[]
  onEdit: (post: PostListItem) => void
  onDelete: (post: PostListItem) => void
  onPreview: (post: PostListItem) => void
}

/**
 * 文章列表组件
 */
function PostList({ posts, onEdit, onDelete, onPreview }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无文章</p>
        <p className="mt-1 text-sm text-muted-foreground/70">点击上方按钮创建新文章</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Card key={post.id} className="group">
          <CardContent className="flex items-center gap-4 p-4">
            {/* 类型标识 */}
            <Badge
              variant={post.type === 'ARTICLE' ? 'default' : 'secondary'}
              className="shrink-0"
            >
              {post.type === 'ARTICLE' ? '长文' : '说说'}
            </Badge>

            {/* 封面缩略图 */}
            {post.coverImage && (
              <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded sm:block">
                <img
                  src={post.coverImage}
                  alt={post.title || ''}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* 文章信息 */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium">
                {post.title || '无标题'}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>/{post.slug}</span>
                <span>·</span>
                <span>
                  {post.publishedAt
                    ? formatRelativeTime(post.publishedAt)
                    : '草稿'}
                </span>
                {post.tags.length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 统计信息 */}
            <div className="hidden shrink-0 items-center gap-4 text-sm text-muted-foreground md:flex">
              <div className="text-right">
                <p className="font-medium text-foreground">{post.likeCount}</p>
                <p className="text-xs">点赞</p>
              </div>
            </div>

            {/* 操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPreview(post)}>
                  <Eye className="mr-2 h-4 w-4" />
                  预览
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(post)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * 文章列表管理页面
 */
export default function AdminPostList() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [filteredPosts, setFilteredPosts] = useState<PostListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [postToDelete, setPostToDelete] = useState<PostListItem | null>(null)
  const [editingShuo, setEditingShuo] = useState<PostListItem | null>(null)

  // 加载文章列表
  const loadPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.admin.getPosts()
      setPosts(data)
      setFilteredPosts(data)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  // 搜索和筛选
  useEffect(() => {
    let result = posts

    // 搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.slug.toLowerCase().includes(query) ||
          post.excerpt?.toLowerCase().includes(query)
      )
    }

    // 筛选
    if (filter === 'published') {
      result = result.filter((post) => post.publishedAt)
    } else if (filter === 'draft') {
      result = result.filter((post) => !post.publishedAt)
    }

    setFilteredPosts(result)
  }, [posts, searchQuery, filter])

  // 编辑文章 - 说说使用弹窗编辑，文章使用页面编辑
  const handleEdit = (post: PostListItem) => {
    if (post.type === 'SHORT') {
      // 说说使用弹窗编辑
      setEditingShuo(post)
    } else {
      // 文章使用页面编辑
      navigate(`/admin/editor/${post.id}`)
    }
  }

  // 预览文章
  const handlePreview = (post: PostListItem) => {
    window.open(`/post/${post.slug}`, '_blank')
  }

  // 删除文章
  const handleDelete = async () => {
    if (!postToDelete) return

    try {
      await api.admin.deletePost(postToDelete.id)
      setPosts(posts.filter((p) => p.id !== postToDelete.id))
      setPostToDelete(null)
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('删除失败，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
            >
              返回仪表盘
            </Button>
            <h1 className="text-xl font-bold">内容管理</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditingShuo({} as PostListItem)}>
              <Plus className="mr-2 h-4 w-4" />
              发说说
            </Button>
            <Button onClick={() => navigate('/admin/editor')}>
              <Plus className="mr-2 h-4 w-4" />
              新建文章
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="mx-auto max-w-5xl p-4">
        {/* 搜索和筛选 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索文章标题、slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              全部
            </Button>
            <Button
              variant={filter === 'published' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('published')}
            >
              已发布
            </Button>
            <Button
              variant={filter === 'draft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('draft')}
            >
              草稿
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mb-6 flex gap-4 text-sm text-muted-foreground">
          <span>共 {filteredPosts.length} 篇文章</span>
          <span>·</span>
          <span>{posts.filter((p) => p.publishedAt).length} 已发布</span>
          <span>·</span>
          <span>{posts.filter((p) => !p.publishedAt).length} 草稿</span>
        </div>

        {/* 文章列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <PostList
            posts={filteredPosts}
            onEdit={handleEdit}
            onDelete={setPostToDelete}
            onPreview={handlePreview}
          />
        )}
      </main>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={Boolean(postToDelete)}
        onOpenChange={() => setPostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。文章 "{postToDelete?.title}" 将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 说说编辑弹窗 */}
      <ShuoPostModal
        open={Boolean(editingShuo)}
        editingPost={editingShuo}
        onClose={() => setEditingShuo(null)}
        onSuccess={() => {
          loadPosts()
        }}
      />
    </div>
  )
}
