import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Edit3, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
import { api } from '@/api/client'
import { generateSlug } from '@/lib/utils'
import type { Tag } from '@/types'

interface TagWithCount extends Tag {
  _count?: {
    posts: number
  }
}

/**
 * 标签管理页面
 *
 * 功能：
 * - 查看所有标签
 * - 创建新标签
 * - 删除标签
 * - 查看标签文章数量
 */
export default function AdminTagList() {
  const navigate = useNavigate()
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [filteredTags, setFilteredTags] = useState<TagWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)

  // 加载标签列表
  const loadTags = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.tags.list()
      // 确保数据是数组
      const tagsArray = Array.isArray(data) ? data : []
      setTags(tagsArray)
      setFilteredTags(tagsArray)
    } catch (error) {
      console.error('Failed to load tags:', error)
      setTags([])
      setFilteredTags([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  // 搜索筛选
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredTags(
        tags.filter(
          (tag) =>
            tag.name.toLowerCase().includes(query) ||
            tag.slug.toLowerCase().includes(query)
        )
      )
    } else {
      setFilteredTags(tags)
    }
  }, [tags, searchQuery])

  // 创建标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = {
        name: newTagName.trim(),
        slug: generateSlug(newTagName.trim()),
      }

      const created = await api.tags.create(newTag)

      setTags([
        ...tags,
        {
          ...created,
          _count: { posts: 0 },
        },
      ])
      setNewTagName('')
    } catch (error) {
      console.error('Failed to create tag:', error)
      alert('创建标签失败')
    }
  }

  // 删除标签
  const handleDeleteTag = async () => {
    if (!tagToDelete) return

    try {
      await api.tags.delete(tagToDelete.id)

      setTags(tags.filter((t) => t.id !== tagToDelete.id))
      setTagToDelete(null)
    } catch (error) {
      console.error('Failed to delete tag:', error)
      alert('删除标签失败')
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
            <h1 className="text-xl font-bold">标签管理</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            共 {tags.length} 个标签
          </span>
        </div>
      </header>

      {/* 主内容 */}
      <main className="mx-auto max-w-5xl p-4">
        {/* 搜索和创建 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="新标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTag()
                }
              }}
            />
            <Button onClick={handleCreateTag}>
              <Plus className="mr-2 h-4 w-4" />
              创建
            </Button>
          </div>
        </div>

        {/* 标签列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Hash className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">暂无标签</p>
            <p className="mt-1 text-sm text-muted-foreground/70">创建一个新标签开始使用</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{tag.name}</h3>
                    <p className="text-sm text-muted-foreground">/{tag.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        // 编辑功能
                        const newName = prompt('新名称:', tag.name)
                        if (newName && newName !== tag.name) {
                          setTags(
                            tags.map((t) =>
                              t.id === tag.id
                                ? { ...t, name: newName, slug: generateSlug(newName) }
                                : t
                            )
                          )
                        }
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setTagToDelete(tag)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={Boolean(tagToDelete)}
        onOpenChange={() => setTagToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签？</AlertDialogTitle>
            <AlertDialogDescription>
              标签 "{tagToDelete?.name}" 将被删除。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
