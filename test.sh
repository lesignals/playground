#!/bin/bash

# Semgrep Playground 测试脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
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

# 测试计数器
total_tests=0
passed_tests=0
failed_tests=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-0}"
    
    total_tests=$((total_tests + 1))
    log_info "运行测试: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        local status=$?
        if [ $status -eq $expected_status ]; then
            log_success "✓ $test_name"
            passed_tests=$((passed_tests + 1))
            return 0
        else
            log_error "✗ $test_name (期望状态码: $expected_status, 实际: $status)"
            failed_tests=$((failed_tests + 1))
            return 1
        fi
    else
        log_error "✗ $test_name (命令执行失败)"
        failed_tests=$((failed_tests + 1))
        return 1
    fi
}

# API测试函数
test_api() {
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    
    local response_status
    response_status=$(curl -s -w "%{http_code}" -X "$method" "http://localhost:3001$endpoint" -o /dev/null)
    
    if [ "$response_status" -eq "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# 前端测试函数
test_frontend() {
    local response_status
    response_status=$(curl -s -w "%{http_code}" "http://localhost:3000" -o /dev/null)
    
    if [ "$response_status" -eq 200 ]; then
        return 0
    else
        return 1
    fi
}

# 主测试流程
main() {
    echo
    log_info "==============================="
    log_info "  Semgrep Playground 测试"
    log_info "==============================="
    echo
    
    # 检查服务是否运行
    log_info "检查Docker容器状态..."
    if ! docker-compose ps | grep -q "Up"; then
        log_error "Docker容器未运行，请先启动服务: ./deploy.sh start"
        exit 1
    fi
    log_success "Docker容器运行正常"
    echo
    
    # 等待服务启动
    log_info "等待服务完全启动..."
    sleep 10
    
    # 后端API测试
    log_info "测试后端API..."
    run_test "健康检查API" "test_api '/api/health'"
    run_test "Semgrep健康检查" "test_api '/api/health/semgrep'"
    run_test "获取支持语言" "test_api '/api/analysis/languages'"
    run_test "获取预设规则" "test_api '/api/analysis/presets'"
    run_test "获取示例规则" "test_api '/api/rules/examples'"
    run_test "获取规则模板" "test_api '/api/rules/templates'"
    echo
    
    # 前端测试
    log_info "测试前端..."
    run_test "前端页面访问" "test_frontend"
    echo
    
    # 集成测试 - 代码分析
    log_info "测试代码分析功能..."
    local test_payload='{"code":"eval(userInput);","language":"javascript","rules":[{"id":"eval-usage","message":"使用eval()函数存在代码注入风险","languages":["javascript"],"severity":"ERROR","pattern":"eval(...)"}]}'
    
    local analysis_response
    analysis_response=$(curl -s -X POST "http://localhost:3001/api/analysis/scan" \
        -H "Content-Type: application/json" \
        -d "$test_payload")
    
    if echo "$analysis_response" | grep -q '"success":true'; then
        log_success "✓ 代码分析API"
        passed_tests=$((passed_tests + 1))
    else
        log_error "✗ 代码分析API"
        log_error "响应: $analysis_response"
        failed_tests=$((failed_tests + 1))
    fi
    total_tests=$((total_tests + 1))
    echo
    
    # 规则验证测试
    log_info "测试规则验证功能..."
    local rule_payload='{"rules":[{"id":"test-rule","message":"测试规则","languages":["javascript"],"severity":"ERROR","pattern":"console.log(...)"}]}'
    
    local validation_response
    validation_response=$(curl -s -X POST "http://localhost:3001/api/rules/validate" \
        -H "Content-Type: application/json" \
        -d "$rule_payload")
    
    if echo "$validation_response" | grep -q '"success":true'; then
        log_success "✓ 规则验证API"
        passed_tests=$((passed_tests + 1))
    else
        log_error "✗ 规则验证API"
        log_error "响应: $validation_response"
        failed_tests=$((failed_tests + 1))
    fi
    total_tests=$((total_tests + 1))
    echo
    
    # 测试结果汇总
    log_info "==============================="
    log_info "           测试结果"
    log_info "==============================="
    echo
    log_info "总测试数: $total_tests"
    log_success "通过: $passed_tests"
    if [ $failed_tests -gt 0 ]; then
        log_error "失败: $failed_tests"
    else
        log_success "失败: $failed_tests"
    fi
    echo
    
    if [ $failed_tests -eq 0 ]; then
        log_success "🎉 所有测试通过！"
        log_success "项目运行正常，可以开始使用了"
        echo
        log_info "访问地址:"
        log_info "🌐 前端: http://localhost:3000"
        log_info "🔧 后端: http://localhost:3001"
        return 0
    else
        log_error "❌ 有测试失败，请检查服务状态"
        echo
        log_info "调试信息:"
        log_info "📊 查看日志: docker-compose logs"
        log_info "🔧 重启服务: ./deploy.sh restart"
        return 1
    fi
}

# 清理函数
cleanup() {
    echo
    log_info "测试完成"
}

# 信号处理
trap cleanup EXIT

# 执行测试
main "$@"