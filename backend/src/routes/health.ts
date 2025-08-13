import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // 检查Semgrep是否可用
    let semgrepVersion = 'Not installed';
    try {
      const version = execSync('semgrep --version', { 
        encoding: 'utf8', 
        timeout: 5000,
        stdio: 'pipe'
      });
      semgrepVersion = version.trim();
    } catch (error) {
      console.warn('Semgrep not found:', error);
    }

    // 系统信息
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      semgrep: semgrepVersion,
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

// Semgrep专用健康检查
router.get('/semgrep', async (req: Request, res: Response) => {
  try {
    const version = execSync('semgrep --version', { 
      encoding: 'utf8', 
      timeout: 10000,
      stdio: 'pipe'
    });

    const help = execSync('semgrep --help', { 
      encoding: 'utf8', 
      timeout: 5000,
      stdio: 'pipe'
    });

    res.json({
      success: true,
      data: {
        version: version.trim(),
        available: true,
        features: help.includes('--config') ? ['config', 'rules', 'json'] : []
      }
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Semgrep不可用',
        code: 'SEMGREP_UNAVAILABLE',
        details: error.message
      }
    });
  }
});

export default router;