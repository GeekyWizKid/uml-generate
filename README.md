# UML图生成器

一个基于AI的UML图生成工具，**采用纯前端架构**，支持多个AI服务商，可以根据用户输入的需求文档生成包含交互图、活动图和状态图的完整UML设计文档。

## 作者

👨‍💻 **GeekyWizKid**  
🐦 Twitter: [@named_Das](https://x.com/named_Das)  
🐱 GitHub: [@GeekyWizKid](https://github.com/GeekyWizKid)

## 功能特性

- 🤖 **多AI支持**: 集成ChatGPT、Claude、DeepSeek、Kimi四个主流AI服务
- 📊 **多种图表**: 自动生成交互图(顺序图)、活动图、状态图
- 🎨 **可视化渲染**: 使用PlantUML在线服务渲染图表
- 💻 **现代界面**: 基于React的响应式纯CSS设计
- ⚡ **流式输出**: 实时显示生成过程，避免超时问题
- 🛡️ **隐私保护**: API密钥存储在本地浏览器，不经过服务器
- 🚀 **纯前端**: 无需部署后端服务器，直接部署到静态托管

## 技术栈

### 前端（纯前端架构）
- React 19 + Vite
- 纯CSS设计系统（无CSS框架）
- 原生Fetch API（直接调用AI服务）
- PlantUML Online Service（图表渲染）

### ~~后端~~ (已移除)
~~原本的Node.js + Express后端已被移除，改为纯前端架构~~

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd uml-generate
```

### 2. 安装前端依赖
```bash
cd client
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 配置API密钥
在浏览器中打开 http://localhost:5173，点击右上角的"API配置"按钮，添加至少一个AI服务的API密钥。

**注意**: API密钥仅存储在您的浏览器本地localStorage中，不会发送到任何服务器。

### 5. 开始使用
输入项目需求描述，选择AI服务商，点击"生成UML图"即可。

## API密钥获取

### OpenAI ChatGPT
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账户
3. 创建API密钥

### Anthropic Claude
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册/登录账户  
3. 创建API密钥

### DeepSeek
1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册/登录账户
3. 创建API密钥

### Kimi (月之暗面)
1. 访问 [Moonshot AI](https://platform.moonshot.cn/)
2. 注册/登录账户
3. 创建API密钥

## 使用说明

1. **配置API密钥**: 点击右上角"API配置"按钮，添加至少一个AI服务的API密钥
2. **选择AI服务商**: 从下拉菜单中选择要使用的AI服务  
3. **选择输出模式**: 
   - ✅ **流式输出**(推荐): 实时显示生成过程，避免超时
   - 普通输出: 等待完整结果
4. **输入项目素材**: 在文本框中详细描述您的：
   - 业务流程或系统功能
   - 关键参与者和角色
   - 主要操作步骤
   - 重要的状态变化
5. **生成UML图**: 点击"生成UML图"按钮
6. **查看结果**: 系统会实时生成：
   - 结构化的分析文档
   - 交互图(顺序图)
   - 活动图  
   - 状态图

## 部署

### 构建生产版本
```bash
cd client
npm run build
```

### 部署到静态托管
将 `client/dist/` 目录上传到任何静态文件托管服务：

- **Vercel**: 零配置部署React应用
- **Netlify**: 拖拽部署或Git集成
- **GitHub Pages**: 免费静态托管
- **阿里云OSS/腾讯云COS**: 云对象存储
- **其他CDN服务**: 任何支持静态文件的托管平台

### 环境变量（可选）
部署时可配置环境变量：
```bash
# PlantUML服务器地址（可选，默认使用官方服务）
VITE_PLANTUML_SERVER=https://www.plantuml.com/plantuml
```

## 输出格式

生成的文档包含六个部分：

1. **核心要点与假设**: 需求提取和建模假设
2. **交互图**: PlantUML格式的顺序图
3. **活动图**: 业务流程活动图
4. **状态图**: 核心实体状态转换图
5. **占位符清单**: 所有占位符的说明
6. **迭代建议**: 优化建议

## 项目结构

```
uml-generate/
├── client/                 # React前端应用 (纯前端架构)
│   ├── src/
│   │   ├── components/     # React组件
│   │   │   ├── ApiKeyModal.jsx      # API密钥配置弹窗
│   │   │   └── PlantUMLRenderer.jsx # UML图表渲染器
│   │   ├── services/       # API服务
│   │   │   └── api.js               # 直接调用AI API服务
│   │   ├── App.jsx         # 主应用组件
│   │   ├── index.css       # 纯CSS样式系统
│   │   └── main.jsx        # 应用入口
│   ├── package.json
│   └── dist/              # 构建产物(部署用)
├── ~~server/~~            # 已移除的后端服务
├── package.json           # 根项目配置
├── CLAUDE.md             # Claude Code项目指引  
└── README.md             # 项目说明
```

## 开发脚本

```bash
# 进入前端目录
cd client

# 开发模式
npm run dev

# 构建生产版本  
npm run build

# 预览生产构建
npm run preview
```

## 故障排除

### 前端无法启动
- 检查Node.js版本 (需要 >= 18)
- 运行 `npm install` 重新安装依赖
- 清除缓存: `rm -rf node_modules/.vite`

### AI服务调用失败
- ✅ 验证API密钥是否有效且格式正确
- ✅ 检查API配额是否充足
- ✅ 确认网络连接正常（可能需要科学上网）
- ✅ 尝试切换到其他AI服务商

### CORS跨域问题
由于浏览器的同源策略，直接调用AI服务API可能遇到CORS问题：
- 某些AI服务不允许浏览器直接调用（如OpenAI）
- 建议使用支持CORS的AI服务或通过浏览器扩展绕过限制
- 生产环境可考虑配置反向代理

### PlantUML图表无法显示  
- 检查网络连接，确保能访问 plantuml.com
- 可以配置私有PlantUML服务器地址

## 技术说明

### 为什么选择纯前端架构？
1. **部署简单**: 无需服务器，直接部署到静态托管
2. **成本更低**: 无服务器运维成本
3. **隐私保护**: API密钥存储在用户本地
4. **扩展性好**: 静态文件可以轻松水平扩展
5. **开发效率**: 减少了前后端协调的复杂度

## 许可证

MIT License

---

**Made with ❤️ by [GeekyWizKid](https://github.com/GeekyWizKid)**  
🐦 Follow me on Twitter: [@named_Das](https://x.com/named_Das)