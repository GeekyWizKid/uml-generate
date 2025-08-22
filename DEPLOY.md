# Vercel 部署指南

## 部署步骤

### 1. 准备阶段
确保你有以下 AI API 密钥：
- OpenAI API Key
- Claude API Key  
- DeepSeek API Key
- Kimi API Key

### 2. 部署到 Vercel

1. **连接 GitHub 仓库**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入你的 GitHub 仓库

2. **配置环境变量**
   在 Vercel Dashboard 中添加以下环境变量：
   ```
   OPENAI_API_KEY=your_openai_api_key
   CLAUDE_API_KEY=your_claude_api_key  
   DEEPSEEK_API_KEY=your_deepseek_api_key
   KIMI_API_KEY=your_kimi_api_key
   NODE_ENV=production
   ```

3. **部署设置**
   - Framework Preset: 选择 "Other"
   - Build Command: `npm run vercel-build` (已自动配置)
   - Output Directory: `client/dist` (已自动配置)
   - Install Command: `npm run install:all` (已自动配置)

### 3. 部署后配置

部署完成后，需要更新环境变量中的 `FRONTEND_URL`：
```
FRONTEND_URL=https://your-app-name.vercel.app
```

## PlantUML 渲染

项目会自动使用外部 PlantUML 服务器：
1. plantuml-server.kkeisuke.dev (主要)
2. plantuml.com (备用)

无需本地 Docker，在 Vercel 上完全可用。

## 验证部署

访问你的 Vercel 应用 URL，确保：
- ✅ 前端页面正常加载
- ✅ AI 对话功能正常
- ✅ PlantUML 图形渲染正常

## 注意事项

- Vercel Functions 有 30 秒超时限制（已配置）
- 所有 API 请求路径为 `/api/*`
- 生产环境自动跳过本地 Docker PlantUML 服务器