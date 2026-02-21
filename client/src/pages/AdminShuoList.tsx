import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  MoreVertical,
  ArrowLeft,
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

interface ShuoListProps {
  shuos: PostListItem[]
  onEdit: (shuo: PostListItem) => void
  onDelete: (shuo: PostListItem) => void
  onPreview: (shuo: PostListItem) => void
  onToggleHide: (shuo: PostListItem) => void
}

function ShuoList({ shuos, onEdit, onDelete, onPreview, onToggleHide }: ShuoListProps) {
  if (shuos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无说说</p>
        <p className="mt-1 text-sm text-muted-foreground/70">点击上方按钮发布新说说</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {shuos.map((shuo) => (
        <Card key={shuo.id} className={shuo.hidden ? 'opacity-60' : ''}>
          <CardContent className="flex items-start gap-4 p-4">
            {/* 隐藏状态标识 */}
            {shuo.hidden && (
              <Badge variant="secondary" className="shrink-0">
                <EyeOff className="mr-1 h-3 w-3" />
                隐藏
              </Badge>
            )}

            {/* 内容预览 */}
            <div className="min-w-0 flex-1">
              <div 
                className="line-clamp-2 text-sm"
                dangerouslySetInnerHTML={{ __html: shuo.excerpt || '无内容' }}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>/{shuo.slug}</span>
                <span>·</span>
                <span>
                  {shuo.publishedAt
                    ? formatRelativeTime(shuo.publishedAt)
                    : '草稿'}
                </span>
                <span>·</span>
                <span>{shuo.likeCount} 点赞</span>
                {shuo.tags.length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex gap-1">
                      {shuo.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {shuo.tags.length > 3 && (
                        <span className="text-xs">+{shuo.tags.length - 3}</span>
                      )}
                    </div>
                  </>
                )}
                {shuo.images.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{shuo.images.length} 张图片</span>
                  </>
                )}
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
                <DropdownMenuItem onClick={() => onPreview(shuo)}>
                  <Eye className="mr-2 h-4 w-4" />
                  预览
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(shuo)}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleHide(shuo)}>
                  {shuo.hidden ? (
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
                <DropdownMenuItem
                  onClick={() => onDelete(shuo)}
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

export default function AdminShuoList() {
  const navigate = useNavigate()
  const [shuos, setShuos] = useState<PostListItem[]>([])
  const [filteredShuos, setFilteredShuos] = useState<PostListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [shuoToDelete, setShuoToDelete] = useState<PostListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShuo, setEditingShuo] = useState<PostListItem | null>(null)

  // 加载说说列表（只加载说说类型）
  const loadShuos = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.admin.getPosts('SHORT')
      setShuos(data)
      setFilteredShuos(data)
    } catch (error) {
      console.error('Failed to load shuos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadShuos()
  }, [loadShuos])

  // 搜索和筛选
  useEffect(() => {
    let result = shuos

    // 搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (shuo) =>
          shuo.excerpt?.toLowerCase().includes(query) ||
          shuo.slug.toLowerCase().includes(query)
      )
    }

    // 筛选
    if (filter === 'published') {
      result = result.filter((shuo) => shuo.publishedAt)
    } else if (filter === 'draft') {
      result = result.filter((shuo) => !shuo.publishedAt)
    }

    setFilteredShuos(result)
  }, [shuos, searchQuery, filter])

  // 编辑说说
  const handleEdit = (shuo: PostListItem) => {
    setEditingShuo(shuo)
  }

  // 预览说说
  const handlePreview = (shuo: PostListItem) => {
    window.open(`/post/${shuo.slug}`, '_blank')
  }

  // 切换隐藏状态
  const handleToggleHide = async (shuo: PostListItem) => {
    try {
      await api.admin.hidePost(shuo.id, !shuo.hidden)
      // 更新本地状态
      setShuos(shuos.map(s => 
        s.id === shuo.id ? { ...s, hidden: !shuo.hidden } : s
      ))
    } catch (error) {
      console.error('Failed to toggle hide:', error)
      alert('操作失败，请重试')
    }
  }

  // 删除说说
  const handleDelete = async () => {
    if (!shuoToDelete) return

    try {
      await api.admin.deletePost(shuoToDelete.id)
      setShuos(shuos.filter((s) => s.id !== shuoToDelete.id))
      setShuoToDelete(null)
    } catch (error) {
      console.error('Failed to delete shuo:', error)
      alert('删除失败，请重试')
    }
  }

  // 处理说说编辑弹窗关闭
  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingShuo(null)
  }

  // 处理说说编辑成功
  const handleModalSuccess = () => {
    loadShuos()
    handleModalClose()
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回仪表盘
            </Button>
            <h1 className="text-xl font-bold">说说管理</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/posts')}>
              管理文章
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              发说说
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
              placeholder="搜索说说内容..."
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
          <span>共 {filteredShuos.length} 条说说</span>
          <span>·</span>
          <span>{shuos.filter((s) => s.publishedAt).length} 已发布</span>
          <span>·</span>
          <span>{shuos.filter((s) => !s.publishedAt).length} 草稿</span>
          <span>·</span>
          <span>{shuos.filter((s) => s.hidden).length} 隐藏</span>
        </div>

        {/* 说说列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <ShuoList
            shuos={filteredShuos}
            onEdit={handleEdit}
            onDelete={setShuoToDelete}
            onPreview={handlePreview}
            onToggleHide={handleToggleHide}
          />
        )}
      </main>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={Boolean(shuoToDelete)}
        onOpenChange={() => setShuoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。该说说将被永久删除。
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

      {/* 发说说弹窗 */}
      <ShuoPostModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* 编辑说说弹窗 */}
      <ShuoPostModal
        open={Boolean(editingShuo)}
        editingPost={editingShuo}
        onClose={() => setEditingShuo(null)}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
