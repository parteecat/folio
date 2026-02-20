import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TocProps {
  contentRef: React.RefObject<HTMLElement | null>
}

/**
 * 目录导航组件
 * 从文章内容中提取 h2/h3 标题，生成目录
 * 点击平滑滚动到对应章节
 * 当前章节高亮
 */
export function Toc({ contentRef }: TocProps) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // 提取标题
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const headings = content.querySelectorAll('h2, h3')
    const tocItems: TocItem[] = []

    headings.forEach((heading, index) => {
      // 如果没有id，生成一个
      if (!heading.id) {
        heading.id = `heading-${index}`
      }

      tocItems.push({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      })
    })

    setItems(tocItems)
  }, [contentRef])

  // 监听滚动，高亮当前章节
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h2[id], h3[id]')
      let current = ''

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100) {
          current = heading.id
        }
      })

      setActiveId(current)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 点击平滑滚动
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  if (items.length === 0) return null

  return (
    <nav className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border bg-card p-4"
    >
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
        目录
      </h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => handleClick(item.id)}
              className={cn(
                'w-full text-left text-sm transition-colors hover:text-primary',
                item.level === 2 ? 'pl-0' : 'pl-4',
                activeId === item.id
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
