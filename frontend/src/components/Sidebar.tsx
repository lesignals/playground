import React, { useState, useEffect } from 'react';
import { Layout, Menu, Select, Button, Space, Typography, message, Collapse } from 'antd';
import { 
  CodeOutlined, 
  SafetyOutlined, 
  SettingOutlined, 
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined
} from '@ant-design/icons';

import RuleEditor from './RuleEditor';
import { analysisApi, rulesApi } from '../services/api';
import type { SupportedLanguage, Language, SemgrepRule, RulePreset } from '../types';

const { Sider } = Layout;
const { Title, Text } = Typography;
const { Panel } = Collapse;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  rules: SemgrepRule[];
  onRulesChange: (rules: SemgrepRule[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onCollapse,
  language,
  onLanguageChange,
  rules,
  onRulesChange
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [presets, setPresets] = useState<RulePreset[]>([]);
  const [exampleRules, setExampleRules] = useState<SemgrepRule[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [activeKey, setActiveKey] = useState<string[]>(['language', 'presets']);

  // 加载语言列表
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const langs = await analysisApi.getLanguages();
        setLanguages(langs);
      } catch (error: any) {
        console.error('加载语言列表失败:', error);
        message.error('加载语言列表失败');
      }
    };

    loadLanguages();
  }, []);

  // 加载预设规则
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const presetList = await analysisApi.getPresets();
        setPresets(presetList);
      } catch (error: any) {
        console.error('加载预设规则失败:', error);
        message.error('加载预设规则失败');
      }
    };

    loadPresets();
  }, []);

  // 加载示例规则
  useEffect(() => {
    const loadExampleRules = async () => {
      try {
        const examples = await rulesApi.getExamples();
        setExampleRules(examples);
      } catch (error: any) {
        console.error('加载示例规则失败:', error);
        message.error('加载示例规则失败');
      }
    };

    loadExampleRules();
  }, []);

  // 选择预设规则
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    // 使用预设规则ID作为规则配置
    const presetRule: SemgrepRule = {
      id: `preset-${presetId}`,
      message: `使用预设规则: ${presets.find(p => p.id === presetId)?.name}`,
      languages: [language],
      severity: 'ERROR',
      pattern: `// 预设规则: ${presetId}`
    };
    onRulesChange([presetRule]);
    message.success(`已选择预设规则: ${presets.find(p => p.id === presetId)?.name}`);
  };

  // 添加示例规则
  const handleAddExampleRule = (rule: SemgrepRule) => {
    const existingRule = rules.find(r => r.id === rule.id);
    if (existingRule) {
      message.warning('规则已存在');
      return;
    }

    onRulesChange([...rules, rule]);
    message.success(`已添加规则: ${rule.id}`);
  };

  // 删除规则
  const handleRemoveRule = (ruleId: string) => {
    const newRules = rules.filter(rule => rule.id !== ruleId);
    onRulesChange(newRules);
    message.success('规则已删除');
  };

  // 添加自定义规则
  const handleAddCustomRule = (rule: SemgrepRule) => {
    const existingRule = rules.find(r => r.id === rule.id);
    if (existingRule) {
      // 更新现有规则
      const newRules = rules.map(r => r.id === rule.id ? rule : r);
      onRulesChange(newRules);
      message.success('规则已更新');
    } else {
      // 添加新规则
      onRulesChange([...rules, rule]);
      message.success('规则已添加');
    }
    setShowRuleEditor(false);
  };

  if (collapsed) {
    return (
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        width={300}
        collapsedWidth={80}
        trigger={null}
        style={{ position: 'fixed', height: '100vh', zIndex: 10 }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Button
            type="text"
            icon={<MenuUnfoldOutlined />}
            onClick={() => onCollapse(false)}
          />
        </div>
      </Sider>
    );
  }

  return (
    <>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        width={300}
        collapsedWidth={80}
        trigger={null}
        style={{ position: 'fixed', height: '100vh', zIndex: 10, overflow: 'auto' }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>配置面板</Title>
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={() => onCollapse(true)}
            />
          </div>

          <Collapse 
            activeKey={activeKey} 
            onChange={setActiveKey}
            ghost
          >
            {/* 语言选择 */}
            <Panel header="编程语言" key="language" extra={<CodeOutlined />}>
              <Select
                value={language}
                onChange={onLanguageChange}
                style={{ width: '100%' }}
                placeholder="选择编程语言"
              >
                {languages.map(lang => (
                  <Select.Option key={lang.id} value={lang.id}>
                    {lang.name} ({lang.extension})
                  </Select.Option>
                ))}
              </Select>
            </Panel>

            {/* 预设规则 */}
            <Panel header="预设规则" key="presets" extra={<SafetyOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  value={selectedPreset}
                  onChange={handlePresetSelect}
                  style={{ width: '100%' }}
                  placeholder="选择预设规则"
                  allowClear
                >
                  {presets.map(preset => (
                    <Select.Option key={preset.id} value={preset.id}>
                      <div>
                        <Text strong>{preset.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {preset.description}
                        </Text>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Space>
            </Panel>

            {/* 示例规则 */}
            <Panel header="示例规则" key="examples" extra={<FileTextOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {exampleRules
                  .filter(rule => rule.languages.includes(language))
                  .map(rule => (
                    <div key={rule.id} style={{ 
                      padding: 8, 
                      border: '1px solid #f0f0f0', 
                      borderRadius: 4,
                      fontSize: 12 
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                        {rule.id}
                      </div>
                      <div style={{ color: '#666', marginBottom: 8 }}>
                        {rule.message}
                      </div>
                      <Button
                        size="small"
                        type="link"
                        onClick={() => handleAddExampleRule(rule)}
                        style={{ padding: 0 }}
                      >
                        添加规则
                      </Button>
                    </div>
                  ))}
              </Space>
            </Panel>

            {/* 当前规则 */}
            <Panel header={`当前规则 (${rules.length})`} key="current" extra={<SettingOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setShowRuleEditor(true)}
                  block
                  size="small"
                >
                  添加自定义规则
                </Button>
                
                {rules.map(rule => (
                  <div key={rule.id} style={{ 
                    padding: 8, 
                    border: '1px solid #f0f0f0', 
                    borderRadius: 4,
                    fontSize: 12 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4 
                    }}>
                      <Text strong style={{ fontSize: 12 }}>{rule.id}</Text>
                      <Button
                        type="text"
                        size="small"
                        danger
                        onClick={() => handleRemoveRule(rule.id)}
                        style={{ padding: 0, fontSize: 10 }}
                      >
                        删除
                      </Button>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {rule.message}
                    </Text>
                  </div>
                ))}
                
                {rules.length === 0 && (
                  <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
                    暂无规则，请选择预设规则或添加自定义规则
                  </Text>
                )}
              </Space>
            </Panel>
          </Collapse>
        </div>
      </Sider>

      {/* 规则编辑器弹窗 */}
      {showRuleEditor && (
        <RuleEditor
          visible={showRuleEditor}
          onClose={() => setShowRuleEditor(false)}
          onSave={handleAddCustomRule}
          language={language}
        />
      )}
    </>
  );
};

export default Sidebar;