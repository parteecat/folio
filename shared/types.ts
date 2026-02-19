/**
 * 前后端共享类型定义
 * 
 * 这些类型在前后端之间共享，确保类型一致性
 */

// ============================================================================
// 枚举类型
// ============================================================================

/**
 * 帖子类型
 */
export enum PostType {
  SHORT = 'SHORT',     // 短内容（推文样式）
  ARTICLE = 'ARTICLE', // 长文章
}

/**
 * 用户角色
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// ============================================================================
// 基础类型
// ============================================================================

/**
 * 标签
 */
export interface Tag {
  id: string
  name: string
  slug: string
}

/**
 * 作者
 */
export interface Author {
  id: string
  name: string | null
  avatar: string | null
}

// ============================================================================
// 帖子相关类型
// ============================================================================

/**
 * 帖子列表项
 * 用于Feed流展示
 */
export interface PostListItem {
  id: string
  type: PostType
  slug: string
  title: string | null
  excerpt: string | null
  coverImage: string | null
  images: string[]
  publishedAt: string | null
  likeCount: number
  tags: Tag[]
  author: Author
}

/**
 * 帖子详情
 * 用于文章详情页
 */
export interface PostDetail extends PostListItem {
  contentMD: string    // Markdown原文
  contentHTML: string  // 渲染后的HTML
  viewCount: number
  createdAt: string
  updatedAt: string
}

/**
 * 创建帖子请求
 */
export interface CreatePostRequest {
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
 * 更新帖子请求
 */
export type UpdatePostRequest = Partial<CreatePostRequest>

// ============================================================================
// 分页类型
// ============================================================================

/**
 * 分页请求参数
 */
export interface PaginationParams {
  cursor?: string
  limit?: number
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}

// ============================================================================
// 认证相关类型
// ============================================================================

/**
 * JWT载荷
 */
export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

/**
 * Context中的用户
 */
export interface ContextUser {
  userId: string
  email: string
  role: UserRole
}

/**
 * 登录请求
 */
export interface LoginRequest {
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

// ============================================================================
// 其他响应类型
// ============================================================================

/**
 * API标准响应格式
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

/**
 * 点赞响应
 */
export interface LikeResponse {
  likeCount: number
  liked: boolean
}

/**
 * 标签列表项（带文章计数）
 */
export interface TagListItem extends Tag {
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

/**
 * 统计数据
 */
export interface Stats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalTags: number
  totalLikes: number
  totalViews: number
}

// ============================================================================
// 前端状态类型
// ============================================================================

/**
 * 用户状态
 */
export interface UserState {
  id: string | null
  email: string | null
  name: string | null
  role: UserRole | null
  isAuthenticated: boolean
}
