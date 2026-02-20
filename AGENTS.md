个人博客项目 folio，采用前后端分离架构。

## 项目介绍
这是推特的样式的博客，既能像阅读推文一样，可以看图片和短文，对于长文类型的帖子也能打开另外的阅读页面阅读长文。

- 帖子有两种类型，推文和文章
- 文章阅读体验跟主流的一样，但是要保证阅读体验简洁，但是显示功能要齐全，例如阅读进度条、导航目录、代码块、图片放大等
- 帖子暂时不支持评论，但是可以点赞
- 推特的整体布局如图，参考并且改造成个人博客网站

## 技术栈
- 前端：React + Vite + React Router + Tailwind CSS + Shadcn/ui + Zustand
- 后端：Hono（TypeScript）+ Prisma + PostgreSQL
- 部署：Docker Compose + Nginx（单机部署）

## 目录结构
folio/
├── client/（前端 React SPA）
│   ├── src/pages/（Home, Post, Tag, AdminLogin, AdminDashboard, AdminEditor）
│   ├── src/components/（FeedCard区分SHORT/ARTICLE, ReadingProgress, Toc, TipTapEditor）
│   └── src/api/（Hono API 封装，fetch wrapper）
└── server/（后端 Hono API）
    ├── src/routes/（posts.ts公开接口, admin.ts需JWT, upload.ts图片上传）
    ├── src/middleware/（jwtAuth.ts验证）
    └── prisma/schema.prisma

## 核心功能需求

### 前端（阅读体验）
1. Feed流（/）：三栏布局（左导航 | 中内容 | 右面板），无限滚动加载
   - 左导航：菜单栏，包含首页、探索（标签列表）、个人资料
   - 中内容：展示Feed流
    - 短内容（SHORT）：直接展示全文+图片网格（1/2/3/4张不同布局）
    - 长文章（ARTICLE）：封面+标题+摘要+"阅读全文"按钮
    - 点击卡片进入文章详情（React Router跳转，非刷新）
   - 右面板：
    - 简单个人资料展示，包含头像、昵称、一句话介绍、社交连接（如Twitter、GitHub等）。
    - 最近文章列表，展示最近发布的文章标题和摘要。点击标题进入详情页。
    - 热门文章列表，展示点赞数最多的文章标题和摘要。点击标题进入详情页。

2. 文章详情（/post/:slug）：
   - 顶部阅读进度条（滚动监听）
   - 右侧悬浮目录（点击平滑滚动，当前章节高亮）
   - 代码块深色主题+复制按钮（使用Shiki或Prism）
   - 图片点击灯箱放大（支持ESC关闭）
   - 底部点赞按钮（心形动画，localStorage记录状态）

3. 后台管理（/admin/*）：
   - 登录页：用户名+密码，JWT存储localStorage
   - 仪表盘：统计卡片+快捷入口
   - 编辑器：TipTap富文本，支持切换Markdown源码模式，支持粘贴Markdown自动转换
   - 图片上传：拖拽上传，调用后端/api/upload，返回URL插入正文
   - 元数据设置：封面图、标签、Slug、摘要、发布状态开关

### 后端（Hono API）
1. 公开接口（无需认证）：
   - GET /api/posts?cursor=&type=&limit=（分页Feed）
   - GET /api/posts/:slug（单篇详情，返回contentMD和contentHTML）
   - GET /api/tags
   - GET /api/search?q=
   - POST /api/posts/:id/like（点赞）（返回{likeCount: 新点赞数}）

2. 管理接口（需JWT Bearer Token）：
   - POST /api/admin/login（返回{accessToken, refreshToken}）
   - POST /api/admin/posts（创建，同时存MD和HTML）
   - PUT /api/admin/posts/:id
   - DELETE /api/admin/posts/:id
   - POST /api/upload（保存到./uploads/，返回URL）

3. 数据库模型（Prisma）：
   - Post表：id, type(SHORT/ARTICLE), slug, contentMD, contentHTML, excerpt, coverImage, images[], published, publishedAt, likeCount, authorId
   - User表：id, email, password(bcrypted), role
   - Tag表：多对多关联

## 部署配置
- Docker Compose包含：Postgres, Hono(3000端口), Nginx(80端口)
- Nginx配置：
  - /uploads/ → 直接读磁盘（不经过Node）
  - /api/ → 代理到Hono
  - /* → 前端dist/index.html（SPA回退）

## 要求
- 类型安全：前后端共享TypeScript类型（可定义shared/types.ts）
- 编辑器必须支持从Obsidian/Typora粘贴Markdown并正确渲染为富文本
- 图片上传禁止base64，必须存文件系统
- 前端使用Zustand管理服务端状态
- 代码注释清晰，说明关键逻辑（如JWT刷新机制、图片上传流程）
- Git提交的Message遵循Angular风格提交规范
