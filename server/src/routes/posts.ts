import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import type { PostListItem, PostDetail, LikeResponse } from '../types.js'

const posts = new Hono()

/**
 * 查询参数验证schema
 */
const listQuerySchema = z.object({
  cursor: z.string().optional(),
  type: z.enum(['SHORT', 'ARTICLE']).optional(),
  limit: z.string().transform(Number).default('10'),
})

/**
 * GET /api/posts
 * 获取帖子列表（Feed流）
 * 支持分页、类型筛选
 */
posts.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { cursor, type, limit } = c.req.valid('query')
  const take = Math.min(limit, 20) // 最大20条

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...(type && { type }),
      ...(cursor && {
        publishedAt: {
          lt: new Date(cursor),
        },
      }),
    },
    take: take + 1, // 多取一条判断是否还有下一页
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      images: true,
      publishedAt: true,
      likeCount: true,
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  const hasMore = posts.length > take
  const data = hasMore ? posts.slice(0, take) : posts
  const nextCursor = hasMore && data.length > 0
    ? data[data.length - 1].publishedAt?.toISOString()
    : undefined

  return c.json({
    data: data as PostListItem[],
    nextCursor,
    hasMore,
  })
})

/**
 * GET /api/posts/:slug
 * 获取单篇帖子详情
 */
posts.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      contentMD: true,
      contentHTML: true,
      excerpt: true,
      coverImage: true,
      images: true,
      publishedAt: true,
      likeCount: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  if (!post || !post.publishedAt) {
    return c.json({ error: 'Post not found' }, 404)
  }

  // 异步增加浏览量（不阻塞响应）
  prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {
    // 忽略浏览量更新失败
  })

  return c.json(post as PostDetail)
})

/**
 * POST /api/posts/:id/like
 * 点赞/取消点赞
 * 使用localStorage记录点赞状态，后端只负责计数
 */
posts.post('/:id/like', async (c) => {
  const id = c.req.param('id')

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, likeCount: true, published: true },
  })

  if (!post || !post.published) {
    return c.json({ error: 'Post not found' }, 404)
  }

  // 增加点赞数
  const updated = await prisma.post.update({
    where: { id },
    data: { likeCount: { increment: 1 } },
    select: { likeCount: true },
  })

  return c.json({
    likeCount: updated.likeCount,
    liked: true,
  } as LikeResponse)
})

/**
 * GET /api/tags
 * 获取所有标签
 */
posts.get('/tags', async (c) => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })

  return c.json(tags)
})

/**
 * GET /api/search?q=
 * 搜索帖子
 */
posts.get('/search', async (c) => {
  const q = c.req.query('q')
  
  if (!q || q.trim().length < 2) {
    return c.json({ data: [], hasMore: false })
  }

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { contentMD: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 20,
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      likeCount: true,
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  return c.json({
    data: posts as PostListItem[],
    hasMore: false,
  })
})

export default posts
