# UML 图表生成工具 - 本地PlantUML服务器版本

本项目使用官方的PlantUML服务器Docker镜像提供本地图表渲染服务，避免了外部依赖和CORS问题。

## 快速开始

### 1. 启动PlantUML服务器
```bash
# 使用我们提供的管理脚本
./plantuml-server.sh start

# 或者手动启动
docker-compose up -d plantuml-server
```

### 2. 启动应用
```bash
# 启动完整应用（前端+后端）
npm run dev
```

### 3. 访问应用
- 前端应用: http://localhost:5173
- 后端API: http://localhost:3001
- PlantUML服务器: http://localhost:8080

## PlantUML服务器管理

使用提供的管理脚本 `plantuml-server.sh`：

```bash
# 启动服务器
./plantuml-server.sh start

# 停止服务器
./plantuml-server.sh stop

# 重启服务器
./plantuml-server.sh restart

# 查看状态
./plantuml-server.sh status

# 查看日志
./plantuml-server.sh logs

# 测试服务器
./plantuml-server.sh test
```

## 技术架构

### 渲染流程
1. 用户在前端输入材料并生成UML
2. 前端发送PlantUML代码到本地API (`/api/plantuml/render`)
3. 后端尝试多个PlantUML服务器（优先本地）:
   - **本地Docker服务器** (http://localhost:8080) - 主要选择
   - 外部备选服务器 (作为fallback)
4. 返回SVG内容直接在页面显示

### 优势
- ✅ 无CORS跨域问题
- ✅ 本地渲染，速度快
- ✅ 不依赖外部服务稳定性
- ✅ 支持离线使用
- ✅ 多服务器容错机制

## Docker配置

项目包含 `docker-compose.yml` 配置：

- **PlantUML服务器**: 端口8080，基于官方 `plantuml/plantuml-server:jetty` 镜像
- **健康检查**: 自动监控服务器状态
- **资源限制**: PLANTUML_LIMIT_SIZE=4096

## 故障排除

### PlantUML服务器未启动
```bash
# 检查服务器状态
./plantuml-server.sh status

# 查看日志
./plantuml-server.sh logs

# 重新启动
./plantuml-server.sh restart
```

### 渲染失败
系统会自动尝试备选服务器。如果所有服务器都失败，前端会显示：
1. 错误提示
2. 外部链接作为备选方案
3. PlantUML代码复制功能

## 开发说明

- **前端**: React + Vite，PlantUML渲染组件位于 `client/src/components/PlantUMLRenderer.jsx`
- **后端**: Express.js，PlantUML API位于 `server/index.js` 的 `/api/plantuml/render` 端点
- **Docker**: 官方PlantUML服务器，配置文件 `docker-compose.yml`