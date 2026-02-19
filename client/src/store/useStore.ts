import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserState, PostListItem, Tag } from '@/types'

/**
 * 认证状态存储
 * 使用localStorage持久化token和用户信息
 */
interface AuthStore extends UserState {
  accessToken: string | null
  refreshToken: string | null
  
  // Actions
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: Omit<UserState, 'isAuthenticated'>) => void
  clearAuth: () => void
  updateAccessToken: (accessToken: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      id: null,
      email: null,
      name: null,
      role: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      // Actions
      setAuth: (tokens, user) => set({
        ...user,
        isAuthenticated: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }),

      clearAuth: () => set({
        id: null,
        email: null,
        name: null,
        role: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
      }),

      updateAccessToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'folio-auth',
    }
  )
)

/**
 * Feed流状态存储
 * 管理帖子列表、加载状态、分页信息
 */
interface FeedStore {
  posts: PostListItem[]
  cursor: string | undefined
  hasMore: boolean
  isLoading: boolean
  selectedType: 'ALL' | 'SHORT' | 'ARTICLE'
  
  // Actions
  setPosts: (posts: PostListItem[]) => void
  appendPosts: (posts: PostListItem[], cursor?: string, hasMore?: boolean) => void
  setLoading: (loading: boolean) => void
  setSelectedType: (type: 'ALL' | 'SHORT' | 'ARTICLE') => void
  reset: () => void
}

export const useFeedStore = create<FeedStore>((set) => ({
  // Initial state
  posts: [],
  cursor: undefined,
  hasMore: true,
  isLoading: false,
  selectedType: 'ALL',

  // Actions
  setPosts: (posts) => set({ posts }),

  appendPosts: (posts, cursor, hasMore) => set((state) => ({
    posts: [...state.posts, ...posts],
    cursor,
    hasMore: hasMore ?? state.hasMore,
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setSelectedType: (type) => set({
    selectedType: type,
    posts: [],
    cursor: undefined,
    hasMore: true,
  }),

  reset: () => set({
    posts: [],
    cursor: undefined,
    hasMore: true,
    isLoading: false,
  }),
}))

/**
 * 标签状态存储
 */
interface TagStore {
  tags: Tag[]
  isLoading: boolean
  
  // Actions
  setTags: (tags: Tag[]) => void
  setLoading: (loading: boolean) => void
}

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  isLoading: false,

  setTags: (tags) => set({ tags }),
  setLoading: (loading) => set({ isLoading: loading }),
}))

/**
 * UI状态存储
 * 管理全局UI状态（主题、侧边栏等）
 */
interface UIStore {
  isLeftSidebarOpen: boolean
  isRightSidebarOpen: boolean
  
  // Actions
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setLeftSidebarOpen: (open: boolean) => void
  setRightSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,

  toggleLeftSidebar: () => set((state) => ({ 
    isLeftSidebarOpen: !state.isLeftSidebarOpen 
  })),

  toggleRightSidebar: () => set((state) => ({ 
    isRightSidebarOpen: !state.isRightSidebarOpen 
  })),

  setLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),
  setRightSidebarOpen: (open) => set({ isRightSidebarOpen: open }),
}))
