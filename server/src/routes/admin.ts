import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { jwtAuth } from '../middleware/jwtAuth.js'
import type { LoginBody, LoginResponse, CreatePostBody, UpdatePostBody } from '../types.js'

const { sign, verify } = jwt

const admin = new Hono()

/**
 * JWT Token生成
 * accessToken: 15分钟有效期，用于API认证
 * refreshToken: 7天有效期，用于刷新accessToken
 */
const generateTokens = (payload: { userId: string; email: string; role: string }) => {
  const secret = process.env.JWT_SECRET!
  const refreshSecret = process.env.JWT_REFRESH_SECRET!
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m'
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

  const accessToken = sign(payload, secret, { expiresIn })
  const refreshToken = sign(payload, refreshSecret, { expiresIn: refreshExpiresIn })

  return { accessToken, refreshToken }
}

/**
 * POST /api/admin/login
 * 管理员登录
 */
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

admin.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json') as LoginBody

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  } as LoginResponse)
})

/**
 * POST /api/admin/refresh
 * 刷新accessToken
 * 使用refreshToken获取新的accessToken
 */
admin.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing refresh token' }, 401)
  }

  const refreshToken = authHeader.substring(7)

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET!
    const decoded = verify(refreshToken, refreshSecret) as {
      userId: string
      email: string
      role: string
    }

    // 验证用户是否仍然存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const { accessToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return c.json({ accessToken })
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }
})

/**
 * 以下接口需要JWT认证
 */
admin.use('*', jwtAuth)

/**
 * GET /api/admin/posts
 * 获取所有帖子（包括未发布的）
 */
admin.get('/posts', async (c) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tags: {
        select: { id: true, name: true, slug: true },
      },
      author: {
        select: { id: true, name: true },
      },
    },
  })

  return c.json(posts)
})

/**
 * POST /api/admin/posts
 * 创建帖子
 */
const createPostSchema = z.object({
  type: z.enum(['SHORT', 'ARTICLE']),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().optional(),
  contentMD: z.string().min(1),
  contentHTML: z.string().min(1),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  published: z.boolean().default(false),
})

admin.post('/posts', zValidator('json', createPostSchema), async (c) => {
  const data = c.req.valid('json') as CreatePostBody
  const user = c.get('user')

  // 检查slug是否已存在
  const existing = await prisma.post.findUnique({
    where: { slug: data.slug },
  })

  if (existing) {
    return c.json({ error: 'Slug already exists' }, 409)
  }

  const post = await prisma.post.create({
    data: {
      ...data,
      authorId: user.userId,
      publishedAt: data.published ? new Date() : null,
      tags: {
        connect: data.tagIds?.map(id => ({ id })) || [],
      },
    },
    include: {
      tags: true,
      author: {
        select: { id: true, name: true },
      },
    },
  })

  return c.json(post, 201)
})

/**
 * PUT /api/admin/posts/:id
 * 更新帖子
 */
const updatePostSchema = createPostSchema.partial()

admin.put('/posts/:id', zValidator('json', updatePostSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json') as UpdatePostBody

  const existing = await prisma.post.findUnique({
    where: { id },
  })

  if (!existing) {
    return c.json({ error: 'Post not found' }, 404)
  }

  // 如果slug变更，检查新slug是否已存在
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.post.findUnique({
      where: { slug: data.slug },
    })
    if (slugExists) {
      return c.json({ error: 'Slug already exists' }, 409)
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...data,
      // 从未发布变为已发布时，设置发布时间
      ...(data.published && !existing.published && { publishedAt: new Date() }),
      // 从已发布变为未发布时，清空发布时间
      ...(data.published === false && existing.published && { publishedAt: null }),
      tags: data.tagIds ? {
        set: data.tagIds.map(id => ({ id })),
      } : undefined,
    },
    include: {
      tags: true,
      author: {
        select: { id: true, name: true },
      },
    },
  })

  return c.json(post)
})

/**
 * DELETE /api/admin/posts/:id
 * 删除帖子
 */
admin.delete('/posts/:id', async (c) => {
  const id = c.req.param('id')

  const existing = await prisma.post.findUnique({
    where: { id },
  })

  if (!existing) {
    return c.json({ error: 'Post not found' }, 404)
  }

  await prisma.post.delete({
    where: { id },
  })

  return c.json({ message: 'Post deleted' })
})

/**
 * GET /api/admin/stats
 * 获取统计数据
 */
admin.get('/stats', async (c) => {
  const [
    totalPosts,
    publishedPosts,
    totalTags,
    totalLikes,
    totalViews,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.tag.count(),
    prisma.post.aggregate({ _sum: { likeCount: true } }),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
  ])

  return c.json({
    totalPosts,
    publishedPosts,
    draftPosts: totalPosts - publishedPosts,
    totalTags,
    totalLikes: totalLikes._sum.likeCount || 0,
    totalViews: totalViews._sum.viewCount || 0,
  })
})

export default admin
