import { useEffect } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThreeColumnLayout } from '@/components/layout/ThreeColumnLayout'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { useUIStore } from '@/store/useStore'

/**
 * 首页（Feed流）
 * 
 * 功能：
 * - 三栏布局展示
 * - 帖子列表（无限滚动）
 * - 类型筛选（全部/短文/文章）
 */
export default function Home() {
  const { toggleLeftSidebar } = useUIStore()

  return (
    <ThreeColumnLayout
      leftSidebar={<LeftSidebar />}
      rightSidebar={<RightSidebar />}
    >
      {/* 顶部导航栏（移动端显示） */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Folio</h1>
        <div className="w-9" /> {/* 占位保持居中 */}
      </header>

      {/* 桌面端标题栏 */}
      <header className="hidden border-b px-4 py-3 lg:block">
        <h1 className="text-xl font-bold">首页</h1>
      </header>

      {/* Feed流内容区域 */}
      <div className="p-4">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Feed流内容将在这里显示</p>
          <p className="mt-2 text-sm text-muted-foreground">
            请继续开发 FeedCard 组件和无限滚动功能
          </p>
        </div>
      </div>
    </ThreeColumnLayout>
  )
}
