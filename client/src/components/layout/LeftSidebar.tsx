import { NavLink } from 'react-router-dom'
import { Home, Compass, User, Settings, PenSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore, useUIStore } from '@/store/useStore'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

const navItems: NavItem[] = [
  { to: '/', icon: <Home className="h-5 w-5" />, label: '首页' },
  { to: '/explore', icon: <Compass className="h-5 w-5" />, label: '探索' },
  { to: '/profile', icon: <User className="h-5 w-5" />, label: '个人资料' },
]

/**
 * 左侧导航边栏
 * 
 * 功能：
 * - 导航菜单链接
 * - 发布按钮（管理员显示）
 * - 设置入口
 */
export function LeftSidebar() {
  const { isAuthenticated, role } = useAuthStore()
  const { setLeftSidebarOpen } = useUIStore()

  return (
    <div className="flex h-full flex-col p-4">
      {/* Logo */}
      <div className="mb-8 px-4">
        <NavLink
          to="/"
          className="text-2xl font-bold tracking-tight"
          onClick={() => setLeftSidebarOpen(false)}
        >
          Folio
        </NavLink>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setLeftSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* 管理员入口 */}
        {isAuthenticated && role === 'ADMIN' && (
          <NavLink
            to="/admin/dashboard"
            onClick={() => setLeftSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <PenSquare className="h-5 w-5" />
            管理后台
          </NavLink>
        )}
      </nav>

      {/* 底部操作区 */}
      <div className="mt-auto space-y-2">
        {isAuthenticated ? (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => useAuthStore.getState().clearAuth()}
          >
            <Settings className="h-4 w-4" />
            退出登录
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            asChild
          >
            <NavLink to="/admin/login">
              <Settings className="h-4 w-4" />
              管理员登录
            </NavLink>
          </Button>
        )}
      </div>
    </div>
  )
}
