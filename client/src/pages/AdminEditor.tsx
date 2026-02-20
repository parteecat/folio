import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Eye, FileText, FileCode, Image as ImageIcon, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { MarkdownEditor } from '@/components/editor/MarkdownEditor'
import { ImageUpload } from '@/components/editor/ImageUpload'
import { api } from '@/api/client'
import { generateSlug } from '@/lib/utils'
import { PostType } from '@/types'

/**
 * 文章编辑器页面
 *
 * 功能：
 * - TipTap富文本编辑（可视化模式）
 * - Markdown源码模式
 * - 元数据设置（标题、slug、标签、封面等）
 * - 发布状态切换
 * - 图片拖拽上传
 * - 从Obsidian/Typora粘贴Markdown自动转换
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
  const [contentMD, setContentMD] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual')

  // 加载已有文章
  useEffect(() => {
    if (!id) return

    // 获取单个文章详情
    api.posts
      .get(id)
      .then((post) => {
        setType(post.type)
        setTitle(post.title || '')
        setSlug(post.slug)
        setExcerpt(post.excerpt || '')
        setCoverImage(post.coverImage || '')
        setContentHTML(post.contentHTML)
        setContentMD(post.contentMD)
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

  // 处理Markdown编辑器变化
  const handleMarkdownChange = useCallback((markdown: string) => {
    setContentMD(markdown)
    // 简单转换HTML（实际应该使用更好的库）
    setContentHTML(markdown)
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

    setIsSaving(true)

    try {
      const postData = {
        type,
        title,
        slug,
        excerpt: excerpt || title,
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
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {isEditing ? '编辑文章' : '新建文章'}
            </h1>
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
      <main className="mx-auto max-w-6xl p-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 主编辑区 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 标题输入 */}
            <Input
              placeholder="文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold"
            />

            {/* 编辑器模式切换 */}
            <Tabs
              value={editorMode}
              onValueChange={(v) => setEditorMode(v as 'visual' | 'markdown')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visual" className="gap-2">
                  <FileText className="h-4 w-4" />
                  可视化编辑
                </TabsTrigger>
                <TabsTrigger value="markdown" className="gap-2">
                  <FileCode className="h-4 w-4" />
                  Markdown源码
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="mt-4">
                <TipTapEditor
                  content={contentHTML}
                  onChange={handleEditorChange}
                  placeholder="开始写作...支持从Obsidian/Typora粘贴Markdown"
                  onImageUpload={handleImageUpload}
                />
              </TabsContent>

              <TabsContent value="markdown" className="mt-4">
                <MarkdownEditor
                  markdown={contentMD}
                  onChange={handleMarkdownChange}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* 侧边设置面板 */}
          <div className="space-y-4">
            {/* 基本设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">基本设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 文章类型 */}
                <div>
                  <label className="text-sm font-medium">文章类型</label>
                  <div className="mt-1.5 flex gap-2">
                    <Button
                      variant={type === PostType.ARTICLE ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setType(PostType.ARTICLE)}
                      className="flex-1"
                    >
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

                {/* Slug */}
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      placeholder="article-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    用于URL访问的唯一标识
                  </p>
                </div>

                {/* 摘要 */}
                <div>
                  <label className="text-sm font-medium">摘要</label>
                  <Textarea
                    placeholder="文章摘要..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="mt-1.5 min-h-[80px]"
                  />
                </div>

                {/* 发布状态 */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="published" className="text-sm font-medium">
                    {isPublished ? '已发布' : '保存为草稿'}
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* 封面图 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4" />
                  封面图
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  onUpload={handleImageUpload}
                />
              </CardContent>
            </Card>

            {/* 标签 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4" />
                  标签
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    添加
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <span className="ml-1 text-muted-foreground">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
