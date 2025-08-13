import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'body-parser';

import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import analysisRoutes from './routes/analysis';
import rulesRoutes from './routes/rules';
import healthRoutes from './routes/health';

const app = express();
const PORT = process.env.PORT || 3001;

// 基础中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
app.use(rateLimiter);

// 健康检查
app.use('/api/health', healthRoutes);

// 业务路由
app.use('/api/analysis', analysisRoutes);
app.use('/api/rules', rulesRoutes);

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Semgrep Playground Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Analysis API: http://localhost:${PORT}/api/analysis`);
});

export default app;