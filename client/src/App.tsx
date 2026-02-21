import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useStore'

// 页面导入
import Home from '@/pages/Home'
import Post from '@/pages/Post'
import Tag from '@/pages/Tag'
import AdminLogin from '@/pages/AdminLogin'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminEditor from '@/pages/AdminEditor'
import AdminPostList from '@/pages/AdminPostList'
import AdminShuoList from '@/pages/AdminShuoList'
import AdminTagList from '@/pages/AdminTagList'

/**
 * 受保护路由组件
 * 需要登录才能访问
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

/**
 * 主应用组件
 *
 * 路由配置：
 * - / - 首页（Feed流）
 * - /post/:slug - 文章详情
 * - /admin/login - 管理员登录
 * - /admin/dashboard - 管理仪表盘（需登录）
 * - /admin/posts - 文章列表管理（需登录）
 * - /admin/editor - 新建文章（需登录）
 * - /admin/editor/:id - 编辑文章（需登录）
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<Post />} />
        <Route path="/tag/:slug" element={<Tag />} />

        {/* 管理后台路由 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/posts"
          element={
            <ProtectedRoute>
              <AdminPostList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shuos"
          element={
            <ProtectedRoute>
              <AdminShuoList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tags"
          element={
            <ProtectedRoute>
              <AdminTagList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/editor"
          element={
            <ProtectedRoute>
              <AdminEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/editor/:id"
          element={
            <ProtectedRoute>
              <AdminEditor />
            </ProtectedRoute>
          }
        />

        {/* 404重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
