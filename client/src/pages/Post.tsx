import { useParams, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThreeColumnLayout } from '@/components/layout/ThreeColumnLayout'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'

/**
 * 文章详情页
 * 
 * 功能：
 * - 显示文章完整内容
 * - 阅读进度条
 * - 目录导航
 * - 代码块高亮
 * - 图片灯箱
 * - 点赞功能
 */
export default function Post() {
  const { slug } = useParams<{ slug: string }>()

  if (!slug) {
    return <Navigate to="/" replace />
  }

  return (
    <ThreeColumnLayout
      leftSidebar={<LeftSidebar />}
      rightSidebar={<RightSidebar />}
    >
      {/* 返回按钮 */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">文章详情</h1>
      </header>

      {/* 文章内容区域 */}
      <article className="p-4">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">文章详情内容将在这里显示</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Slug: {slug}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            请继续开发文章详情组件
          </p>
        </div>
      </article>
    </ThreeColumnLayout>
  )
}
