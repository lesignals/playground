import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

import { 
  AnalysisRequest, 
  SemgrepResult, 
  SemgrepRule,
  SupportedLanguage 
} from '../types/analysis';
import { SemgrepError, ValidationError } from '../types/errors';

const execAsync = promisify(exec);

export class SemgrepService {
  private static readonly TIMEOUT = 30000; // 30秒超时
  private static readonly MAX_MEMORY = '512m';

  // 语言文件扩展名映射
  private static readonly LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
    [SupportedLanguage.JAVASCRIPT]: '.js',
    [SupportedLanguage.TYPESCRIPT]: '.ts',
    [SupportedLanguage.PYTHON]: '.py',
    [SupportedLanguage.JAVA]: '.java',
    [SupportedLanguage.GO]: '.go',
    [SupportedLanguage.C]: '.c',
    [SupportedLanguage.CPP]: '.cpp',
    [SupportedLanguage.RUST]: '.rs',
    [SupportedLanguage.PHP]: '.php',
    [SupportedLanguage.RUBY]: '.rb'
  };

  /**
   * 执行代码分析 (简化版 - 返回模拟结果)
   */
  static async analyzeCode(request: AnalysisRequest): Promise<SemgrepResult> {
    // 简化版：直接返回模拟结果，不调用真实的Semgrep
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟分析时间
    
    return {
      results: [
        {
          check_id: 'demo-rule',
          path: 'temp.js',
          start: { line: 1, col: 0 },
          end: { line: 1, col: 10 },
          extra: {
            message: '这是一个演示结果 - Semgrep Playground运行正常！',
            metavars: {},
            severity: 'INFO' as const,
            metadata: { demo: true },
            lines: request.code.split('\n')[0] || ''
          }
        }
      ],
      errors: [],
      stats: {
        rules: request.rules.length,
        files: 1,
        matches: 1
      }
    };
  }

  /**
   * 验证分析请求
   */
  private static validateRequest(request: AnalysisRequest): void {
    if (!request.code || request.code.trim().length === 0) {
      throw new ValidationError('代码内容不能为空');
    }

    if (request.code.length > 100000) { // 100KB限制
      throw new ValidationError('代码内容过大，请限制在100KB以内');
    }

    if (!Object.values(SupportedLanguage).includes(request.language)) {
      throw new ValidationError(`不支持的编程语言: ${request.language}`);
    }

    if (Array.isArray(request.rules) && request.rules.length === 0) {
      throw new ValidationError('至少需要一个分析规则');
    }
  }

  /**
   * 创建工作目录
   */
  private static async createWorkDirectory(): Promise<string> {
    const workDir = join(tmpdir(), 'semgrep-playground', uuidv4());
    await mkdir(workDir, { recursive: true });
    return workDir;
  }

  /**
   * 写入代码文件
   */
  private static async writeCodeFile(
    workDir: string, 
    code: string, 
    language: SupportedLanguage
  ): Promise<string> {
    const extension = this.LANGUAGE_EXTENSIONS[language];
    const filename = `code${extension}`;
    const filepath = join(workDir, filename);
    
    await writeFile(filepath, code, 'utf8');
    return filepath;
  }

  /**
   * 写入规则文件
   */
  private static async writeRulesFile(
    workDir: string, 
    rules: SemgrepRule[] | string
  ): Promise<string> {
    const rulesPath = join(workDir, 'rules.yml');
    
    if (typeof rules === 'string') {
      // 使用预设规则
      const presetRules = await this.getPresetRules(rules);
      await writeFile(rulesPath, presetRules, 'utf8');
    } else {
      // 使用自定义规则
      const yamlRules = this.convertRulesToYAML(rules);
      await writeFile(rulesPath, yamlRules, 'utf8');
    }
    
    return rulesPath;
  }

  /**
   * 执行Semgrep命令
   */
  private static async executeSemgrep(
    codeFile: string,
    rulesFile: string,
    options?: AnalysisRequest['options']
  ): Promise<SemgrepResult> {
    const timeout = options?.timeout || this.TIMEOUT;
    
    const command = [
      'semgrep',
      '--config', rulesFile,
      '--json',
      '--no-git-ignore',
      '--disable-version-check',
      codeFile
    ].join(' ');

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB缓冲区
        env: {
          ...process.env,
          SEMGREP_SEND_METRICS: 'off' // 禁用遥测
        }
      });

      if (stderr && !stderr.includes('INFO')) {
        console.warn('Semgrep stderr:', stderr);
      }

      return JSON.parse(stdout) as SemgrepResult;
    } catch (error: any) {
      if (error.killed && error.signal === 'SIGTERM') {
        throw new SemgrepError('分析超时，请减少代码量或简化规则');
      }
      
      if (error.code === 'ENOENT') {
        throw new SemgrepError('Semgrep未安装，请先安装Semgrep');
      }

      // 尝试解析JSON错误输出
      try {
        const errorOutput = JSON.parse(error.stdout || error.stderr || '{}');
        throw new SemgrepError(`Semgrep分析失败: ${errorOutput.message || error.message}`);
      } catch {
        throw new SemgrepError(`Semgrep分析失败: ${error.message}`);
      }
    }
  }

  /**
   * 获取预设规则
   */
  private static async getPresetRules(rulesetId: string): Promise<string> {
    // 常见的预设规则集
    const presetRulesets: Record<string, string> = {
      'security': 'p/security-audit',
      'owasp-top-10': 'p/owasp-top-10',
      'command-injection': 'p/command-injection',
      'sql-injection': 'p/sql-injection',
      'xss': 'p/xss',
      'secrets': 'p/secrets'
    };

    const ruleset = presetRulesets[rulesetId];
    if (!ruleset) {
      throw new ValidationError(`未知的预设规则集: ${rulesetId}`);
    }

    // 返回对应的Semgrep规则配置
    return `rules:\n  - id: ${rulesetId}\n    pattern-sources: [${ruleset}]`;
  }

  /**
   * 将规则对象转换为YAML格式
   */
  private static convertRulesToYAML(rules: SemgrepRule[]): string {
    const yamlContent = ['rules:'];
    
    for (const rule of rules) {
      yamlContent.push('  - id: ' + rule.id);
      yamlContent.push('    message: ' + JSON.stringify(rule.message));
      yamlContent.push('    languages: [' + rule.languages.join(', ') + ']');
      yamlContent.push('    severity: ' + rule.severity);
      
      if (rule.pattern) {
        yamlContent.push('    pattern: ' + JSON.stringify(rule.pattern));
      }
      
      if (rule.patterns) {
        yamlContent.push('    patterns:');
        for (const pattern of rule.patterns) {
          yamlContent.push('      - pattern: ' + JSON.stringify(pattern.pattern || ''));
        }
      }
      
      if (rule.metadata) {
        yamlContent.push('    metadata:');
        for (const [key, value] of Object.entries(rule.metadata)) {
          yamlContent.push(`      ${key}: ${JSON.stringify(value)}`);
        }
      }
      
      yamlContent.push(''); // 空行分隔规则
    }
    
    return yamlContent.join('\n');
  }

  /**
   * 清理工作目录
   */
  private static async cleanupWorkDirectory(workDir: string): Promise<void> {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('清理临时目录失败:', error);
    }
  }
}