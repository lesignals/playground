#!/bin/bash

# 简化的构建测试脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 清理旧容器
log_info "清理旧容器..."
docker-compose down --remove-orphans 2>/dev/null || true

# 只构建后端
log_info "构建后端镜像..."
if docker-compose build backend; then
    log_success "后端镜像构建成功"
else
    log_error "后端镜像构建失败"
    exit 1
fi

# 构建前端
log_info "构建前端镜像..."
if docker-compose build frontend; then
    log_success "前端镜像构建成功"
else
    log_error "前端镜像构建失败"
    exit 1
fi

log_success "所有镜像构建完成！"
log_info "现在可以运行: docker-compose up -d"