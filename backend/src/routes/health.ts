import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // 模拟Semgrep版本信息（演示模式）
    const semgrepVersion = 'Mock v1.45.0 (Demo Mode)';

    // 系统信息
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      semgrep: semgrepVersion,
      mode: 'simulation',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: '健康检查失败',
        code: 'HEALTH_CHECK_FAILED'
      }
    });
  }
});

// Semgrep专用健康检查 (模拟模式)
router.get('/semgrep', async (req: Request, res: Response) => {
  try {
    // 模拟Semgrep功能和版本信息
    res.json({
      success: true,
      data: {
        version: 'Mock v1.45.0 (Demo Mode)',
        available: true,
        mode: 'simulation',
        features: ['config', 'rules', 'json', 'yaml', 'auto-fix'],
        supportedLanguages: [
          'javascript', 'typescript', 'python', 'java', 'go', 
          'c', 'cpp', 'rust', 'php', 'ruby', 'bash', 'yaml'
        ]
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: '健康检查失败',
        code: 'HEALTH_CHECK_FAILED',
        details: error.message
      }
    });
  }
});

export default router;