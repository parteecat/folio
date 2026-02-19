import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useStore'

interface ThreeColumnLayoutProps {
  children: React.ReactNode
  leftSidebar?: React.ReactNode
  rightSidebar?: React.ReactNode
  className?: string
}

/**
 * 三栏布局组件
 * 
 * 布局结构：
 * - 左侧边栏：导航菜单（固定宽度，可折叠）
 * - 中间内容：主内容区域（自适应宽度）
 * - 右侧边栏：信息面板（固定宽度，可折叠）
 * 
 * 响应式设计：
 * - 桌面端：三栏布局
 * - 平板端：隐藏右侧边栏
 * - 移动端：隐藏左右侧边栏，显示汉堡菜单
 */
export function ThreeColumnLayout({
  children,
  leftSidebar,
  rightSidebar,
  className,
}: ThreeColumnLayoutProps) {
  const { isLeftSidebarOpen, isRightSidebarOpen } = useUIStore()

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="mx-auto max-w-7xl">
        <div className="flex min-h-screen">
          {/* 左侧边栏 */}
          {leftSidebar && (
            <aside
              className={cn(
                'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform duration-300 lg:sticky lg:translate-x-0',
                isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <div className="flex h-full flex-col">
                {leftSidebar}
              </div>
            </aside>
          )}

          {/* 中间内容区域 */}
          <main className="flex-1 min-w-0 border-r">
            <div className="min-h-screen">
              {children}
            </div>
          </main>

          {/* 右侧边栏 */}
          {rightSidebar && (
            <aside
              className={cn(
                'hidden w-80 bg-background xl:block',
                !isRightSidebarOpen && 'xl:hidden'
              )}
            >
              <div className="sticky top-0 h-screen overflow-y-auto p-4">
                {rightSidebar}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* 移动端遮罩层 */}
      {isLeftSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => useUIStore.getState().setLeftSidebarOpen(false)}
        />
      )}
    </div>
  )
}
