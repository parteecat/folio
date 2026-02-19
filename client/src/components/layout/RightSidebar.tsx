import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { TrendingUp, Clock, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { api } from '@/api/client'
import { useFeedStore } from '@/store/useStore'
import { formatRelativeTime } from '@/lib/utils'
import type { PostListItem } from '@/types'

/**
 * 个人资料卡片
 */
function ProfileCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/avatar.jpg" alt="博主" />
            <AvatarFallback>博</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">博主名称</h3>
            <p className="text-sm text-muted-foreground">
              热爱分享，记录生活
            </p>
          </div>
        </div>
        
        {/* 社交链接 */}
        <div className="mt-4 flex gap-2">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Twitter
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            GitHub
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 最近文章列表
 */
function RecentPosts() {
  const { posts, setPosts } = useFeedStore()

  useEffect(() => {
    // 获取最近5篇文章
    api.posts.list({ limit: '5' }).then((response) => {
      setPosts(response.data)
    })
  }, [setPosts])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          最近文章
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {posts.slice(0, 5).map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 热门文章列表
 */
function TrendingPosts() {
  const [posts, setPosts] = useState<PostListItem[]>([])

  useEffect(() => {
    // 获取点赞最多的文章
    api.posts.list({ limit: '5' }).then((response) => {
      // 按点赞数排序
      const sorted = [...response.data].sort((a, b) => b.likeCount - a.likeCount)
      setPosts(sorted)
    })
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          热门文章
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {posts.slice(0, 5).map((post) => (
            <PostListItem key={post.id} post={post} showLikes />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 文章列表项
 */
function PostListItem({ 
  post, 
  showLikes = false 
}: { 
  post: PostListItem
  showLikes?: boolean 
}) {
  return (
    <NavLink
      to={`/post/${post.slug}`}
      className="group block"
    >
      <h4 className="text-sm font-medium group-hover:text-primary line-clamp-2">
        {post.title || '无标题'}
      </h4>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatRelativeTime(post.publishedAt || post.createdAt)}</span>
        {showLikes && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {post.likeCount}
            </span>
          </>
        )}
      </div>
    </NavLink>
  )
}

import { useState } from 'react'

/**
 * 右侧边栏
 * 
 * 包含：
 * - 个人资料展示
 * - 最近文章列表
 * - 热门文章列表
 */
export function RightSidebar() {
  return (
    <div className="space-y-4">
      <ProfileCard />
      <RecentPosts />
      <TrendingPosts />
    </div>
  )
}
