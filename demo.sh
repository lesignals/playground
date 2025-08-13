#!/bin/bash

# Semgrep Playground 演示启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

# 显示欢迎信息
show_welcome() {
    echo
    log_header "🐛 ========================================"
    log_header "   欢迎使用 Semgrep Playground！"
    log_header "   在线代码安全分析工具"
    log_header "======================================== 🐛"
    echo
    log_info "这是一个基于Web的Semgrep代码分析工具"
    log_info "支持多种编程语言的安全漏洞检测"
    echo
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "系统依赖检查通过"
}

# 启动服务
start_services() {
    log_info "启动 Semgrep Playground 服务..."
    
    # 清理旧容器
    docker-compose -f docker-compose.demo.yml down --remove-orphans 2>/dev/null || true
    
    # 启动新服务
    docker-compose -f docker-compose.demo.yml up -d
    
    log_info "等待服务启动完成..."
    sleep 8
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=15
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "健康检查 ($attempt/$max_attempts)..."
        
        # 检查后端
        if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
            log_success "✅ 后端服务运行正常"
            
            # 检查前端
            if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
                log_success "✅ 前端服务运行正常"
                return 0
            fi
        fi
        
        sleep 2
        ((attempt++))
    done
    
    log_error "❌ 服务启动失败，请检查日志"
    docker-compose -f docker-compose.demo.yml logs
    return 1
}

# 运行API测试
test_api() {
    log_info "测试API功能..."
    
    local test_payload='{"code":"eval(userInput);","language":"javascript","rules":[{"id":"demo-rule","message":"演示规则","languages":["javascript"],"severity":"INFO","pattern":".*"}]}'
    
    local response
    response=$(curl -s -X POST "http://localhost:3001/api/analysis/scan" \
        -H "Content-Type: application/json" \
        -d "$test_payload")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "✅ API测试通过"
        return 0
    else
        log_error "❌ API测试失败"
        echo "响应: $response"
        return 1
    fi
}

# 显示访问信息
show_access_info() {
    echo
    log_header "🎉 ========================================"
    log_header "   Semgrep Playground 启动成功！"
    log_header "======================================== 🎉"
    echo
    log_success "🌐 前端地址: http://localhost:3000"
    log_success "🔧 后端API: http://localhost:3001"
    log_success "💊 健康检查: http://localhost:3001/api/health"
    echo
    log_info "📋 功能特性:"
    log_info "   • 多语言代码分析 (JavaScript/Python/Java等)"
    log_info "   • 实时安全漏洞检测"
    log_info "   • 直观的Web界面"
    log_info "   • 演示模式快速体验"
    echo
    log_info "🚀 使用步骤:"
    log_info "   1. 访问 http://localhost:3000"
    log_info "   2. 在左侧输入要分析的代码"
    log_info "   3. 选择编程语言"
    log_info "   4. 点击'运行分析'按钮"
    log_info "   5. 在右侧查看分析结果"
    echo
    log_info "🛠️  管理命令:"
    log_info "   • 查看日志: docker-compose -f docker-compose.demo.yml logs -f"
    log_info "   • 停止服务: docker-compose -f docker-compose.demo.yml down"
    log_info "   • 重启服务: docker-compose -f docker-compose.demo.yml restart"
    echo
    log_warning "注意: 这是演示版本，返回模拟的分析结果"
    log_info "如需完整Semgrep功能，请参考README.md安装真实版本"
    echo
}

# 主函数
main() {
    show_welcome
    check_dependencies
    start_services
    
    if health_check && test_api; then
        show_access_info
        echo
        log_success "🎊 一切就绪，开始体验 Semgrep Playground！"
        echo
    else
        log_error "启动失败，请检查系统状态"
        exit 1
    fi
}

# 信号处理
cleanup() {
    echo
    log_info "正在清理..."
    docker-compose -f docker-compose.demo.yml down 2>/dev/null || true
}

trap cleanup EXIT

# 执行主函数
main "$@"