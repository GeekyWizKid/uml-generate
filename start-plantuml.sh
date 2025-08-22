#!/bin/bash
# 启动本地PlantUML Docker服务器

echo "启动本地PlantUML服务器..."
docker run -d --rm -p 8080:8080 plantuml/plantuml-server:jetty

echo "PlantUML服务器已启动在 http://localhost:8080"
echo "现在可以刷新网页，系统会优先使用本地服务器进行渲染"
echo ""
echo "要停止服务器，请运行:"
echo "docker stop \$(docker ps -q --filter ancestor=plantuml/plantuml-server:jetty)"