import { track } from '@vercel/analytics';

// AI服务配置
const AI_PROVIDERS = {
  chatgpt: {
    url: 'https://api.openai.com/v1/chat/completions',
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    keyName: 'openai',
    supportsStream: true
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    getHeaders: (apiKey) => ({
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      stream
    }),
    extractResponse: (data) => data.content[0].text,
    keyName: 'claude',
    supportsStream: true
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    keyName: 'deepseek',
    supportsStream: true
  },
  kimi: {
    url: 'https://api.moonshot.cn/v1/chat/completions',
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'moonshot-v1-32k',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    keyName: 'kimi',
    supportsStream: true
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    getHeaders: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000
      }
    }),
    extractResponse: (data) => data.candidates[0].content.parts[0].text,
    keyName: 'gemini',
    supportsStream: false,
    customUrl: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
  },
  qwen: {
    url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'qwen-plus',
      input: {
        messages: [{ role: 'user', content: prompt }]
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 4000
      }
    }),
    extractResponse: (data) => data.output.choices[0].message.content,
    keyName: 'qwen',
    supportsStream: false
  },
  custom: {
    url: '', // 将被自定义URL覆盖
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }),
    formatRequest: (prompt, stream = false) => ({
      model: 'custom-model', // 将被自定义模型覆盖
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    keyName: 'custom',
    supportsStream: true
  }
};

// 构建UML生成提示
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

// 获取保存的API密钥和模型配置
const getStoredApiKeys = () => {
  const apiKeys = {};
  const providers = ['openai', 'claude', 'deepseek', 'kimi', 'gemini', 'qwen', 'custom'];
  
  providers.forEach(provider => {
    const key = localStorage.getItem(`api_key_${provider}`);
    if (key && key.trim()) {
      apiKeys[provider] = key.trim();
    }
  });
  
  return apiKeys;
};

const getStoredModels = () => {
  const models = {};
  const providers = ['openai', 'claude', 'deepseek', 'kimi', 'gemini', 'qwen', 'custom'];
  
  providers.forEach(provider => {
    const model = localStorage.getItem(`model_${provider}`);
    if (model) {
      models[provider] = model;
    }
  });
  
  return models;
};

export const generateUML = async (materials, provider = 'chatgpt') => {
  try {
    const apiKeys = getStoredApiKeys();
    const models = getStoredModels();
    const aiProvider = AI_PROVIDERS[provider];
    
    if (!aiProvider) {
      throw new Error(`不支持的AI提供商: ${provider}`);
    }
    
    const requiredKey = aiProvider.keyName;
    const apiKey = apiKeys[requiredKey];
    
    if (!apiKey) {
      throw new Error(`缺少${provider.toUpperCase()}的API密钥`);
    }
    
    const prompt = buildUMLPrompt(materials);
    
    // 使用用户自定义模型或默认模型
    let selectedModel = models[provider] || aiProvider.formatRequest('', false).model;
    let requestUrl = aiProvider.customUrl ? aiProvider.customUrl(apiKey) : aiProvider.url;
    
    // 处理自定义提供商的URL和模型
    if (provider === 'custom') {
      const customUrl = localStorage.getItem('custom_url_custom');
      const customModel = localStorage.getItem('custom_model_custom');
      
      if (customUrl && customUrl.trim()) {
        requestUrl = customUrl.trim();
      }
      
      if (customModel && customModel.trim()) {
        selectedModel = customModel.trim();
      }
    }
    
    const requestData = {
      ...aiProvider.formatRequest(prompt, false),
      model: selectedModel
    };
    
    const headers = aiProvider.getHeaders(apiKey);
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(300000) // 5分钟超时
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const generatedContent = aiProvider.extractResponse(data);
    
    // 追踪UML生成成功事件
    try {
      track('uml_generated', {
        provider,
        model: selectedModel,
        content_length: materials.length,
        response_length: generatedContent.length
      });
    } catch (trackError) {
      // 忽略追踪错误，不影响主要功能
      console.log('Analytics tracking failed:', trackError);
    }
    
    return {
      success: true,
      provider,
      content: generatedContent,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    // 追踪UML生成失败事件
    try {
      track('uml_generation_failed', {
        provider,
        error: error.message
      });
    } catch (trackError) {
      console.log('Analytics tracking failed:', trackError);
    }
    
    throw new Error(error.message || '生成UML图时发生错误');
  }
};

export const generateUMLStream = async (materials, provider = 'chatgpt', onProgress) => {
  try {
    const apiKeys = getStoredApiKeys();
    const models = getStoredModels();
    const aiProvider = AI_PROVIDERS[provider];
    
    if (!aiProvider) {
      throw new Error(`不支持的AI提供商: ${provider}`);
    }
    
    const requiredKey = aiProvider.keyName;
    const apiKey = apiKeys[requiredKey];
    
    if (!apiKey) {
      throw new Error(`缺少${provider.toUpperCase()}的API密钥`);
    }
    
    const prompt = buildUMLPrompt(materials);
    
    // 使用用户自定义模型或默认模型
    let selectedModel = models[provider] || aiProvider.formatRequest('', true).model;
    let requestUrl = aiProvider.customUrl ? aiProvider.customUrl(apiKey) : aiProvider.url;
    
    // 处理自定义提供商的URL和模型
    if (provider === 'custom') {
      const customUrl = localStorage.getItem('custom_url_custom');
      const customModel = localStorage.getItem('custom_model_custom');
      
      if (customUrl && customUrl.trim()) {
        requestUrl = customUrl.trim();
      }
      
      if (customModel && customModel.trim()) {
        selectedModel = customModel.trim();
      }
    }
    
    const requestData = {
      ...aiProvider.formatRequest(prompt, true), // 启用流式
      model: selectedModel
    };
    
    const headers = aiProvider.getHeaders(apiKey);
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(300000) // 5分钟超时
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        try {
          let content = '';
          
          if (provider === 'chatgpt' || provider === 'deepseek' || provider === 'kimi') {
            // OpenAI compatible format
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
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
                break;
              }
            }
          }
          
          if (content) {
            fullContent += content;
            
            // 调用进度回调
            if (onProgress) {
              onProgress(fullContent);
            }
          }
        } catch (parseError) {
          // 忽略解析错误，继续处理下一行
          continue;
        }
      }
    }
    
    return {
      success: true,
      provider,
      content: fullContent,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(error.message || '生成UML图时发生错误');
  }
};

export const checkHealth = async () => {
  // 纯前端版本不需要服务器健康检查
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    supportedProviders: Object.keys(AI_PROVIDERS)
  };
};

// 检查配置状态
export const checkApiKeyStatus = () => {
  const apiKeys = getStoredApiKeys();
  const providers = ['openai', 'claude', 'deepseek', 'kimi', 'gemini', 'qwen', 'custom'];
  
  return {
    configured: Object.keys(apiKeys).length,
    total: providers.length,
    availableProviders: Object.keys(apiKeys),
    missingProviders: providers.filter(p => !apiKeys[p])
  };
};