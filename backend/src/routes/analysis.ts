import { Router, Request, Response } from 'express';
import { SemgrepService } from '../services/semgrepService';
import { AnalysisRequest, AnalysisResponse } from '../types/analysis';
import { ValidationError, SemgrepError } from '../types/errors';

const router = Router();

/**
 * 代码分析接口
 * POST /api/analysis/scan
 */
router.post('/scan', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const request: AnalysisRequest = req.body;
    
    // 执行分析
    const semgrepResult = await SemgrepService.analyzeCode(request);
    
    const executionTime = Date.now() - startTime;
    
    // 构建响应
    const response: AnalysisResponse = {
      success: true,
      data: {
        results: semgrepResult.results,
        stats: {
          rulesCount: semgrepResult.stats.rules,
          matchesCount: semgrepResult.results.length,
          errorsCount: semgrepResult.errors.length,
          executionTime
        },
        ...(semgrepResult.errors.length > 0 
          ? { errors: semgrepResult.errors.map(e => e.message) }
          : {})
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Analysis error:', error);
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = '分析失败';

    if (error instanceof ValidationError) {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = error.message;
    } else if (error instanceof SemgrepError) {
      statusCode = 500;
      errorCode = 'SEMGREP_ERROR';
      message = error.message;
    }

    const response: AnalysisResponse = {
      success: false,
      error: {
        message,
        code: errorCode
      }
    };

    res.status(statusCode).json(response);
  }
});

/**
 * 获取支持的语言列表
 * GET /api/analysis/languages
 */
router.get('/languages', (req: Request, res: Response) => {
  const languages = [
    { id: 'javascript', name: 'JavaScript', extension: '.js' },
    { id: 'typescript', name: 'TypeScript', extension: '.ts' },
    { id: 'python', name: 'Python', extension: '.py' },
    { id: 'java', name: 'Java', extension: '.java' },
    { id: 'go', name: 'Go', extension: '.go' },
    { id: 'c', name: 'C', extension: '.c' },
    { id: 'cpp', name: 'C++', extension: '.cpp' },
    { id: 'rust', name: 'Rust', extension: '.rs' },
    { id: 'php', name: 'PHP', extension: '.php' },
    { id: 'ruby', name: 'Ruby', extension: '.rb' }
  ];

  res.json({
    success: true,
    data: { languages }
  });
});

/**
 * 获取预设规则集列表
 * GET /api/analysis/presets
 */
router.get('/presets', (req: Request, res: Response) => {
  const presets = [
    {
      id: 'security',
      name: '安全审计',
      description: '通用安全漏洞检测',
      category: 'security'
    },
    {
      id: 'owasp-top-10',
      name: 'OWASP Top 10',
      description: 'OWASP十大安全风险',
      category: 'security'
    },
    {
      id: 'command-injection',
      name: '命令注入',
      description: '检测命令注入漏洞',
      category: 'injection'
    },
    {
      id: 'sql-injection',
      name: 'SQL注入',
      description: '检测SQL注入漏洞',
      category: 'injection'
    },
    {
      id: 'xss',
      name: '跨站脚本',
      description: '检测XSS漏洞',
      category: 'web'
    },
    {
      id: 'secrets',
      name: '敏感信息泄露',
      description: '检测API密钥、密码等敏感信息',
      category: 'secrets'
    }
  ];

  res.json({
    success: true,
    data: { presets }
  });
});

export default router;