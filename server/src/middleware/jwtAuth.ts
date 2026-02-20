import type { MiddlewareHandler } from 'hono'
import jwt from 'jsonwebtoken'
import type { JWTPayload } from '../types'

const { verify } = jwt

/**
 * JWT认证中间件
 * 验证请求头中的Bearer Token
 * 
 * 流程：
 * 1. 从Authorization头提取token
 * 2. 使用JWT_SECRET验证token
 * 3. 将解码后的用户信息附加到context
 * 4. 验证失败返回401
 */
export const jwtAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401)
  }

  const token = authHeader.substring(7)
  
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    // 验证token
    const decoded = verify(token, secret) as JWTPayload
    
    // 将用户信息附加到context
    c.set('user', decoded)
    
    await next()
  } catch (error) {
    // Token验证失败（过期或无效）
    return c.json({ 
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    }, 401)
  }
}

/**
 * 可选JWT认证中间件
 * 验证token但不强制要求，用于需要识别用户但允许匿名访问的接口
 */
export const optionalJwtAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    try {
      const secret = process.env.JWT_SECRET
      if (secret) {
        const decoded = verify(token, secret) as JWTPayload
        c.set('user', decoded)
      }
    } catch {
      // 可选认证，验证失败不阻断请求
    }
  }
  
  await next()
}
