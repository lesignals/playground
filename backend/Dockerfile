# 使用单阶段构建简化流程
FROM node:18-alpine AS runtime

# 安装Semgrep和其他依赖
RUN apk add --no-cache \
    python3 \
    py3-pip \
    git \
    curl \
    && pip3 install --break-system-packages semgrep \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# 复制package文件并安装依赖
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# 复制源代码
COPY . .

# 构建TypeScript
RUN npm run build

# 修改文件所有者
RUN chown -R nextjs:nodejs /app

# 创建临时目录
RUN mkdir -p /tmp/semgrep-playground && \
    chown -R nextjs:nodejs /tmp/semgrep-playground

# 切换到应用用户
USER nextjs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 启动命令
CMD ["node", "dist/server.js"]