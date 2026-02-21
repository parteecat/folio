import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Type, X, Plus } from 'lucide-react'
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
import { PostType, type Tag } from '@/types'
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

  // 标签相关状态
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])

  // 加载所有标签
  useEffect(() => {
    api.tags
      .list()
      .then((tags) => {
        setAllTags(tags)
      })
      .catch((error) => {
        console.error('Failed to load tags:', error)
      })
  }, [])

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

  // 根据输入过滤标签
  useEffect(() => {
    if (tagInput.trim()) {
      const filtered = allTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
          !tags.includes(tag.name)
      )
      setFilteredTags(filtered)
      setShowTagDropdown(filtered.length > 0 || tagInput.trim().length > 0)
    } else {
      setShowTagDropdown(false)
      setFilteredTags([])
    }
  }, [tagInput, allTags, tags])

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

  // 添加标签（支持选择现有标签或创建新标签）
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag) return

    // 检查是否已存在该标签
    if (tags.includes(trimmedTag)) {
      setTagInput('')
      setShowTagDropdown(false)
      return
    }

    // 检查是否匹配现有标签（不区分大小写）
    const existingTag = allTags.find(
      (t) => t.name.toLowerCase() === trimmedTag.toLowerCase()
    )

    if (existingTag) {
      setTags([...tags, existingTag.name])
    } else {
      // 创建新标签
      setTags([...tags, trimmedTag])
    }

    setTagInput('')
    setShowTagDropdown(false)
  }

  // 选择现有标签
  const handleSelectTag = (tagName: string) => {
    if (!tags.includes(tagName)) {
      setTags([...tags, tagName])
    }
    setTagInput('')
    setShowTagDropdown(false)
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
      // 处理标签：将标签名称转换为 tagIds
      // 对于已存在的标签，使用其 ID；对于新标签，先创建再获取 ID
      const tagIds: string[] = []
      const newTags: string[] = []

      for (const tagName of tags) {
        const existingTag = allTags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase()
        )
        if (existingTag) {
          tagIds.push(existingTag.id)
        } else {
          newTags.push(tagName)
        }
      }

      // 创建新标签
      for (const newTagName of newTags) {
        try {
          const newTag = await api.tags.create({
            name: newTagName,
            slug: generateSlug(newTagName),
          })
          tagIds.push(newTag.id)
        } catch (error) {
          console.error(`Failed to create tag ${newTagName}:`, error)
        }
      }

      const postData = {
        type,
        title,
        slug,
        excerpt: finalExcerpt,
        coverImage,
        contentMD,
        contentHTML,
        tagIds,
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
                      说说
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
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        placeholder="搜索或添加标签"
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
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 标签下拉列表 */}
                    {showTagDropdown && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                        <div className="max-h-32 overflow-y-auto py-1">
                          {filteredTags.length > 0 ? (
                            filteredTags.map((tag) => (
                              <button
                                key={tag.id}
                                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-accent"
                                onClick={() => handleSelectTag(tag.name)}
                              >
                                <span>{tag.name}</span>
                                {tag._count?.posts && (
                                  <span className="text-xs text-muted-foreground">
                                    {tag._count.posts} 篇
                                  </span>
                                )}
                              </button>
                            ))
                          ) : tagInput.trim() ? (
                            <div className="px-3 py-1.5 text-sm text-muted-foreground">
                              按 Enter 创建新标签 "{tagInput.trim()}"
                            </div>
                          ) : (
                            allTags
                              .filter((t) => !tags.includes(t.name))
                              .slice(0, 5)
                              .map((tag) => (
                                <button
                                  key={tag.id}
                                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-accent"
                                  onClick={() => handleSelectTag(tag.name)}
                                >
                                  <span>{tag.name}</span>
                                  {tag._count?.posts && (
                                    <span className="text-xs text-muted-foreground">
                                      {tag._count.posts} 篇
                                    </span>
                                  )}
                                </button>
                              ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 已选标签 */}
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1 text-xs"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 rounded-full hover:bg-accent"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 已有标签快捷选择 */}
                  {allTags.length > 0 && tags.length < allTags.length && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs text-muted-foreground">快速选择：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allTags
                          .filter((t) => !tags.includes(t.name))
                          .slice(0, 8)
                          .map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleSelectTag(tag.name)}
                              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                            >
                              + {tag.name}
                            </button>
                          ))}
                      </div>
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
