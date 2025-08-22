#!/bin/bash
# 停止本地PlantUML Docker服务器

echo "停止本地PlantUML服务器..."
docker stop $(docker ps -q --filter ancestor=plantuml/plantuml-server:jetty)

echo "PlantUML服务器已停止"