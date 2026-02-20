/**
 * 帖子类型枚举
 */
export enum PostType {
  SHORT = 'SHORT',
  ARTICLE = 'ARTICLE',
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/**
 * 标签类型
 */
export interface Tag {
  id: string
  name: string
  slug: string
}

/**
 * 作者类型
 */
export interface Author {
  id: string
  name: string | null
  avatar: string | null
}

/**
 * 帖子列表项
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
  createdAt: string
  likeCount: number
  tags: Tag[]
  author: Author
}

/**
 * 帖子详情
 */
export interface PostDetail extends PostListItem {
  contentMD: string
  contentHTML: string
  viewCount: number
  createdAt: string
  updatedAt: string
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
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
 * 点赞响应
 */
export interface LikeResponse {
  likeCount: number
  liked: boolean
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
