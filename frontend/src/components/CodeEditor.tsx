import React, { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Card, Typography, Tag, Space } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import type { SupportedLanguage, SemgrepMatch } from '../types';

const { Title } = Typography;

interface CodeEditorProps {
  value: string;
  language: SupportedLanguage;
  onChange: (value: string) => void;
  results: SemgrepMatch[];
}

// 语言映射
const LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  [SupportedLanguage.JAVASCRIPT]: 'javascript',
  [SupportedLanguage.TYPESCRIPT]: 'typescript',
  [SupportedLanguage.PYTHON]: 'python',
  [SupportedLanguage.JAVA]: 'java',
  [SupportedLanguage.GO]: 'go',
  [SupportedLanguage.C]: 'c',
  [SupportedLanguage.CPP]: 'cpp',
  [SupportedLanguage.RUST]: 'rust',
  [SupportedLanguage.PHP]: 'php',
  [SupportedLanguage.RUBY]: 'ruby'
};

// 严重级别颜色映射
const SEVERITY_COLORS = {
  ERROR: '#ff4d4f',
  WARNING: '#faad14',
  INFO: '#1890ff'
};

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  language, 
  onChange, 
  results 
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

  // 编辑器初始化完成
  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 设置编辑器选项
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      showFoldingControls: 'always',
    });

    // 自定义主题
    monaco.editor.defineTheme('semgrep-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292f',
        'editorLineNumber.foreground': '#656d76',
        'editorLineNumber.activeForeground': '#24292f',
      }
    });

    monaco.editor.setTheme('semgrep-light');
  };

  // 更新编辑器标记（高亮问题位置）
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // 清除现有标记
    monaco.editor.removeAllMarkers('semgrep');

    // 添加新标记
    const markers: editor.IMarkerData[] = results.map(result => ({
      startLineNumber: result.start.line,
      startColumn: result.start.col + 1, // Monaco使用1基索引
      endLineNumber: result.end.line,
      endColumn: result.end.col + 1,
      message: `${result.extra.message} (${result.check_id})`,
      severity: result.extra.severity === 'ERROR' 
        ? monaco.MarkerSeverity.Error
        : result.extra.severity === 'WARNING'
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Info,
      source: 'semgrep'
    }));

    monaco.editor.setModelMarkers(model, 'semgrep', markers);

    // 添加装饰器（行高亮）
    const decorations: editor.IModelDeltaDecoration[] = results.map(result => ({
      range: new monaco.Range(
        result.start.line,
        1,
        result.end.line,
        model.getLineMaxColumn(result.end.line)
      ),
      options: {
        isWholeLine: true,
        className: `semgrep-highlight-${result.extra.severity.toLowerCase()}`,
        glyphMarginClassName: `semgrep-glyph-${result.extra.severity.toLowerCase()}`,
        hoverMessage: {
          value: `**${result.extra.severity}**: ${result.extra.message}\n\n**规则**: ${result.check_id}`
        }
      }
    }));

    editor.deltaDecorations([], decorations);
  }, [results]);

  return (
    <Card 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* 编辑器头部 */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <CodeOutlined />
            <Title level={5} style={{ margin: 0 }}>
              代码编辑器
            </Title>
            <Tag color="blue">{LANGUAGE_MAP[language]}</Tag>
          </Space>
          
          <Space>
            {results.length > 0 && (
              <Tag color="red">
                {results.length} 个问题
              </Tag>
            )}
            <Tag color="default">
              {value.split('\n').length} 行
            </Tag>
          </Space>
        </div>
      </div>

      {/* Monaco编辑器 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MonacoEditor
          height="100%"
          language={LANGUAGE_MAP[language]}
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          options={{
            selectOnLineNumbers: true,
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
            trimAutoWhitespace: true,
            renderWhitespace: 'boundary',
            renderControlCharacters: false,
            renderIndentGuides: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8
            }
          }}
        />
      </div>

      {/* 自定义样式 */}
      <style>{`
        .semgrep-highlight-error {
          background: rgba(255, 77, 79, 0.1);
        }
        
        .semgrep-highlight-warning {
          background: rgba(250, 173, 20, 0.1);
        }
        
        .semgrep-highlight-info {
          background: rgba(24, 144, 255, 0.1);
        }
        
        .semgrep-glyph-error::before {
          content: '●';
          color: ${SEVERITY_COLORS.ERROR};
          font-weight: bold;
        }
        
        .semgrep-glyph-warning::before {
          content: '▲';
          color: ${SEVERITY_COLORS.WARNING};
          font-weight: bold;
        }
        
        .semgrep-glyph-info::before {
          content: 'ℹ';
          color: ${SEVERITY_COLORS.INFO};
          font-weight: bold;
        }
        
        .monaco-editor .margin-view-overlays .line-numbers {
          font-size: 12px;
        }
      `}</style>
    </Card>
  );
};

export default CodeEditor;