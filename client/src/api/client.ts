import { useAuthStore } from '@/store/useStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * API客户端
 * 封装fetch请求，处理认证、错误、token刷新
 */
class ApiClient {
  private baseURL: string

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const token = useAuthStore.getState().accessToken
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Token过期，尝试刷新
      if (response.status === 401) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          // 重试原请求
          throw new Error('RETRY_REQUEST')
        }
      }

      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * 刷新Token
   */
  private async refreshToken(): Promise<boolean> {
    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      useAuthStore.getState().clearAuth()
      return false
    }

    try {
      const response = await fetch(`${this.baseURL}/api/admin/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        },
      })

      if (!response.ok) {
        useAuthStore.getState().clearAuth()
        return false
      }

      const { accessToken } = await response.json()
      useAuthStore.getState().updateAccessToken(accessToken)
      return true
    } catch {
      useAuthStore.getState().clearAuth()
      return false
    }
  }

  /**
   * GET请求
   */
  async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : ''

    const response = await fetch(`${this.baseURL}${url}${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  /**
   * POST请求
   */
  async post<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  /**
   * PUT请求
   */
  async put<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  /**
   * DELETE请求
   */
  async delete<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  /**
   * 文件上传
   */
  async upload<T>(url: string, file: File): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {}
    const token = useAuthStore.getState().accessToken
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    return this.handleResponse<T>(response)
  }
}

// 导出单例
export const apiClient = new ApiClient(API_BASE_URL)

/**
 * API方法集合
 */
export const api = {
  // 认证
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/api/admin/login', { email, password }),
    refresh: () => apiClient.post('/api/admin/refresh'),
  },

  // 帖子
  posts: {
    list: (params?: { cursor?: string; type?: string; limit?: string }) =>
      apiClient.get('/api/posts', params),
    get: (slug: string) => apiClient.get(`/api/posts/${slug}`),
    like: (id: string) => apiClient.post(`/api/posts/${id}/like`),
  },

  // 标签
  tags: {
    list: () => apiClient.get('/api/tags'),
  },

  // 搜索
  search: (q: string) => apiClient.get('/api/search', { q }),

  // 管理
  admin: {
    getPosts: () => apiClient.get('/api/admin/posts'),
    createPost: (data: unknown) => apiClient.post('/api/admin/posts', data),
    updatePost: (id: string, data: unknown) =>
      apiClient.put(`/api/admin/posts/${id}`, data),
    deletePost: (id: string) => apiClient.delete(`/api/admin/posts/${id}`),
    getStats: () => apiClient.get('/api/admin/stats'),
  },

  // 上传
  upload: (file: File) => apiClient.upload('/api/upload', file),
}
