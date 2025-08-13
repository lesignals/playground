import { Request, Response, NextFunction } from 'express';

// 简单的内存速率限制器
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15分钟
  const maxRequests = 100; // 每15分钟最多100个请求

  const client = requestCounts.get(clientIP);

  if (!client) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (now > client.resetTime) {
    // 重置窗口
    requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (client.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: {
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }

  client.count++;
  next();

  // 清理过期记录
  if (Math.random() < 0.01) { // 1%概率清理
    for (const [ip, data] of requestCounts.entries()) {
      if (now > data.resetTime) {
        requestCounts.delete(ip);
      }
    }
  }
};