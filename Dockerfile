# 多阶段构建Dockerfile - 适合Linux x86_64架构部署

# 构建阶段 - 使用轻量级Node.js镜像
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

# 生产阶段 - 使用轻量级NGINX镜像
FROM nginx:alpine AS production

# 设置环境变量
ENV NGINX_PORT=80

# 复制NGINX配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 复制构建好的Angular应用
COPY --from=builder /app/dist/ui-primeng/browser /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动NGINX
CMD ["nginx", "-g", "daemon off;"]
