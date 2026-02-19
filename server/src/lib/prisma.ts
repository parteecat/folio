import { PrismaClient } from '@prisma/client'

// Prisma客户端单例模式
// 防止开发环境下热重载创建多个实例

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
