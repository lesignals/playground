import React, { useState, useEffect, useCallback } from 'react';
import { Layout, message, Spin } from 'antd';
import Split from 'react-split';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import ResultsPanel from './components/ResultsPanel';
import { analysisApi, healthApi } from './services/api';
import { SupportedLanguage, SemgrepMatch, AnalysisResponse, SemgrepRule } from './types';

const { Content } = Layout;

// 默认代码示例
const DEFAULT_CODE = {
  [SupportedLanguage.JAVASCRIPT]: `// JavaScript 示例代码
const userInput = process.argv[2];
eval(userInput); // 危险：使用eval执行用户输入

const password = "hardcoded-secret-123"; // 危险：硬编码密码

function unsafeQuery(id) {
  const query = "SELECT * FROM users WHERE id = " + id; // 危险：SQL注入
  return query;
}`,
  
  [SupportedLanguage.PYTHON]: `# Python 示例代码
import os
import subprocess

def execute_command(user_input):
    # 危险：命令注入
    os.system(f"ls {user_input}")
    
def unsafe_query(user_id):
    # 危险：SQL注入
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return query

# 危险：硬编码API密钥
API_KEY = "sk-1234567890abcdef"`,
  
  [SupportedLanguage.JAVA]: `// Java 示例代码
import java.sql.*;

public class Example {
    private static final String PASSWORD = "admin123"; // 危险：硬编码密码
    
    public void unsafeQuery(String userId) throws SQLException {
        String query = "SELECT * FROM users WHERE id = " + userId; // 危险：SQL注入
        // 执行查询...
    }
    
    public void executeCommand(String input) {
        try {
            Runtime.getRuntime().exec("ls " + input); // 危险：命令注入
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`
};

const App: React.FC = () => {
  // 状态管理
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE[SupportedLanguage.JAVASCRIPT]);
  const [language, setLanguage] = useState<SupportedLanguage>(SupportedLanguage.JAVASCRIPT);
  const [rules, setRules] = useState<SemgrepRule[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<SemgrepMatch[]>([]);
  const [analysisStats, setAnalysisStats] = useState<AnalysisResponse['stats'] | null>(null);
  const [analysisErrors, setAnalysisErrors] = useState<string[]>([]);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  // 健康检查
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthApi.check();
        await healthApi.checkSemgrep();
        setIsHealthy(true);
      } catch (error) {
        console.error('健康检查失败:', error);
        setIsHealthy(false);
        message.error('后端服务不可用，请检查服务状态');
      }
    };

    checkHealth();
  }, []);

  // 语言切换时更新代码
  useEffect(() => {
    if (DEFAULT_CODE[language]) {
      setCode(DEFAULT_CODE[language]);
    }
  }, [language]);

  // 执行分析
  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      message.warning('请先输入代码');
      return;
    }

    if (rules.length === 0) {
      message.warning('请先选择或定义分析规则');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults([]);
    setAnalysisErrors([]);

    try {
      const result = await analysisApi.analyze({
        code,
        language,
        rules,
        options: {
          timeout: 30000,
          verbose: false
        }
      });

      setAnalysisResults(result.results);
      setAnalysisStats(result.stats);
      setAnalysisErrors(result.errors || []);

      message.success(
        `分析完成：发现 ${result.results.length} 个问题，` +
        `耗时 ${result.stats.executionTime}ms`
      );
    } catch (error: any) {
      console.error('分析失败:', error);
      message.error(error.message || '分析失败');
      setAnalysisResults([]);
      setAnalysisStats(null);
      setAnalysisErrors([error.message || '未知错误']);
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language, rules]);

  // 加载状态
  if (isHealthy === null) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div>正在检查服务状态...</div>
      </div>
    );
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Header 
        onAnalyze={handleAnalyze} 
        isAnalyzing={isAnalyzing}
        isHealthy={isHealthy}
        analysisStats={analysisStats}
      />
      
      <Layout hasSider>
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          language={language}
          onLanguageChange={setLanguage}
          rules={rules}
          onRulesChange={setRules}
        />
        
        <Content style={{ 
          marginLeft: sidebarCollapsed ? 80 : 300,
          transition: 'margin-left 0.2s',
          padding: '16px',
          overflow: 'hidden'
        }}>
          <Split
            direction="vertical"
            sizes={[60, 40]}
            minSize={200}
            className="split-container"
            style={{ height: '100%' }}
          >
            <div style={{ height: '100%' }}>
              <CodeEditor
                value={code}
                language={language}
                onChange={setCode}
                results={analysisResults}
              />
            </div>
            
            <div style={{ height: '100%' }}>
              <ResultsPanel
                results={analysisResults}
                stats={analysisStats}
                errors={analysisErrors}
                isAnalyzing={isAnalyzing}
                onResultClick={(result) => {
                  // TODO: 跳转到代码位置
                  console.log('点击结果:', result);
                }}
              />
            </div>
          </Split>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;