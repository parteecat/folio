import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TocProps {
  contentRef: React.RefObject<HTMLElement | null>
  html?: string
}

/**
 * 目录导航组件
 * 使用 IntersectionObserver 实现滚动高亮
 * 参考主流博客方案
 */
export function Toc({ contentRef, html }: TocProps) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const visibleIdsRef = useRef<Set<string>>(new Set())

  const findHeadingById = useCallback((container: HTMLElement, id: string) => {
    const element = container.ownerDocument.getElementById(id)
    if (element && container.contains(element)) {
      return element
    }
    return null
  }, [])

  // 提取标题并生成 id
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    // 延迟一下确保 DOM 已渲染
    const timer = setTimeout(() => {
      const headings = content.querySelectorAll('h2, h3')
      const tocItems: TocItem[] = []

      headings.forEach((heading, index) => {
        // 生成唯一的 id
        const text = heading.textContent || ''
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
          .replace(/^-|-$/g, '')
          || `heading-${index}`

        heading.id = id

        tocItems.push({
          id,
          text,
          level: parseInt(heading.tagName[1]),
        })
      })

      setItems(tocItems)
    }, 200)

    return () => clearTimeout(timer)
  }, [contentRef, html])

  // 使用 IntersectionObserver 监听标题可见性
  useEffect(() => {
    const content = contentRef.current
    if (!content || items.length === 0) return

    // 清理之前的 observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    visibleIdsRef.current.clear()

    const updateActiveId = () => {
      // 兜底：滚动到底部时强制使用最后一个标题
      const scrollTop = window.scrollY
      const viewportHeight = window.innerHeight
      const pageHeight = document.documentElement.scrollHeight

      if (scrollTop + viewportHeight >= pageHeight - 200) {
        const lastItem = items[items.length - 1]
        if (lastItem) {
          setActiveId(lastItem.id)
          return
        }
      }

      // 正常情况：高亮视口内最上面的标题
      if (visibleIdsRef.current.size > 0) {
        let topmostId = ''
        let topmostY = Infinity

        visibleIdsRef.current.forEach((id) => {
          const heading = findHeadingById(content, id)
          if (heading) {
            const rect = heading.getBoundingClientRect()
            if (rect.top < topmostY) {
              topmostY = rect.top
              topmostId = id
            }
          }
        })

        if (topmostId) {
          setActiveId(topmostId)
        }
      }
    }

    // 创建 IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id
          if (entry.isIntersecting) {
            visibleIdsRef.current.add(id)
          } else {
            visibleIdsRef.current.delete(id)
          }
        })

        updateActiveId()
      },
      {
        // 触发阈值：标题顶部进入视口上方 100px 时开始观察
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0,
      }
    )

    // 额外监听滚动事件处理边界情况
    const handleScroll = () => {
      updateActiveId()
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // 观察所有标题
    items.forEach((item) => {
      const heading = findHeadingById(content, item.id)
      if (heading && observerRef.current) {
        observerRef.current.observe(heading)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [contentRef, findHeadingById, items])

  // 点击平滑滚动
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (!element) return

    // 使用 window 滚动到目标位置
    const rect = element.getBoundingClientRect()
    const scrollTop = window.scrollY
    const targetY = rect.top + scrollTop - 100

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    })

    // 手动设置高亮
    setActiveId(id)
  }, [])

  if (items.length === 0) return null

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        目录
      </h3>
      <ul className="relative space-y-1">
        {items.map((item) => (
          <li key={item.id} className="relative">
            {/* 活跃指示条 */}
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-full transition-all duration-200',
                activeId === item.id ? 'opacity-100' : 'opacity-0'
              )}
            />
            <button
              onClick={() => handleClick(item.id)}
              className={cn(
                'relative w-full text-left text-sm transition-all duration-200 py-1.5 pl-3',
                item.level === 2 ? 'font-medium' : 'pl-6 text-xs',
                activeId === item.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
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
