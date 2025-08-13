import { Router, Request, Response } from 'express';
import { SemgrepRule, SupportedLanguage } from '../types/analysis';

const router = Router();

/**
 * 获取示例规则
 * GET /api/rules/examples
 */
router.get('/examples', (req: Request, res: Response) => {
  const exampleRules: SemgrepRule[] = [
    {
      id: 'command-injection-shell-call',
      message: 'A call to clojure.java.shell has been found, this could lead to an RCE if the inputs are user-controllable. Please ensure their origin is validated and sanitized.',
      languages: [SupportedLanguage.JAVA],
      severity: 'ERROR',
      pattern: '(clojure.java.shell ... $SH)',
      metadata: {
        category: 'security',
        subcategory: ['audit', 'command-injection'],
        confidence: 'HIGH',
        impact: 'HIGH',
        likelihood: 'MEDIUM',
        technology: ['clojure']
      }
    },
    {
      id: 'sql-injection-format-string',
      message: 'SQL query使用字符串格式化可能导致SQL注入漏洞',
      languages: [SupportedLanguage.PYTHON],
      severity: 'ERROR',
      pattern: '$CURSOR.execute("..." % ...)',
      metadata: {
        category: 'security',
        subcategory: ['sql-injection'],
        confidence: 'HIGH',
        impact: 'HIGH'
      }
    },
    {
      id: 'hardcoded-secret',
      message: '硬编码的API密钥或密码，应该使用环境变量',
      languages: [SupportedLanguage.JAVASCRIPT, SupportedLanguage.TYPESCRIPT],
      severity: 'WARNING',
      patterns: [
        {
          'pattern-either': [
            'const $VAR = "sk-..."',
            'const $VAR = "pk-..."',
            'const password = "..."'
          ]
        }
      ],
      metadata: {
        category: 'security',
        subcategory: ['secrets'],
        confidence: 'MEDIUM'
      }
    },
    {
      id: 'eval-usage',
      message: '使用eval()函数存在代码注入风险',
      languages: [SupportedLanguage.JAVASCRIPT, SupportedLanguage.TYPESCRIPT],
      severity: 'ERROR',
      pattern: 'eval(...)',
      metadata: {
        category: 'security',
        subcategory: ['code-injection'],
        confidence: 'HIGH',
        impact: 'HIGH'
      }
    },
    {
      id: 'unsafe-regex',
      message: '正则表达式可能存在ReDoS攻击风险',
      languages: [SupportedLanguage.JAVASCRIPT, SupportedLanguage.TYPESCRIPT],
      severity: 'WARNING',
      pattern: 'new RegExp($PATTERN)',
      metadata: {
        category: 'security',
        subcategory: ['regex'],
        confidence: 'MEDIUM'
      }
    }
  ];

  res.json({
    success: true,
    data: { rules: exampleRules }
  });
});

/**
 * 验证规则语法
 * POST /api/rules/validate
 */
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { rules } = req.body;
    
    if (!Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '规则必须是数组格式',
          code: 'INVALID_FORMAT'
        }
      });
    }

    const validationErrors: string[] = [];

    for (const rule of rules) {
      // 必填字段验证
      if (!rule.id) {
        validationErrors.push('规则ID不能为空');
      }
      
      if (!rule.message) {
        validationErrors.push(`规则 ${rule.id || 'unknown'}: message不能为空`);
      }
      
      if (!rule.languages || !Array.isArray(rule.languages) || rule.languages.length === 0) {
        validationErrors.push(`规则 ${rule.id || 'unknown'}: 至少需要指定一种编程语言`);
      }
      
      if (!rule.severity || !['ERROR', 'WARNING', 'INFO'].includes(rule.severity)) {
        validationErrors.push(`规则 ${rule.id || 'unknown'}: severity必须是ERROR、WARNING或INFO`);
      }
      
      if (!rule.pattern && !rule.patterns) {
        validationErrors.push(`规则 ${rule.id || 'unknown'}: 至少需要指定pattern或patterns`);
      }

      // 语言验证
      if (rule.languages) {
        for (const lang of rule.languages) {
          if (!Object.values(SupportedLanguage).includes(lang)) {
            validationErrors.push(`规则 ${rule.id || 'unknown'}: 不支持的语言 ${lang}`);
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: '规则验证失败',
          code: 'VALIDATION_ERROR',
          details: validationErrors
        }
      });
    }

    res.json({
      success: true,
      data: {
        message: '规则验证通过',
        rulesCount: rules.length
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: '规则格式错误: ' + error.message,
        code: 'PARSE_ERROR'
      }
    });
  }
});

/**
 * 获取规则模板
 * GET /api/rules/templates
 */
router.get('/templates', (req: Request, res: Response) => {
  const templates = [
    {
      id: 'basic-pattern',
      name: '基础模式匹配',
      description: '简单的模式匹配规则',
      template: {
        id: 'my-rule-id',
        message: '请描述这个安全问题',
        languages: ['javascript'],
        severity: 'ERROR',
        pattern: '// 在这里写匹配模式，例如: eval($INPUT)'
      }
    },
    {
      id: 'multiple-patterns',
      name: '多模式匹配',
      description: '使用多个条件的复杂规则',
      template: {
        id: 'my-complex-rule',
        message: '请描述这个安全问题',
        languages: ['javascript'],
        severity: 'WARNING',
        patterns: [
          {
            pattern: '// 主要匹配模式'
          },
          {
            'pattern-not': '// 排除的模式'
          }
        ]
      }
    },
    {
      id: 'with-metadata',
      name: '带元数据的规则',
      description: '包含详细分类信息的规则',
      template: {
        id: 'my-categorized-rule',
        message: '请描述这个安全问题',
        languages: ['javascript'],
        severity: 'ERROR',
        pattern: '// 匹配模式',
        metadata: {
          category: 'security',
          subcategory: ['injection'],
          confidence: 'HIGH',
          impact: 'HIGH',
          technology: ['nodejs']
        }
      }
    }
  ];

  res.json({
    success: true,
    data: { templates }
  });
});

export default router;