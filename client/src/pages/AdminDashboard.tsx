import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Tags, Eye, Heart, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/useStore'
import type { Stats } from '@/types'

/**
 * 管理仪表盘
 * 
 * 功能：
 * - 统计数据展示
 * - 快捷入口
 * - 文章列表
 */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login')
      return
    }

    loadStats()
  }, [isAuthenticated, navigate])

  const loadStats = async () => {
    try {
      const data = await api.admin.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">管理后台</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              返回首页
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/editor')}>
              <Plus className="mr-2 h-4 w-4" />
              新建文章
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="mx-auto max-w-6xl p-4">
        {/* 统计卡片 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="总文章"
            value={stats?.totalPosts || 0}
            icon={<FileText className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <StatCard
            title="已发布"
            value={stats?.publishedPosts || 0}
            icon={<Settings className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <StatCard
            title="总浏览"
            value={stats?.totalViews || 0}
            icon={<Eye className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <StatCard
            title="总点赞"
            value={stats?.totalLikes || 0}
            icon={<Heart className="h-4 w-4" />}
            isLoading={isLoading}
          />
        </div>

        {/* 快捷入口 */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">文章管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/editor')}
              >
                <Plus className="mr-2 h-4 w-4" />
                新建文章
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/posts')}
              >
                <FileText className="mr-2 h-4 w-4" />
                文章列表
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">标签管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/tags')}
              >
                <Tags className="mr-2 h-4 w-4" />
                标签列表
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

/**
 * 统计卡片组件
 */
function StatCard({
  title,
  value,
  icon,
  isLoading,
}: {
  title: string
  value: number
  icon: React.ReactNode
  isLoading: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">
              {isLoading ? '-' : value.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
