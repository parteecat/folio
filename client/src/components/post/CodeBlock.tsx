import { useState, useRef } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
}

/**
 * 代码块组件
 * 支持语法高亮和复制功能
 */
export function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  // 提取代码文本
  const getCodeText = () => {
    if (typeof children === 'string') return children
    if (codeRef.current) {
      return codeRef.current.textContent || ''
    }
    return ''
  }

  const handleCopy = async () => {
    const code = getCodeText()
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // 检测语言
  const language = className?.replace('language-', '') || 'text'

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border bg-muted">
      {/* 代码头部 */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-1.5 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              已复制
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              复制
            </>
          )}
        </Button>
      </div>
      
      {/* 代码内容 */}
      <div className="overflow-x-auto p-4">
        <pre className="m-0 bg-transparent p-0">
          <code
            ref={codeRef}
            className={cn(
              'block text-sm font-mono leading-relaxed',
              className
            )}
          >
            {children}
          </code>
        </pre>
      </div>
    </div>
  )
}
