#!/bin/bash

# PlantUML服务器管理脚本

case "$1" in
  start)
    echo "启动PlantUML服务器..."
    docker-compose up -d plantuml-server
    echo "等待服务器启动..."
    sleep 10
    echo "检查服务器状态..."
    curl -f http://localhost:8080/ > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ PlantUML服务器已成功启动在 http://localhost:8080"
    else
      echo "❌ PlantUML服务器启动失败"
      docker-compose logs plantuml-server
    fi
    ;;
  
  stop)
    echo "停止PlantUML服务器..."
    docker-compose down
    echo "✅ PlantUML服务器已停止"
    ;;
  
  restart)
    echo "重启PlantUML服务器..."
    docker-compose restart plantuml-server
    echo "✅ PlantUML服务器已重启"
    ;;
  
  status)
    echo "检查PlantUML服务器状态..."
    docker-compose ps plantuml-server
    curl -f http://localhost:8080/ > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ PlantUML服务器正在运行"
    else
      echo "❌ PlantUML服务器未运行"
    fi
    ;;
  
  logs)
    echo "显示PlantUML服务器日志..."
    docker-compose logs plantuml-server
    ;;
  
  test)
    echo "测试PlantUML服务器..."
    curl -X POST http://localhost:8080/svg \
      -H "Content-Type: text/plain" \
      -d "@startuml
Alice -> Bob: Hello
@enduml"
    ;;
  
  *)
    echo "用法: $0 {start|stop|restart|status|logs|test}"
    echo ""
    echo "命令说明:"
    echo "  start   - 启动PlantUML服务器"
    echo "  stop    - 停止PlantUML服务器"
    echo "  restart - 重启PlantUML服务器"
    echo "  status  - 检查服务器状态"
    echo "  logs    - 查看服务器日志"
    echo "  test    - 测试服务器功能"
    exit 1
    ;;
esac