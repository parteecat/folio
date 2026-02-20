import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * 数据库种子脚本
 * 创建初始管理员账号
 */
async function main() {
  console.log('开始创建初始管理员账号...')

  // 检查是否已有管理员
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (existingAdmin) {
    console.log('管理员账号已存在:')
    console.log(`- 邮箱: ${existingAdmin.email}`)
    console.log(`- 名称: ${existingAdmin.name}`)
    return
  }

  // 创建默认管理员
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@folio.com',
      password: hashedPassword,
      name: '管理员',
      role: 'ADMIN'
    }
  })

  console.log('✅ 管理员账号创建成功!')
  console.log('')
  console.log('登录信息:')
  console.log(`- 邮箱: admin@folio.com`)
  console.log(`- 密码: admin123`)
  console.log('')
  console.log('⚠️  生产环境请务必修改默认密码!')
}

main()
  .catch((e) => {
    console.error('创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
