import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Space,
  Button,
  Typography,
  Tabs,
  Alert,
  message
} from 'antd';
import { CodeOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import MonacoEditor from '@monaco-editor/react';

import { rulesApi } from '../services/api';
import type { SemgrepRule, SupportedLanguage, RuleTemplate } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface RuleEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rule: SemgrepRule) => void;
  language: SupportedLanguage;
  initialRule?: SemgrepRule;
}

const RuleEditor: React.FC<RuleEditorProps> = ({
  visible,
  onClose,
  onSave,
  language,
  initialRule
}) => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');
  const [yamlPreview, setYamlPreview] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);

  // 加载规则模板
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await rulesApi.getTemplates();
        setTemplates(templateList);
      } catch (error: any) {
        console.error('加载规则模板失败:', error);
        message.error('加载规则模板失败');
      }
    };

    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  // 初始化表单
  useEffect(() => {
    if (visible) {
      if (initialRule) {
        form.setFieldsValue({
          id: initialRule.id,
          message: initialRule.message,
          languages: initialRule.languages,
          severity: initialRule.severity,
          pattern: initialRule.pattern,
          category: initialRule.metadata?.category || '',
          confidence: initialRule.metadata?.confidence || 'MEDIUM',
          impact: initialRule.metadata?.impact || 'MEDIUM'
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          languages: [language],
          severity: 'ERROR',
          confidence: 'MEDIUM',
          impact: 'MEDIUM'
        });
      }
    }
  }, [visible, initialRule, language, form]);

  // 应用模板
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      form.setFieldsValue({
        id: template.template.id || '',
        message: template.template.message || '',
        languages: template.template.languages || [language],
        severity: template.template.severity || 'ERROR',
        pattern: template.template.pattern || '',
        category: template.template.metadata?.category || '',
        confidence: template.template.metadata?.confidence || 'MEDIUM',
        impact: template.template.metadata?.impact || 'MEDIUM'
      });
      setSelectedTemplate(templateId);
    }
  };

  // 生成YAML预览
  const generateYamlPreview = () => {
    const values = form.getFieldsValue();
    
    if (!values.id || !values.message) {
      setYamlPreview('# 请填写规则ID和消息');
      return;
    }

    const yaml = `rules:
  - id: ${values.id || 'my-rule'}
    message: ${values.message || '请描述这个安全问题'}
    languages: [${(values.languages || [language]).join(', ')}]
    severity: ${values.severity || 'ERROR'}${values.pattern ? `
    pattern: ${JSON.stringify(values.pattern)}` : ''}${values.category ? `
    metadata:
      category: ${values.category}` : ''}${values.confidence ? `
      confidence: ${values.confidence}` : ''}${values.impact ? `
      impact: ${values.impact}` : ''}`;

    setYamlPreview(yaml);
  };

  // 表单值变化时更新预览
  useEffect(() => {
    if (activeTab === 'preview') {
      generateYamlPreview();
    }
  }, [activeTab, form]);

  // 验证规则
  const validateRule = async () => {
    setValidationLoading(true);
    
    try {
      const values = form.getFieldsValue();
      const rule: SemgrepRule = {
        id: values.id,
        message: values.message,
        languages: values.languages || [language],
        severity: values.severity,
        pattern: values.pattern,
        metadata: {
          category: values.category,
          confidence: values.confidence,
          impact: values.impact
        }
      };

      await rulesApi.validate([rule]);
      message.success('规则验证通过');
    } catch (error: any) {
      message.error(error.message || '规则验证失败');
    } finally {
      setValidationLoading(false);
    }
  };

  // 保存规则
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const rule: SemgrepRule = {
        id: values.id,
        message: values.message,
        languages: values.languages || [language],
        severity: values.severity,
        pattern: values.pattern,
        metadata: {
          category: values.category || undefined,
          confidence: values.confidence || undefined,
          impact: values.impact || undefined
        }
      };

      // 先验证规则
      await rulesApi.validate([rule]);
      
      onSave(rule);
      onClose();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请填写必填字段');
      } else {
        message.error(error.message || '保存失败');
      }
    }
  };

  return (
    <Modal
      title="规则编辑器"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button 
          key="validate" 
          onClick={validateRule}
          loading={validationLoading}
        >
          验证规则
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
        >
          保存规则
        </Button>
      ]}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 基础配置 */}
        <TabPane tab="基础配置" key="basic">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 模板选择 */}
            <div>
              <Title level={5}>选择模板（可选）</Title>
              <Select
                value={selectedTemplate}
                onChange={applyTemplate}
                placeholder="选择一个模板快速开始"
                style={{ width: '100%' }}
                allowClear
              >
                {templates.map(template => (
                  <Select.Option key={template.id} value={template.id}>
                    <div>
                      <Text strong>{template.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {template.description}
                      </Text>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* 规则表单 */}
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                languages: [language],
                severity: 'ERROR'
              }}
            >
              <Form.Item
                label="规则ID"
                name="id"
                rules={[
                  { required: true, message: '请输入规则ID' },
                  { pattern: /^[a-z0-9-_]+$/, message: '只能包含小写字母、数字、连字符和下划线' }
                ]}
              >
                <Input placeholder="例如: my-security-rule" />
              </Form.Item>

              <Form.Item
                label="规则消息"
                name="message"
                rules={[{ required: true, message: '请输入规则消息' }]}
              >
                <TextArea 
                  placeholder="描述这个安全问题，例如：发现SQL注入漏洞"
                  rows={2}
                />
              </Form.Item>

              <Form.Item
                label="编程语言"
                name="languages"
                rules={[{ required: true, message: '请选择至少一种编程语言' }]}
              >
                <Select mode="multiple" placeholder="选择支持的编程语言">
                  <Select.Option value="javascript">JavaScript</Select.Option>
                  <Select.Option value="typescript">TypeScript</Select.Option>
                  <Select.Option value="python">Python</Select.Option>
                  <Select.Option value="java">Java</Select.Option>
                  <Select.Option value="go">Go</Select.Option>
                  <Select.Option value="c">C</Select.Option>
                  <Select.Option value="cpp">C++</Select.Option>
                  <Select.Option value="rust">Rust</Select.Option>
                  <Select.Option value="php">PHP</Select.Option>
                  <Select.Option value="ruby">Ruby</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="严重级别"
                name="severity"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio value="ERROR">错误</Radio>
                  <Radio value="WARNING">警告</Radio>
                  <Radio value="INFO">信息</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="匹配模式"
                name="pattern"
                rules={[{ required: true, message: '请输入匹配模式' }]}
              >
                <TextArea 
                  placeholder="例如: eval(...) 或 document.write(...)"
                  rows={4}
                />
              </Form.Item>

              <Form.Item label="分类" name="category">
                <Input placeholder="例如: security, performance" />
              </Form.Item>

              <Form.Item label="置信度" name="confidence">
                <Select>
                  <Select.Option value="LOW">低</Select.Option>
                  <Select.Option value="MEDIUM">中</Select.Option>
                  <Select.Option value="HIGH">高</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="影响程度" name="impact">
                <Select>
                  <Select.Option value="LOW">低</Select.Option>
                  <Select.Option value="MEDIUM">中</Select.Option>
                  <Select.Option value="HIGH">高</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </Space>
        </TabPane>

        {/* YAML预览 */}
        <TabPane 
          tab={
            <span>
              <EyeOutlined />
              YAML预览
            </span>
          } 
          key="preview"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="规则预览"
              description="这是根据您的配置生成的Semgrep规则YAML格式预览"
              type="info"
              showIcon
            />
            
            <div style={{ height: 400, border: '1px solid #d9d9d9', borderRadius: 6 }}>
              <MonacoEditor
                height="100%"
                language="yaml"
                value={yamlPreview}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  theme: 'vs'
                }}
              />
            </div>
          </Space>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default RuleEditor;