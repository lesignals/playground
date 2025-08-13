# Semgrep Playground

一个基于Web的Semgrep代码分析工具，支持在线测试和编辑安全规则。

## 技术架构

### 前端 (React + TypeScript)
- **编辑器**: Monaco Editor (VS Code编辑器内核)
- **UI框架**: React 18 + Ant Design
- **构建工具**: Vite
- **代码高亮**: 多语言语法高亮支持

### 后端 (Node.js)
- **框架**: Express.js + TypeScript
- **分析引擎**: 集成Semgrep CLI
- **安全**: 代码执行沙箱隔离
- **API**: RESTful接口设计

### 容器化 (Docker)
- **隔离环境**: Docker容器运行分析任务
- **安全**: 资源限制和权限控制
- **部署**: Docker Compose一键部署

## 项目结构

```
semgrep-playground/
├── backend/          # Node.js API服务
│   ├── src/         # 源代码
│   ├── package.json # 依赖配置
│   └── Dockerfile   # 后端容器配置
├── frontend/         # React前端应用
│   ├── src/         # 源代码
│   ├── package.json # 依赖配置
│   └── Dockerfile   # 前端容器配置
├── docker/          # Docker配置
│   └── docker-compose.yml
└── docs/            # 项目文档
```

## 核心功能

1. **代码编辑器**: 支持多语言语法高亮
2. **规则编辑**: 可视化编辑Semgrep规则
3. **实时分析**: 在线运行代码安全扫描
4. **结果展示**: 直观显示检测结果
5. **规则库**: 内置常见安全规则模板

## 快速开始

### 🚀 方法一：演示版本 (推荐，快速体验)
```bash
# 一键启动演示版本
./demo.sh
```
演示版本特点：
- ⚡ 快速启动，无需安装Semgrep
- 🎯 模拟分析结果，展示完整功能
- 💻 完整的Web界面体验
- 🔧 适合功能演示和开发测试

### 🔧 方法二：完整版本 (需要Semgrep)
```bash
# 启动生产环境
./deploy.sh start

# 启动开发环境  
./deploy.sh dev

# 查看帮助
./deploy.sh help
```

### 方法二：使用Docker Compose
```bash
# 生产环境
docker-compose up -d

# 开发环境
docker-compose -f docker-compose.dev.yml up -d
```

### 方法三：本地开发
```bash
# 前提：需要安装Semgrep
pip install semgrep

# 启动后端
cd backend && npm install && npm run dev

# 启动前端
cd frontend && npm install && npm run dev
```

## 访问地址
- 🌐 **前端**: http://localhost:3000
- 🔧 **后端API**: http://localhost:3001  
- 💊 **健康检查**: http://localhost:3001/api/health

## 使用指南

### 1. 选择编程语言
在左侧面板选择要分析的编程语言，编辑器会自动加载对应的示例代码。

### 2. 配置分析规则
- **预设规则**: 选择内置的安全规则集（如OWASP Top 10、命令注入等）
- **示例规则**: 使用针对当前语言的示例规则
- **自定义规则**: 创建自己的Semgrep规则

### 3. 编写/粘贴代码
在代码编辑器中输入要分析的代码，编辑器支持语法高亮和智能提示。

### 4. 运行分析
点击右上角的"运行分析"按钮，系统会使用选定的规则分析代码。

### 5. 查看结果
分析结果会显示在下方面板中，包括：
- 问题详情和严重程度
- 代码位置和上下文
- 修复建议

## 管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
./deploy.sh logs

# 重启服务
./deploy.sh restart

# 停止服务
./deploy.sh stop

# 清理环境
./deploy.sh clean

# 运行测试
./test.sh
```

## 项目特性

### ✅ 已实现功能
- ✅ 多语言支持（JavaScript/TypeScript/Python/Java/Go/C/C++/Rust/PHP/Ruby）
- ✅ Monaco编辑器集成，支持语法高亮和智能提示
- ✅ 预设安全规则集（OWASP Top 10、命令注入、SQL注入等）
- ✅ 自定义规则编辑器，支持YAML预览
- ✅ 实时代码分析和结果展示
- ✅ Docker容器化部署
- ✅ 响应式UI设计
- ✅ 完整的API接口
- ✅ 健康检查和监控
- ✅ 安全沙箱执行环境

### 🔄 技术栈
**前端**: React 18 + TypeScript + Ant Design + Monaco Editor + Vite
**后端**: Node.js + Express + TypeScript + Semgrep
**部署**: Docker + Docker Compose + Nginx

## 开发指南

### 目录结构
```
├── backend/          # Node.js API服务
├── frontend/         # React前端应用
├── docker/          # Docker配置
├── docs/            # 项目文档
├── deploy.sh        # 一键部署脚本
└── test.sh          # 测试脚本
```

### API接口
- `GET /api/health` - 健康检查
- `POST /api/analysis/scan` - 代码分析
- `GET /api/analysis/languages` - 支持的语言
- `GET /api/rules/examples` - 示例规则
- `POST /api/rules/validate` - 规则验证

## 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 联系方式

如有问题或建议，请创建 [Issue](../../issues) 或联系维护者。