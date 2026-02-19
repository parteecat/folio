import type { PostType, UserRole } from '@prisma/client'

/**
 * JWT载荷类型
 */
export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

/**
 * Context中的用户类型
 */
export interface ContextUser {
  userId: string
  email: string
  role: UserRole
}

/**
 * API响应包装类型
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  cursor?: string
  limit?: number
}

/**
 * 分页响应类型
 */
export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}

/**
 * 帖子列表项（公开接口返回）
 */
export interface PostListItem {
  id: string
  type: PostType
  slug: string
  title: string | null
  excerpt: string | null
  coverImage: string | null
  images: string[]
  publishedAt: Date | null
  likeCount: number
  tags: {
    id: string
    name: string
    slug: string
  }[]
  author: {
    id: string
    name: string | null
    avatar: string | null
  }
}

/**
 * 帖子详情（公开接口返回）
 */
export interface PostDetail extends PostListItem {
  contentMD: string
  contentHTML: string
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建帖子请求体
 */
export interface CreatePostBody {
  type: PostType
  slug: string
  title?: string
  contentMD: string
  contentHTML: string
  excerpt?: string
  coverImage?: string
  images?: string[]
  tagIds?: string[]
  published?: boolean
}

/**
 * 更新帖子请求体
 */
export interface UpdatePostBody extends Partial<CreatePostBody> {}

/**
 * 登录请求体
 */
export interface LoginBody {
  email: string
  password: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string | null
    role: UserRole
  }
}

/**
 * 刷新Token响应
 */
export interface RefreshTokenResponse {
  accessToken: string
}

/**
 * 点赞响应
 */
export interface LikeResponse {
  likeCount: number
  liked: boolean
}

/**
 * 标签列表项
 */
export interface TagListItem {
  id: string
  name: string
  slug: string
  _count: {
    posts: number
  }
}

/**
 * 上传响应
 */
export interface UploadResponse {
  url: string
  filename: string
  size: number
}
