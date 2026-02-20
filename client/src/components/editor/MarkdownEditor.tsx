import { useState, useCallback } from 'react'
import { FileCode, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  markdown: string
  onChange: (markdown: string) => void
  onConvert?: (html: string) => void
}

/**
 * Markdown编辑器组件
 * 支持源码编辑和实时预览切换
 */
export function MarkdownEditor({
  markdown,
  onChange,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit')

  // 简单的Markdown转HTML（实际应用可用marked等库）
  const markdownToHtml = useCallback((md: string): string => {
    // 这里只是一个简单的转换示例
    // 实际应该使用 marked、remark 等库
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br />')
  }, [])

  const previewHtml = markdownToHtml(markdown)

  return (
    <div className="rounded-lg border bg-card">
      {/* 模式切换工具栏 */}
      <div className="flex items-center justify-between border-b bg-muted/50 p-2">
        <div className="flex items-center gap-1">
          <Button
            variant={mode === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('edit')}
            className="gap-1"
          >
            <FileCode className="h-4 w-4" />
            编辑
          </Button>
          <Button
            variant={mode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('preview')}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            预览
          </Button>
          <Button
            variant={mode === 'split' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('split')}
          >
            分屏
          </Button>
        </div>

        <span className="text-xs text-muted-foreground">
          支持从 Obsidian / Typora 粘贴 Markdown
        </span>
      </div>

      {/* 编辑区域 */}
      <div
        className={cn(
          'min-h-[400px]',
          mode === 'split' && 'grid grid-cols-2 divide-x'
        )}
      >
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            value={markdown}
            onChange={(e) => onChange(e.target.value)}
            placeholder="# 标题\n\n开始写作..."
            className={cn(
              'w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed focus:outline-none',
              mode === 'edit' ? 'min-h-[400px]' : 'min-h-full'
            )}
          />
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div
            className={cn(
              'prose prose-sm max-w-none p-4 dark:prose-invert',
              mode === 'preview' ? 'min-h-[400px]' : 'min-h-full'
            )}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
    </div>
  )
}
