require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const plantumlEncoder = require('plantuml-encoder');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const createAiProviders = (apiKeys = {}) => ({
  chatgpt: {
    url: 'https://api.openai.com/v1/chat/completions',
    getHeaders: () => ({
      'Authorization': `Bearer ${apiKeys.openai || process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    requiresKey: 'openai',
    supportsStream: true
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    getHeaders: () => ({
      'x-api-key': apiKeys.claude || process.env.CLAUDE_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      stream
    }),
    extractResponse: (data) => data.content[0].text,
    requiresKey: 'claude',
    supportsStream: true
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    getHeaders: () => ({
      'Authorization': `Bearer ${apiKeys.deepseek || process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    requiresKey: 'deepseek',
    supportsStream: true
  },
  kimi: {
    url: 'https://api.moonshot.cn/v1/chat/completions',
    getHeaders: () => ({
      'Authorization': `Bearer ${apiKeys.kimi || process.env.KIMI_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    requiresKey: 'kimi',
    supportsStream: true
  }
});

const buildUMLPrompt = (materials) => {
  return `角色与职责
你是：资深软件架构师 + UML 建模专家。
目标：基于用户提供的素材，输出精简设计文档，包含必要的假设说明与 3 类 PlantUML 图：交互图(顺序图)、活动图、状态图。保持结构清晰但不过度细化。

触发逻辑

用户出现"生成 / 建模 / 输出 UML / 生成图"类似意图并提供素材 => 按精简结构输出。
用户只给出补充或改动 => 仅增量更新受影响的图与假设。
用户未提供任何有效素材 => 提示需要：核心参与者、关键动作/流程、对象生命周期要点；若仍坚持生成 => 用 TODO 占位。

输出整体结构（完整模式）

第一部分：核心要点与假设

要点提取（保持原意，条目式）
不确定/缺失项
建模假设（使用占位符 <...>）
关键实体/参与者一览（名称 -> 简述）

第二部分：交互图（顺序图）

体现主成功场景；若有关键失败或异常，使用 alt/opt。
若素材不足，保留参与者框架 + TODO 注释。
使用 @startuml / @enduml，不添加 Markdown 代码围栏。

第三部分：活动图

覆盖主流程 + 至少 1 个条件/分支（若存在）。
简化：避免过多技术实现细节；聚焦业务/流程。

第四部分：状态图

针对最核心实体（若未指明，挑选主对象，如 User / Order / <CoreEntity>）
展示生命周期关键状态及事件触发。
若无法确定核心实体，列出备选并任选其一，附 note 说明。

第五部分：占位符清单

列出全部 <PLACEHOLDER>：含义 / 是否必填 / 替换示例。

第六部分：迭代建议（简短）

指出用户可补充哪些信息以提升后续精度（不超过 6 条）。

精简规范

仅输出上述 6 部分；用户未要求不得添加多余章节（如类图、组件图、返回 JSON 结构等）。
交互图命名统一使用：actor / boundary / control / entity（可选）或直接 participant。
不虚构复杂层（缓存、消息队列、微服务）除非用户明示或素材明显暗示。
占位符格式统一 <PascalCase>，示例：<UserId>, <DataPath>, <ErrorCode>。
避免真实敏感数据；示例 ID 用 USR_001, ORD_001。
图中涉及假设内容用 note 或 ' 注释标明。

用户提供的素材：
${materials}

请根据以上素材生成 UML 图。`;
};

app.post('/api/generate-uml-stream', async (req, res) => {
  try {
    const { materials, provider = 'chatgpt', apiKeys = {} } = req.body;
    
    if (!materials || materials.trim().length === 0) {
      return res.status(400).json({ 
        error: '请提供素材内容',
        message: '需要提供素材才能生成UML图' 
      });
    }

    const aiProviders = createAiProviders(apiKeys);
    const aiProvider = aiProviders[provider];
    
    if (!aiProvider) {
      return res.status(400).json({ 
        error: '不支持的AI提供商',
        supportedProviders: Object.keys(aiProviders)
      });
    }

    // 检查API密钥是否提供
    const requiredKey = aiProvider.requiresKey;
    const hasApiKey = apiKeys[requiredKey] || process.env[requiredKey.toUpperCase() + '_API_KEY'];
    
    if (!hasApiKey) {
      return res.status(400).json({
        error: `缺少${provider.toUpperCase()}的API密钥`,
        message: `请在配置中提供${provider.toUpperCase()}的API密钥`,
        missingKey: requiredKey
      });
    }

    const prompt = buildUMLPrompt(materials);
    const requestData = aiProvider.formatRequest(prompt, true); // 启用流式
    const headers = aiProvider.getHeaders();

    console.log(`Using AI provider: ${provider} (streaming)`);

    // 设置SSE头部
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    try {
      const response = await axios({
        method: 'POST',
        url: aiProvider.url,
        data: requestData,
        headers,
        responseType: 'stream',
        timeout: 300000 // 5分钟超时
      });

      let fullContent = '';

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            // 不同提供商的流式格式处理
            let content = '';
            
            if (provider === 'chatgpt' || provider === 'deepseek' || provider === 'kimi') {
              // OpenAI compatible format
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  res.write('\n[DONE]\n');
                  return;
                }
                
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  content = parsed.choices[0].delta.content;
                }
              }
            } else if (provider === 'claude') {
              // Claude streaming format
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
                  content = parsed.delta.text;
                } else if (parsed.type === 'message_stop') {
                  res.write('\n[DONE]\n');
                  return;
                }
              }
            }

            if (content) {
              fullContent += content;
              res.write(content);
            }
          } catch (parseError) {
            // 忽略解析错误，继续处理下一行
            continue;
          }
        }
      });

      response.data.on('end', () => {
        console.log('Stream completed');
        res.write('\n[DONE]\n');
        res.end();
      });

      response.data.on('error', (error) => {
        console.error('Stream error:', error);
        res.write(`\n[ERROR]: ${error.message}\n`);
        res.end();
      });

    } catch (streamError) {
      console.error('Stream request error:', streamError);
      res.write(`\n[ERROR]: ${streamError.message}\n`);
      res.end();
    }

  } catch (error) {
    console.error('Error in stream endpoint:', error.response?.data || error.message);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: '生成UML图时发生错误',
        details: error.response?.data || error.message
      });
    } else {
      res.write(`\n[ERROR]: ${error.message}\n`);
      res.end();
    }
  }
});

app.post('/api/generate-uml', async (req, res) => {
  try {
    const { materials, provider = 'chatgpt', apiKeys = {} } = req.body;
    
    if (!materials || materials.trim().length === 0) {
      return res.status(400).json({ 
        error: '请提供素材内容',
        message: '需要提供素材才能生成UML图' 
      });
    }

    const aiProviders = createAiProviders(apiKeys);
    const aiProvider = aiProviders[provider];
    
    if (!aiProvider) {
      return res.status(400).json({ 
        error: '不支持的AI提供商',
        supportedProviders: Object.keys(aiProviders)
      });
    }

    // 检查API密钥是否提供
    const requiredKey = aiProvider.requiresKey;
    const hasApiKey = apiKeys[requiredKey] || process.env[requiredKey.toUpperCase() + '_API_KEY'];
    
    if (!hasApiKey) {
      return res.status(400).json({
        error: `缺少${provider.toUpperCase()}的API密钥`,
        message: `请在配置中提供${provider.toUpperCase()}的API密钥`,
        missingKey: requiredKey
      });
    }

    const prompt = buildUMLPrompt(materials);
    const requestData = aiProvider.formatRequest(prompt, false); // 非流式
    const headers = aiProvider.getHeaders();

    console.log(`Using AI provider: ${provider}`);

    const response = await axios.post(aiProvider.url, requestData, {
      headers,
      timeout: 300000 // 增加到5分钟
    });

    const generatedContent = aiProvider.extractResponse(response.data);

    res.json({
      success: true,
      provider,
      content: generatedContent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating UML:', error.response?.data || error.message);
    
    let errorMessage = '生成UML图时发生错误';
    let statusCode = 500;

    if (error.response) {
      const { status, data } = error.response;
      statusCode = status;
      
      if (status === 401) {
        errorMessage = 'API密钥无效或未配置';
      } else if (status === 429) {
        errorMessage = 'API调用频率超限，请稍后重试';
      } else if (data?.error?.message) {
        errorMessage = data.error.message;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请重试';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || error.message
    });
  }
});

// PlantUML渲染API端点
app.post('/api/plantuml/render', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: '缺少PlantUML代码',
        message: '请提供有效的PlantUML代码'
      });
    }

    // 编码PlantUML代码
    const encoded = plantumlEncoder.encode(code);
    if (!encoded) {
      return res.status(400).json({
        error: 'PlantUML编码失败',
        message: '无法编码提供的PlantUML代码'
      });
    }

    // 使用本地PlantUML服务器和备选服务器
    const plantUMLServers = [
      `http://localhost:8080/svg/${encoded}`, // 本地Docker PlantUML服务器
      `https://plantuml-server.kkeisuke.dev/svg/${encoded}`, // 备选服务器
      `https://www.plantuml.com/plantuml/svg/${encoded}` // 官方服务器（作为最后备选）
    ];
    
    let lastError = null;
    
    for (const plantUMLUrl of plantUMLServers) {
      try {
        console.log(`尝试PlantUML服务器: ${plantUMLUrl}`);
        
        const response = await axios.get(plantUMLUrl, {
          timeout: 8000,
          headers: {
            'User-Agent': 'UML-Generator/1.0',
            'Accept': 'image/svg+xml,*/*'
          }
        });

        if (response.status === 200 && response.data) {
          // 设置适当的响应头
          res.set({
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600', // 缓存1小时
          });

          // 返回SVG内容
          return res.send(response.data);
        }
      } catch (serverError) {
        console.log(`服务器 ${plantUMLUrl} 失败:`, serverError.message);
        lastError = serverError;
        continue; // 尝试下一个服务器
      }
    }
    
    // 如果所有服务器都失败了，抛出最后一个错误
    throw lastError || new Error('所有PlantUML服务器都不可用');

  } catch (error) {
    console.error('PlantUML渲染错误:', error.message);
    
    let errorMessage = 'PlantUML渲染失败';
    let statusCode = 500;

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'PlantUML服务器响应超时';
      statusCode = 504;
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = `PlantUML服务器错误: ${error.response.status}`;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    supportedProviders: ['chatgpt', 'claude', 'deepseek', 'kimi']
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supported AI providers: chatgpt, claude, deepseek, kimi`);
});