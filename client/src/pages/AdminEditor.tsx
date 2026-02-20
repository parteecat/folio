import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { ImageUpload } from '@/components/editor/ImageUpload'
import { api } from '@/api/client'
import { generateSlug } from '@/lib/utils'
import { PostType } from '@/types'
import TurndownService from 'turndown'

// 配置 turndown - HTML 转 Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// HTML 转 Markdown
const htmlToMd = (html: string): string => {
  if (!html) return ''
  return turndownService.turndown(html)
}

/**
 * 文章编辑器页面（左右布局）
 *
 * 布局：
 * - 左侧：标题 + 编辑器
 * - 右侧：设置面板（常驻显示）
 */
export default function AdminEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  // 表单状态
  const [type, setType] = useState<PostType>(PostType.ARTICLE)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [contentHTML, setContentHTML] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 加载已有文章
  useEffect(() => {
    if (!id) return

    api.posts
      .get(id)
      .then((post) => {
        setType(post.type)
        setTitle(post.title || '')
        setSlug(post.slug)
        setExcerpt(post.excerpt || '')
        setCoverImage(post.coverImage || '')
        setContentHTML(post.contentHTML || '')
        setTags(post.tags.map((t) => t.name))
        setIsPublished(Boolean(post.publishedAt))
      })
      .catch((error) => {
        console.error('Failed to load post:', error)
      })
  }, [id])

  // 自动生成slug
  useEffect(() => {
    if (!isEditing && title && !slug) {
      setSlug(generateSlug(title))
    }
  }, [title, slug, isEditing])

  // 处理编辑器内容变化
  const handleEditorChange = useCallback((html: string) => {
    setContentHTML(html)
  }, [])

  // 处理图片上传
  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      const response = await api.upload(file)
      return response.url
    },
    []
  )

  // 添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  // 保存文章
  const handleSave = async (publish: boolean = false) => {
    if (!title || !slug || !contentHTML) {
      alert('请填写标题、slug和内容')
      return
    }

    const finalExcerpt = excerpt || title
    const contentMD = htmlToMd(contentHTML)

    setIsSaving(true)

    try {
      const postData = {
        type,
        title,
        slug,
        excerpt: finalExcerpt,
        coverImage,
        contentMD,
        contentHTML,
        published: publish || isPublished,
      }

      if (isEditing && id) {
        await api.admin.updatePost(id, postData)
      } else {
        await api.admin.createPost(postData)
      }

      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Failed to save:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部工具栏 */}
      <header className="sticky top-0 z-50 border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/dashboard')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">
              {isEditing ? '编辑文章' : '新建文章'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              保存草稿
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              {isPublished ? '更新' : '发布'}
            </Button>
          </div>
        </div>
      </header>

      {/* 主体内容 - 左右布局 */}
      <main className="mx-auto max-w-6xl p-4">
        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          {/* 左侧：编辑器区域 */}
          <div className="space-y-4">
            {/* 标题输入 */}
            <Input
              placeholder="请输入文章标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-0 bg-transparent px-0 text-2xl font-bold placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            {/* 编辑器 */}
            <div className="min-h-[500px]">
              <TipTapEditor
                content={contentHTML}
                onChange={handleEditorChange}
                placeholder="开始写作...\n\n支持 Markdown 快捷键：\n# 标题  **粗体**  *斜体*  `代码`  ```代码块```\n\n还可以直接粘贴图片"
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>

          {/* 右侧：设置面板 */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">文章设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 文章类型 */}
                <div>
                  <label className="mb-2 block text-xs text-muted-foreground">文章类型</label>
                  <div className="flex gap-2">
                    <Button
                      variant={type === PostType.ARTICLE ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setType(PostType.ARTICLE)}
                      className="flex-1"
                    >
                      <Type className="mr-1.5 h-3.5 w-3.5" />
                      长文章
                    </Button>
                    <Button
                      variant={type === PostType.SHORT ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setType(PostType.SHORT)}
                      className="flex-1"
                    >
                      短内容
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Slug */}
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">Slug * </label>
                  <Input
                    placeholder="article-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">URL 唯一标识</p>
                </div>

                <Separator />

                {/* 摘要 */}
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">摘要</label>
                  <Textarea
                    placeholder="文章摘要（默认同标题）"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                  />
                </div>

                <Separator />

                {/* 封面图 */}
                <div>
                  <label className="mb-2 block text-xs text-muted-foreground">封面图</label>
                  <ImageUpload
                    value={coverImage}
                    onChange={setCoverImage}
                    onUpload={handleImageUpload}
                  />
                </div>

                <Separator />

                {/* 标签 */}
                <div>
                  <label className="mb-2 block text-xs text-muted-foreground">标签</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="添加标签"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button size="sm" className="h-8 px-3" onClick={handleAddTag}>
                      添加
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer text-xs"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <span className="ml-1">×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* 发布状态 */}
                <div className="flex items-center justify-between">
                  <label htmlFor="published" className="text-sm">
                    立即发布
                  </label>
                  <input
                    type="checkbox"
                    id="published"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
