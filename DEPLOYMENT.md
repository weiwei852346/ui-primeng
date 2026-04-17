# Docker部署指南

## 🐳 Docker部署

本项目已配置好Docker部署，支持Linux x86_64架构。

### 构建和运行

1. **构建Docker镜像**
```bash
./build.sh
```

2. **运行容器**
```bash
docker run -d -p 80:80 --name ui-primeng ui-primeng:latest
```

### 常用命令

```bash
# 查看运行状态
docker ps

# 停止服务
docker stop ui-primeng

# 启动服务
docker start ui-primeng

# 删除容器
docker rm ui-primeng

# 删除镜像
docker rmi ui-primeng:latest
```

### 端口映射

- **主机端口**: 80
- **容器端口**: 80

### 环境变量

当前部署使用默认配置，如需自定义：
1. 修改 `nginx.conf` 配置文件
2. 重新构建镜像

### 构建镜像说明

- **基础镜像**: Node.js 18-alpine (构建阶段)
- **生产镜像**: NGINX:alpine (仅12MB)
- **多阶段构建**: 减小最终镜像大小
- **优化**: Gzip压缩、缓存控制、路由处理

### 性能优化

- **Gzip压缩**: 启用HTTP压缩
- **缓存控制**: 静态资源长期缓存
- **路由处理**: 支持Angular路由
- **错误处理**: 404错误重定向到index.html

### 故障排除

如果遇到问题：

1. 检查Docker日志
```bash
docker logs ui-primeng
```

2. 检查NGINX配置
```bash
docker exec ui-primeng cat /etc/nginx/nginx.conf
```

3. 重新构建镜像
```bash
./build.sh
```

### 更新部署

1. 修改代码
2. 重新构建镜像
3. 重启容器

```bash
docker stop ui-primeng && docker rm ui-primeng
./build.sh
docker run -d -p 80:80 --name ui-primeng ui-primeng:latest
```

### 监控

- 访问 `http://localhost:80` 查看应用
- 使用 `docker stats` 查看资源使用情况

---

**注意**: 确保服务器已安装Docker，并且端口80可用。