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

// 语言信息
export interface Language {
  id: SupportedLanguage;
  name: string;
  extension: string;
  monacoLanguage?: string;
}

// Semgrep规则
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

// 分析请求
export interface AnalysisRequest {
  code: string;
  language: SupportedLanguage;
  rules: SemgrepRule[] | string;
  options?: {
    timeout?: number;
    maxMemory?: string;
    verbose?: boolean;
  };
}

// 分析结果
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

// API响应
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: string[];
  };
}

// 分析响应
export interface AnalysisResponse {
  results: SemgrepMatch[];
  stats: {
    rulesCount: number;
    matchesCount: number;
    errorsCount: number;
    executionTime: number;
  };
  errors?: string[];
}

// 预设规则
export interface RulePreset {
  id: string;
  name: string;
  description: string;
  category: string;
}

// 规则模板
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  template: Partial<SemgrepRule>;
}

// 应用状态
export interface AppState {
  // 编辑器状态
  code: string;
  language: SupportedLanguage;
  rules: SemgrepRule[];
  
  // 分析状态
  isAnalyzing: boolean;
  analysisResults: SemgrepMatch[];
  analysisStats: AnalysisResponse['stats'] | null;
  analysisErrors: string[];
  
  // UI状态
  sidebarCollapsed: boolean;
  activeTab: 'rules' | 'results' | 'settings';
  
  // 配置
  autoAnalyze: boolean;
  theme: 'light' | 'dark';
}