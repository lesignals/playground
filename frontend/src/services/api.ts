import axios from 'axios';
import type { 
  AnalysisRequest, 
  AnalysisResponse, 
  ApiResponse, 
  Language, 
  RulePreset, 
  RuleTemplate,
  SemgrepRule 
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API响应: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API响应错误:', error.response?.data || error.message);
    
    // 统一错误处理
    if (error.response?.status === 429) {
      throw new Error('请求过于频繁，请稍后再试');
    } else if (error.response?.status >= 500) {
      throw new Error('服务器内部错误，请稍后再试');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请检查网络连接');
    }
    
    throw error;
  }
);

// 健康检查API
export const healthApi = {
  // 基础健康检查
  check: async (): Promise<any> => {
    const response = await api.get<ApiResponse>('/health');
    return response.data;
  },
  
  // Semgrep健康检查
  checkSemgrep: async (): Promise<any> => {
    const response = await api.get<ApiResponse>('/health/semgrep');
    return response.data;
  }
};

// 分析API
export const analysisApi = {
  // 执行代码分析
  analyze: async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    const response = await api.post<ApiResponse<AnalysisResponse>>('/analysis/scan', request);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || '分析失败');
    }
    
    return response.data.data!;
  },
  
  // 获取支持的语言
  getLanguages: async (): Promise<Language[]> => {
    const response = await api.get<ApiResponse<{ languages: Language[] }>>('/analysis/languages');
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || '获取语言列表失败');
    }
    
    return response.data.data!.languages;
  },
  
  // 获取预设规则
  getPresets: async (): Promise<RulePreset[]> => {
    const response = await api.get<ApiResponse<{ presets: RulePreset[] }>>('/analysis/presets');
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || '获取预设规则失败');
    }
    
    return response.data.data!.presets;
  }
};

// 规则API
export const rulesApi = {
  // 获取示例规则
  getExamples: async (): Promise<SemgrepRule[]> => {
    const response = await api.get<ApiResponse<{ rules: SemgrepRule[] }>>('/rules/examples');
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || '获取示例规则失败');
    }
    
    return response.data.data!.rules;
  },
  
  // 验证规则
  validate: async (rules: SemgrepRule[]): Promise<{ message: string; rulesCount: number }> => {
    const response = await api.post<ApiResponse<{ message: string; rulesCount: number }>>('/rules/validate', { rules });
    
    if (!response.data.success) {
      const error = response.data.error;
      if (error?.details) {
        throw new Error(`规则验证失败:\n${error.details.join('\n')}`);
      }
      throw new Error(error?.message || '规则验证失败');
    }
    
    return response.data.data!;
  },
  
  // 获取规则模板
  getTemplates: async (): Promise<RuleTemplate[]> => {
    const response = await api.get<ApiResponse<{ templates: RuleTemplate[] }>>('/rules/templates');
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || '获取规则模板失败');
    }
    
    return response.data.data!.templates;
  }
};

export default api;