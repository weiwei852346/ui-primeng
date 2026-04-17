#!/bin/bash

# Angular应用Docker构建脚本

set -e

echo "🚀 开始构建Angular应用的Docker镜像..."

# 检查是否安装了Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 构建Docker镜像
echo "📦 构建Docker镜像..."
docker build -t ui-primeng:latest .

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功！"
    echo ""
    echo "🐳 可用命令："
    echo "  docker run -d -p 80:80 --name ui-primeng ui-primeng:latest"
    echo "  docker run -p 80:80 ui-primeng:latest"
    echo ""
    echo "📖 使用说明："
    echo "  - 访问 http://localhost:80 查看应用"
    echo "  - 使用 docker ps 查看运行状态"
    echo "  - 使用 docker stop ui-primeng 停止服务"
    echo "  - 使用 docker rm ui-primeng 删除容器"
else
    echo "❌ Docker镜像构建失败"
    exit 1
fi

echo "🎉 构建完成！"