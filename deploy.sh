#!/bin/bash

# Semgrep Playground 部署脚本

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

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "Docker 环境检查通过"
}

# 清理旧容器
cleanup() {
    log_info "清理旧容器和镜像..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker system prune -f --volumes 2>/dev/null || true
    log_success "清理完成"
}

# 构建镜像
build() {
    log_info "构建Docker镜像..."
    docker-compose build --no-cache --parallel
    log_success "镜像构建完成"
}

# 启动服务
start() {
    log_info "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if check_health; then
        log_success "服务启动成功！"
        show_info
    else
        log_error "服务启动失败"
        docker-compose logs
        exit 1
    fi
}

# 健康检查
check_health() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1 && \
           curl -f -s http://localhost:3000 > /dev/null 2>&1; then
            return 0
        fi
        
        log_info "健康检查 ($attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    done
    
    return 1
}

# 显示服务信息
show_info() {
    echo
    log_success "=================================="
    log_success "  Semgrep Playground 部署成功！"
    log_success "=================================="
    echo
    log_info "🌐 前端地址: http://localhost:3000"
    log_info "🔧 后端API: http://localhost:3001"
    log_info "💊 健康检查: http://localhost:3001/api/health"
    echo
    log_info "📊 查看日志: docker-compose logs -f"
    log_info "🛑 停止服务: docker-compose down"
    log_info "🔄 重启服务: docker-compose restart"
    echo
}

# 开发环境部署
deploy_dev() {
    log_info "部署开发环境..."
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml up -d --build
    
    log_info "等待开发服务启动..."
    sleep 15
    
    log_success "开发环境部署完成！"
    log_info "🌐 前端开发服务: http://localhost:3000"
    log_info "🔧 后端开发服务: http://localhost:3001"
    log_info "📊 查看日志: docker-compose -f docker-compose.dev.yml logs -f"
}

# 停止服务
stop() {
    log_info "停止服务..."
    docker-compose down
    log_success "服务已停止"
}

# 查看日志
logs() {
    docker-compose logs -f
}

# 重启服务
restart() {
    log_info "重启服务..."
    docker-compose restart
    sleep 5
    
    if check_health; then
        log_success "服务重启成功！"
    else
        log_error "服务重启失败"
        docker-compose logs
    fi
}

# 显示帮助
show_help() {
    echo "Semgrep Playground 部署脚本"
    echo
    echo "用法: $0 [命令]"
    echo
    echo "命令:"
    echo "  start     启动生产环境 (默认)"
    echo "  dev       启动开发环境"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  logs      查看日志"
    echo "  build     重新构建镜像"
    echo "  clean     清理容器和镜像"
    echo "  health    检查服务健康状态"
    echo "  help      显示帮助信息"
    echo
}

# 主逻辑
main() {
    case "${1:-start}" in
        "start")
            check_docker
            cleanup
            build
            start
            ;;
        "dev")
            check_docker
            deploy_dev
            ;;
        "stop")
            stop
            ;;
        "restart")
            restart
            ;;
        "logs")
            logs
            ;;
        "build")
            check_docker
            build
            ;;
        "clean")
            cleanup
            ;;
        "health")
            if check_health; then
                log_success "服务运行正常"
            else
                log_error "服务不可用"
                exit 1
            fi
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"