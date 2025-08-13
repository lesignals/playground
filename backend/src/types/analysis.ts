// 支持的编程语言
export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  GO = 'go',
  C = 'c',
  CPP = 'cpp',
  RUST = 'rust',
  PHP = 'php',
  RUBY = 'ruby'
}

// Semgrep规则结构
export interface SemgrepRule {
  id: string;
  message: string;
  languages: SupportedLanguage[];
  severity: 'ERROR' | 'WARNING' | 'INFO';
  pattern?: string;
  patterns?: Array<{
    pattern?: string;
    'pattern-not'?: string;
    'pattern-either'?: string[];
    'pattern-inside'?: string;
  }>;
  metadata?: {
    category?: string;
    subcategory?: string[];
    confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
    impact?: 'LOW' | 'MEDIUM' | 'HIGH';
    likelihood?: 'LOW' | 'MEDIUM' | 'HIGH';
    technology?: string[];
  };
}

// 代码分析请求
export interface AnalysisRequest {
  code: string;
  language: SupportedLanguage;
  rules: SemgrepRule[] | string; // 自定义规则或预设规则ID
  options?: {
    timeout?: number;
    maxMemory?: string;
    verbose?: boolean;
  };
}

// Semgrep输出结果
export interface SemgrepMatch {
  check_id: string;
  path: string;
  start: {
    line: number;
    col: number;
  };
  end: {
    line: number;
    col: number;
  };
  extra: {
    message: string;
    metavars: Record<string, any>;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    metadata: Record<string, any>;
    lines: string;
  };
}

export interface SemgrepResult {
  results: SemgrepMatch[];
  errors: Array<{
    code: number;
    level: string;
    message: string;
    path?: string;
    spans?: Array<{ start: number; end: number }>;
  }>;
  stats: {
    rules: number;
    files: number;
    matches: number;
  };
}

// API响应格式
export interface AnalysisResponse {
  success: boolean;
  data?: {
    results: SemgrepMatch[];
    stats: {
      rulesCount: number;
      matchesCount: number;
      errorsCount: number;
      executionTime: number;
    };
    errors?: string[];
  };
  error?: {
    message: string;
    code: string;
  };
}