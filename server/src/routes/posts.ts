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
  tag: z.string().optional(),
  limit: z.string().transform(Number).default('10'),
})

/**
 * GET /api/posts
 * 获取帖子列表（Feed流）
 * 支持分页、类型筛选
 */
posts.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { cursor, type, tag, limit } = c.req.valid('query')
  const take = Math.min(limit, 20) // 最大20条

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...(type && { type }),
      ...(tag && {
        tags: {
          some: {
            slug: tag,
          },
        },
      }),
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
 * 获取单篇帖子详情（支持 slug 或 id）
 */
posts.get('/:slug', async (c) => {
  const slugOrId = c.req.param('slug')
  const isId = slugOrId.includes('c') // 简单判断是否是 cuid

  // 先尝试通过 slug 查询，失败则通过 id 查询
  let post = isId
    ? await prisma.post.findUnique({
        where: { id: slugOrId },
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
    : await prisma.post.findUnique({
        where: { slug: slugOrId },
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

  if (!post) {
    return c.json({ error: 'Post not found' }, 404)
  }

  // 只有公开文章才增加浏览量
  if (post.publishedAt) {
    prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {
      // 忽略浏览量更新失败
    })
  }

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

export default posts
