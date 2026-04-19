# 多阶段构建Dockerfile - 前端 + Agent 单镜像部署

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package.json package-lock.json ./

# 安装依赖
#RUN npm ci --only=production
RUN npm ci

# 复制源代码
COPY . .

# 构建Angular应用（生产模式）
RUN npm run build

# 运行阶段（同一容器内启动 NGINX + Agent）
FROM node:18-alpine AS production

RUN apk add --no-cache nginx

ENV NGINX_PORT=80 \
    AGENT_HOST=127.0.0.1 \
    AGENT_PORT=8787 \
    GLM_MODEL=glm-4.5 \
    GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions

RUN mkdir -p /run/nginx /var/log/nginx /etc/nginx/http.d /opt/app

# 拷贝前端构建产物
COPY --from=builder /app/dist/ui-primeng/browser /usr/share/nginx/html

# 拷贝 Agent 与启动脚本
COPY agent /opt/app/agent
COPY docker/start.sh /opt/app/start.sh
COPY nginx.conf /etc/nginx/nginx.conf

RUN chmod +x /opt/app/start.sh

EXPOSE 80

CMD ["/opt/app/start.sh"]
