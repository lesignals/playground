import React from 'react';
import { Layout, Button, Space, Typography, Tag, Statistic, Row, Col } from 'antd';
import { PlayCircleOutlined, BugOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { AnalysisResponse } from '../types';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

interface HeaderProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isHealthy: boolean;
  analysisStats: AnalysisResponse['stats'] | null;
}

const Header: React.FC<HeaderProps> = ({ 
  onAnalyze, 
  isAnalyzing, 
  isHealthy,
  analysisStats 
}) => {
  return (
    <AntHeader style={{ 
      padding: '0 24px',
      height: 'auto',
      lineHeight: 'normal',
      paddingTop: 16,
      paddingBottom: 16
    }}>
      <Row align="middle" justify="space-between">
        {/* Logo和标题 */}
        <Col>
          <Space align="center">
            <BugOutlined style={{ fontSize: 28, color: '#1890ff' }} />
            <div>
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                Semgrep Playground
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                在线代码安全分析工具
              </Text>
            </div>
          </Space>
        </Col>

        {/* 统计信息 */}
        {analysisStats && (
          <Col>
            <Space size="large">
              <Statistic 
                title="检测问题" 
                value={analysisStats.matchesCount}
                prefix={<BugOutlined />}
                valueStyle={{ color: analysisStats.matchesCount > 0 ? '#cf1322' : '#389e0d' }}
              />
              <Statistic 
                title="执行时间" 
                value={`${analysisStats.executionTime}ms`}
                prefix={<CheckCircleOutlined />}
              />
              <Statistic 
                title="规则数量" 
                value={analysisStats.rulesCount}
              />
            </Space>
          </Col>
        )}

        {/* 操作按钮 */}
        <Col>
          <Space>
            <Tag 
              color={isHealthy ? 'green' : 'red'} 
              icon={isHealthy ? <CheckCircleOutlined /> : <WarningOutlined />}
            >
              服务状态: {isHealthy ? '正常' : '异常'}
            </Tag>
            
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={isAnalyzing}
              onClick={onAnalyze}
              size="large"
              disabled={!isHealthy}
            >
              {isAnalyzing ? '分析中...' : '运行分析'}
            </Button>
          </Space>
        </Col>
      </Row>
    </AntHeader>
  );
};

export default Header;