import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

/**
 * 文章编辑器
 * 
 * 功能：
 * - TipTap富文本编辑
 * - Markdown源码模式
 * - 元数据设置（标题、slug、标签、封面等）
 * - 发布状态切换
 * - 图片上传
 */
export default function AdminEditor() {
  const navigate = useNavigate()
  
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (publish: boolean = false) => {
    setIsSaving(true)
    // TODO: 实现保存逻辑
    console.log('Saving...', { title, slug, content, publish })
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部工具栏 */}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">编辑文章</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              保存草稿
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              <Eye className="mr-2 h-4 w-4" />
              {isPublished ? '更新发布' : '立即发布'}
            </Button>
          </div>
        </div>
      </header>

      {/* 编辑器主体 */}
      <main className="mx-auto max-w-5xl p-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 主编辑区 */}
          <div className="lg:col-span-2 space-y-4">
            <Input
              placeholder="文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold"
            />
            
            <Card>
              <CardContent className="p-4">
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">编辑器将在这里显示</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    请集成 TipTap 编辑器组件
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边设置面板 */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    placeholder="article-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">发布状态</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">
                      {isPublished ? '已发布' : '草稿'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
