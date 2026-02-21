# Folio - 推特风格个人博客

一个现代化的个人博客项目，采用推特风格的界面设计，支持短内容和长文章两种发布形式。

## 项目简介

Folio 是一个采用前后端分离架构的个人博客系统，融合了推特的信息流体验和传统博客的长文阅读体验：

- **双类型内容**：支持短内容（推文）和长文章两种发布形式
- **推特风格布局**：三栏式布局，提供流畅的 Feed 流阅读体验
- **完善的文章阅读**：长文章支持阅读进度条、目录导航、代码高亮、图片放大等功能
- **后台管理**：完整的富文本编辑器、Markdown 支持、图片上传等功能
- **点赞功能**：支持对内容点赞，本地记录点赞状态

## 技术栈

### 前端
- **React 19** - 用户界面库
- **Vite** - 构建工具
- **React Router** - 路由管理
- **Tailwind CSS** - 样式框架
- **Shadcn/ui** - UI 组件库
- **Zustand** - 状态管理
- **TipTap** - 富文本编辑器
- **Lucide React** - 图标库

### 后端
- **Hono** - TypeScript Web 框架
- **Prisma** - ORM
- **PostgreSQL** - 数据库
- **JWT** - 身份认证
- **Zod** - 数据验证

### 部署
- **Docker Compose** - 容器编排
- **Nginx** - 反向代理

## 目录结构

```
folio/
├── client/                 # 前端 React SPA
│   ├── src/
│   │   ├── pages/         # 页面组件（Home, Post, Tag, Admin 等）
│   │   ├── components/    # 可复用组件
│   │   └── api/           # API 封装
│   ├── package.json
│   └── vite.config.ts
├── server/                 # 后端 Hono API
│   ├── src/
│   │   ├── routes/        # 路由模块
│   │   ├── middleware/    # 中间件
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma  # 数据模型
│   └── package.json
├── shared/                 # 共享类型定义
├── docker-compose.yml      # Docker 编排配置
└── README.md
```

## 快速开始

### 前置要求

- Node.js 20+
- pnpm 或 npm
- Docker & Docker Compose (推荐)

### 开发环境启动

#### 1. 启动数据库
```bash
docker-compose up -d postgres
```

#### 2. 安装依赖

**前端:**
```bash
cd client
npm install
```

**后端:**
```bash
cd server
npm install
```

#### 3. 初始化数据库
```bash
cd server
npm run db:generate
npm run db:migrate
```

#### 4. 启动开发服务器

**后端 (端口 3000):**
```bash
cd server
npm run dev
```

**前端 (端口 5173):**
```bash
cd client
npm run dev
```

### Docker 部署

```bash
docker-compose up -d
```

## 核心功能

### 前端功能

1. **Feed 流 (/ )**
   - 三栏布局：左导航 | 中内容 | 右面板
   - 无限滚动加载
   - 短内容直接展示全文和图片网格
   - 长文章显示封面、标题、摘要和"阅读全文"按钮

2. **文章详情 (/post/:slug)**
   - 顶部阅读进度条
   - 右侧悬浮目录导航
   - 代码块高亮 + 复制按钮
   - 图片点击灯箱放大
   - 底部点赞按钮

3. **后台管理 (/admin/*)**
   - JWT 身份认证
   - 数据统计仪表盘
   - TipTap 富文本编辑器
   - 支持 Markdown 粘贴自动转换
   - 图片拖拽上传
   - 文章元数据管理

### 后端 API

#### 公开接口
- `GET /api/posts` - 获取 Feed 流（支持分页）
- `GET /api/posts/:slug` - 获取文章详情
- `GET /api/tags` - 获取标签列表
- `GET /api/search` - 搜索文章
- `POST /api/posts/:id/like` - 点赞文章

#### 管理接口（需认证）
- `POST /api/admin/login` - 管理员登录
- `POST /api/admin/posts` - 创建文章
- `PUT /api/admin/posts/:id` - 更新文章
- `DELETE /api/admin/posts/:id` - 删除文章
- `POST /api/upload` - 图片上传

## 数据库模型

- **Post** - 文章表（支持 SHORT/ARTICLE 两种类型）
- **User** - 用户表
- **Tag** - 标签表（多对多关联）

## 开发命令

### 前端
```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览构建结果
npm run lint       # 代码检查
npm run typecheck  # 类型检查
```

### 后端
```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run start      # 启动生产服务器
npm run db:generate # 生成 Prisma Client
npm run db:migrate # 运行数据库迁移
npm run db:studio  # 打开 Prisma Studio
```

## 许可证

MIT
