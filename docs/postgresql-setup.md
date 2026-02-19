# PostgreSQL 18 本地安装指南

## 下载安装

### Windows
1. 访问官方下载页面：https://www.postgresql.org/download/windows/
2. 下载 PostgreSQL 18 安装程序
3. 运行安装向导，建议：
   - 安装目录：`C:\Program Files\PostgreSQL\18`
   - 数据目录：`C:\Program Files\PostgreSQL\18\data`
   - 设置超级用户密码（记住这个密码）
   - 端口：5432（默认）
   - 语言：C 或 Chinese (Simplified)_China.936

### macOS
```bash
# 使用 Homebrew
brew install postgresql@18

# 启动服务
brew services start postgresql@18
```

### Linux (Ubuntu/Debian)
```bash
# 添加官方仓库
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update

# 安装 PostgreSQL 18
sudo apt-get install postgresql-18

# 启动服务
sudo systemctl start postgresql
```

## 创建数据库和用户

### 使用 psql 命令行

```bash
# 切换到 postgres 用户（Linux/macOS）
sudo -u postgres psql

# 或者在 Windows 中使用 SQL Shell (psql)
# 开始菜单 -> PostgreSQL 18 -> SQL Shell (psql)
```

### 执行 SQL 命令

```sql
-- 创建数据库
CREATE DATABASE folio;

-- 创建用户（如果不使用默认的 postgres 用户）
CREATE USER folio_user WITH PASSWORD 'your_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE folio TO folio_user;

-- 查看数据库列表
\l

-- 退出
\q
```

## 配置项目环境变量

编辑 `server/.env` 文件：

```env
# 如果使用默认的 postgres 用户
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/folio?schema=public"

# 如果使用自定义用户
DATABASE_URL="postgresql://folio_user:your_password@localhost:5432/folio?schema=public"
```

## 运行 Prisma 迁移

```bash
cd server

# 生成 Prisma 客户端
npx prisma generate

# 运行迁移
npx prisma migrate dev --name init

# （可选）查看数据库内容
npx prisma studio
```

## 常见问题

### 1. 端口被占用
```bash
# 查找占用 5432 端口的进程
netstat -ano | findstr :5432

# 结束进程（Windows）
taskkill /PID <进程ID> /F
```

### 2. 连接被拒绝
- 检查 PostgreSQL 服务是否运行：`services.msc` 查看 PostgreSQL 服务状态
- 检查防火墙设置
- 确认 `pg_hba.conf` 允许本地连接

### 3. 密码错误
- 确认使用的是安装时设置的密码
- 如果忘记密码，需要重置 `postgres` 用户密码

## 下一步

数据库配置完成后，继续：
1. 启动后端开发服务器：`npm run dev`
2. 启动前端开发服务器：`cd ../client && npm run dev`
