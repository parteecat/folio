import { Hono } from 'hono'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import { jwtAuth } from '../middleware/jwtAuth.js'
import type { UploadResponse } from '../types.js'

const upload = new Hono()

/**
 * 上传配置
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/**
 * 确保上传目录存在
 */
const ensureUploadDir = async () => {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch {
    // 目录已存在或创建失败
  }
}

/**
 * 生成唯一文件名
 */
const generateFilename = (originalName: string): string => {
  const ext = originalName.split('.').pop() || 'jpg'
  const uuid = randomUUID().replace(/-/g, '')
  const timestamp = Date.now()
  return `${timestamp}-${uuid}.${ext}`
}

/**
 * 验证文件类型
 */
const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` 
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    }
  }

  return { valid: true }
}

/**
 * POST /api/upload
 * 图片上传接口
 * 需要JWT认证
 * 
 * 流程：
 * 1. 验证JWT
 * 2. 验证文件类型和大小
 * 3. 生成唯一文件名
 * 4. 保存到文件系统
 * 5. 返回可访问的URL
 */
upload.post('/', jwtAuth, async (c) => {
  await ensureUploadDir()

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  // 验证文件
  const validation = validateFile(file)
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400)
  }

  try {
    // 生成唯一文件名
    const filename = generateFilename(file.name)
    const filepath = join(UPLOAD_DIR, filename)

    // 读取文件内容并保存
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filepath, buffer)

    // 返回文件URL
    const url = `/uploads/${filename}`

    return c.json({
      url,
      filename,
      size: file.size,
    } as UploadResponse)
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Failed to save file' }, 500)
  }
})

/**
 * POST /api/upload/multiple
 * 多文件上传
 */
upload.post('/multiple', jwtAuth, async (c) => {
  await ensureUploadDir()

  const formData = await c.req.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) {
    return c.json({ error: 'No files provided' }, 400)
  }

  const results: UploadResponse[] = []
  const errors: { filename: string; error: string }[] = []

  for (const file of files) {
    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      errors.push({ filename: file.name, error: validation.error! })
      continue
    }

    try {
      const filename = generateFilename(file.name)
      const filepath = join(UPLOAD_DIR, filename)

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await writeFile(filepath, buffer)

      results.push({
        url: `/uploads/${filename}`,
        filename,
        size: file.size,
      })
    } catch {
      errors.push({ filename: file.name, error: 'Failed to save file' })
    }
  }

  return c.json({
    success: results,
    errors: errors.length > 0 ? errors : undefined,
  })
})

export default upload
