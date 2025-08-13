import React, { useState } from 'react';
import { 
  Card, 
  List, 
  Tag, 
  Typography, 
  Empty, 
  Spin, 
  Alert, 
  Collapse, 
  Space, 
  Button,
  Tooltip,
  Statistic
} from 'antd';
import { 
  BugOutlined, 
  WarningOutlined, 
  InfoCircleOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { SemgrepMatch, AnalysisResponse } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ResultsPanelProps {
  results: SemgrepMatch[];
  stats: AnalysisResponse['stats'] | null;
  errors: string[];
  isAnalyzing: boolean;
  onResultClick: (result: SemgrepMatch) => void;
}

// 严重级别映射
const SEVERITY_CONFIG = {
  ERROR: {
    color: 'red',
    icon: <BugOutlined />,
    label: '错误'
  },
  WARNING: {
    color: 'orange',
    icon: <WarningOutlined />,
    label: '警告'
  },
  INFO: {
    color: 'blue',
    icon: <InfoCircleOutlined />,
    label: '信息'
  }
};

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  stats,
  errors,
  isAnalyzing,
  onResultClick
}) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(['results']);

  // 按严重级别分组结果
  const groupedResults = results.reduce((acc, result) => {
    const severity = result.extra.severity;
    if (!acc[severity]) {
      acc[severity] = [];
    }
    acc[severity].push(result);
    return acc;
  }, {} as Record<string, SemgrepMatch[]>);

  // 统计信息
  const errorCount = groupedResults.ERROR?.length || 0;
  const warningCount = groupedResults.WARNING?.length || 0;
  const infoCount = groupedResults.INFO?.length || 0;

  // 渲染统计信息
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div style={{ 
        padding: 16, 
        background: '#fafafa', 
        borderBottom: '1px solid #f0f0f0' 
      }}>
        <Space size="large">
          <Statistic
            title="发现问题"
            value={results.length}
            prefix={<BugOutlined />}
            valueStyle={{ 
              color: results.length > 0 ? '#cf1322' : '#389e0d',
              fontSize: 20
            }}
          />
          <Statistic
            title="执行时间"
            value={`${stats.executionTime}ms`}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ fontSize: 16 }}
          />
          <Statistic
            title="规则数"
            value={stats.rulesCount}
            prefix={<FileSearchOutlined />}
            valueStyle={{ fontSize: 16 }}
          />
        </Space>
      </div>
    );
  };

  // 渲染单个结果
  const renderResultItem = (result: SemgrepMatch) => {
    const config = SEVERITY_CONFIG[result.extra.severity];
    
    return (
      <List.Item
        key={`${result.check_id}-${result.start.line}-${result.start.col}`}
        style={{ 
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          borderLeft: `4px solid ${config.color === 'red' ? '#ff4d4f' : config.color === 'orange' ? '#faad14' : '#1890ff'}`
        }}
        onClick={() => onResultClick(result)}
      >
        <List.Item.Meta
          avatar={
            <Tag color={config.color} icon={config.icon}>
              {config.label}
            </Tag>
          }
          title={
            <div>
              <Text strong>{result.check_id}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                第 {result.start.line} 行
              </Text>
            </div>
          }
          description={
            <div>
              <Paragraph style={{ marginBottom: 8 }}>
                {result.extra.message}
              </Paragraph>
              {result.extra.lines && (
                <div style={{ 
                  background: '#f6f8fa',
                  padding: '8px 12px',
                  borderRadius: 4,
                  fontFamily: 'Monaco, Menlo, monospace',
                  fontSize: 12,
                  overflowX: 'auto'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {result.extra.lines.trim()}
                  </pre>
                </div>
              )}
              {result.extra.metadata && Object.keys(result.extra.metadata).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Space size={4} wrap>
                    {result.extra.metadata.category && (
                      <Tag size="small">{result.extra.metadata.category}</Tag>
                    )}
                    {result.extra.metadata.confidence && (
                      <Tag size="small" color="geekblue">
                        置信度: {result.extra.metadata.confidence}
                      </Tag>
                    )}
                    {result.extra.metadata.impact && (
                      <Tag size="small" color="volcano">
                        影响: {result.extra.metadata.impact}
                      </Tag>
                    )}
                  </Space>
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  // 渲染结果列表
  const renderResults = () => {
    if (results.length === 0) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无检测结果"
          >
            <Text type="secondary">
              运行分析后，检测到的问题会显示在这里
            </Text>
          </Empty>
        </div>
      );
    }

    return (
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {/* 错误级别 */}
        {groupedResults.ERROR && (
          <div>
            <div style={{ 
              padding: '8px 16px', 
              background: '#fff2f0', 
              borderBottom: '1px solid #ffccc7',
              color: '#cf1322',
              fontWeight: 'bold'
            }}>
              <Space>
                <BugOutlined />
                错误 ({errorCount})
              </Space>
            </div>
            <List
              dataSource={groupedResults.ERROR}
              renderItem={renderResultItem}
              split={false}
            />
          </div>
        )}

        {/* 警告级别 */}
        {groupedResults.WARNING && (
          <div>
            <div style={{ 
              padding: '8px 16px', 
              background: '#fffbe6', 
              borderBottom: '1px solid #ffe58f',
              color: '#d46b08',
              fontWeight: 'bold'
            }}>
              <Space>
                <WarningOutlined />
                警告 ({warningCount})
              </Space>
            </div>
            <List
              dataSource={groupedResults.WARNING}
              renderItem={renderResultItem}
              split={false}
            />
          </div>
        )}

        {/* 信息级别 */}
        {groupedResults.INFO && (
          <div>
            <div style={{ 
              padding: '8px 16px', 
              background: '#e6f7ff', 
              borderBottom: '1px solid #91d5ff',
              color: '#0958d9',
              fontWeight: 'bold'
            }}>
              <Space>
                <InfoCircleOutlined />
                信息 ({infoCount})
              </Space>
            </div>
            <List
              dataSource={groupedResults.INFO}
              renderItem={renderResultItem}
              split={false}
            />
          </div>
        )}
      </div>
    );
  };

  // 渲染错误信息
  const renderErrors = () => {
    if (errors.length === 0) return null;

    return (
      <Panel header={`分析错误 (${errors.length})`} key="errors">
        <Space direction="vertical" style={{ width: '100%' }}>
          {errors.map((error, index) => (
            <Alert
              key={index}
              type="error"
              message="分析错误"
              description={error}
              showIcon
            />
          ))}
        </Space>
      </Panel>
    );
  };

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* 头部 */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa'
      }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <BugOutlined />
            <Title level={5} style={{ margin: 0 }}>
              分析结果
            </Title>
            {results.length > 0 && (
              <Tag color={errorCount > 0 ? 'red' : warningCount > 0 ? 'orange' : 'blue'}>
                {results.length} 个问题
              </Tag>
            )}
          </Space>
          
          {isAnalyzing && (
            <Space>
              <Spin size="small" />
              <Text type="secondary">分析中...</Text>
            </Space>
          )}
        </Space>
      </div>

      {/* 统计信息 */}
      {renderStats()}

      {/* 结果内容 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {isAnalyzing ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            flexDirection: 'column',
            gap: 16
          }}>
            <Spin size="large" />
            <Text type="secondary">正在分析代码，请稍候...</Text>
          </div>
        ) : (
          <Collapse
            activeKey={activeKeys}
            onChange={setActiveKeys}
            ghost
            style={{ height: '100%' }}
          >
            <Panel 
              header={`检测结果 (${results.length})`} 
              key="results"
              extra={results.length > 0 ? (
                <Tooltip title="点击结果项跳转到代码位置">
                  <InfoCircleOutlined />
                </Tooltip>
              ) : null}
            >
              {renderResults()}
            </Panel>
            
            {errors.length > 0 && renderErrors()}
          </Collapse>
        )}
      </div>
    </Card>
  );
};

export default ResultsPanel;