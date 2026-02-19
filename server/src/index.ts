import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { serveStatic } from '@hono/node-server/serve-static'
import posts from './routes/posts.js'
import admin from './routes/admin.js'
import upload from './routes/upload.js'

/**
 * 创建Hono应用实例
 */
const app = new Hono()

/**
 * 全局中间件
 */
// CORS配置 - 允许前端开发服务器访问
app.use('*', cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:5173', 'http://localhost:3001'] 
    : process.env.CLIENT_URL || '',
  credentials: true,
}))

// 请求日志
app.use('*', logger())

// 美化JSON响应（开发环境）
if (process.env.NODE_ENV === 'development') {
  app.use('*', prettyJSON())
}

/**
 * 静态文件服务
 * /uploads/* 直接读取文件系统，不经过Node处理
 */
app.use('/uploads/*', serveStatic({
  root: './',
}))

/**
 * 健康检查
 */
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

/**
 * API路由
 */
// 公开接口
app.route('/api/posts', posts)
app.route('/api/tags', posts)
app.route('/api/search', posts)

// 管理接口
app.route('/api/admin', admin)

// 上传接口
app.route('/api/upload', upload)

/**
 * 404处理
 */
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404)
})

/**
 * 全局错误处理
 */
app.onError((err, c) => {
  console.error('Server error:', err)
  
  return c.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  }, 500)
})

/**
 * 启动服务器
 */
const PORT = parseInt(process.env.PORT || '3000')

console.log(`🚀 Server starting on port ${PORT}...`)
console.log(`📁 Upload directory: ${process.env.UPLOAD_DIR || './uploads'}`)
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`✅ Server ready at http://localhost:${info.port}`)
})

export default app
