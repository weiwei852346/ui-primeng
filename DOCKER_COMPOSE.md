# Docker Compose部署指南

## 🐳 Docker Compose部署

本项目已配置好Docker Compose，支持单服务部署，便于后续扩展多个服务。

### 基本命令

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f ui-primeng

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 服务配置

```yaml
services:
  ui-primeng:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"          # 主机端口:容器端口
    environment:
      - NGINX_PORT=80    # NGINX监听端口
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro  # 挂载NGINX配置文件
    restart: unless-stopped  #除非手动停止，否则自动重启
    networks:
      - app-network      # 使用自定义网络
```

### 网络配置

```yaml
networks:
  app-network:
    driver: bridge      # 使用桥接网络，便于服务间通信
```

### 端口映射

- **主机端口**: 80
- **容器端口**: 80
- 可根据需要修改主机端口，例如: `- "8080:80"`

### 环境变量

当前支持的环境变量：
- `NGINX_PORT`: NGINX监听端口（默认80）

### 卷挂载

- `./nginx.conf:/etc/nginx/nginx.conf:ro`: 挂载NGINX配置文件，支持热更新

### 扩展多个服务

Docker Compose的优势在于可以轻松扩展多个服务：

```yaml
services:
  ui-primeng:
    # 当前配置...
  
  backend-api:
    image: my-backend:latest
    ports:
      - "3000:3000"
    networks:
      - app-network
  
  database:
    image: postgres:13
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=app_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres-data:
```

### 常用命令

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 仅启动ui-primeng服务
docker-compose up -d ui-primeng

# 查看特定服务日志
docker-compose logs ui-primeng

# 停止所有服务
docker-compose down

# 停止并删除容器、网络、卷
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 进入容器
docker-compose exec ui-primeng sh
```

### 访问应用

- **本地访问**: http://localhost:80
- **网络内访问**: 可通过服务名访问（如 `http://ui-primeng:80`）

### 故障排除

```bash
# 检查服务状态
docker-compose ps

# 查看服务日志
docker-compose logs ui-primeng

# 检查网络
docker-compose network ls

# 重新构建
docker-compose up -d --build ui-primeng
```

### 更新部署

```bash
# 1. 停止服务
docker-compose down

# 2. 修改代码

# 3. 重新构建并启动
docker-compose up -d --build
```

---

**注意**: 确保Docker和Docker Compose已安装，并且端口80可用。Docker Compose文件已配置好，可以直接使用。