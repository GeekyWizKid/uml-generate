import React, { useState, useEffect } from 'react';
import { generateUML, generateUMLStream, checkHealth, checkApiKeyStatus } from './services/api';
import { PlantUMLRenderer } from './components/PlantUMLRenderer';
import { ApiKeyModal } from './components/ApiKeyModal';

const AI_PROVIDERS = [
  { id: 'chatgpt', name: 'ChatGPT (OpenAI)', description: 'GPT-4 模型' },
  { id: 'claude', name: 'Claude (Anthropic)', description: 'Claude-3 Sonnet 模型' },
  { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek Chat 模型' },
  { id: 'kimi', name: 'Kimi (月之暗面)', description: 'Moonshot V1 模型' }
];

function App() {
  const [materials, setMaterials] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('chatgpt');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState({ 
    configured: 0, 
    total: 4, 
    availableProviders: [],
    missingProviders: ['openai', 'claude', 'deepseek', 'kimi']
  });

  useEffect(() => {
    checkServerHealth();
    updateApiKeyStatus();
  }, []);

  const updateApiKeyStatus = () => {
    const status = checkApiKeyStatus();
    setApiKeyStatus(status);
    
    if (status.availableProviders && status.availableProviders.length > 0 && !status.availableProviders.includes(selectedProvider)) {
      const providerMap = {
        'openai': 'chatgpt',
        'claude': 'claude', 
        'deepseek': 'deepseek',
        'kimi': 'kimi'
      };
      
      const availableProvider = status.availableProviders.find(p => providerMap[p]);
      if (availableProvider) {
        setSelectedProvider(providerMap[availableProvider]);
      }
    }
  };

  const checkServerHealth = async () => {
    try {
      await checkHealth();
      setServerStatus('connected');
    } catch (error) {
      setServerStatus('error');
      setError('无法连接到服务器，请确保后端服务正在运行');
    }
  };

  const handleApiKeySave = () => {
    updateApiKeyStatus();
  };

  const getProviderKeyStatus = (providerId) => {
    const keyMap = {
      'chatgpt': 'openai',
      'claude': 'claude',
      'deepseek': 'deepseek', 
      'kimi': 'kimi'
    };
    
    return apiKeyStatus.availableProviders && apiKeyStatus.availableProviders.includes(keyMap[providerId]);
  };

  const handleGenerate = async () => {
    if (!materials.trim()) {
      setError('请输入素材内容');
      return;
    }

    if (!getProviderKeyStatus(selectedProvider)) {
      setError(`请先配置${AI_PROVIDERS.find(p => p.id === selectedProvider)?.name}的API密钥`);
      setShowApiKeyModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setStreamingContent('');

    try {
      if (useStreaming) {
        // 使用流式输出
        const response = await generateUMLStream(
          materials, 
          selectedProvider, 
          (content) => {
            setStreamingContent(content);
          }
        );
        setResult(response);
      } else {
        // 使用普通输出
        const response = await generateUML(materials, selectedProvider);
        setResult(response);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
    }
  };

  const handleClear = () => {
    setMaterials('');
    setResult(null);
    setStreamingContent('');
    setError(null);
  };

  const formatTextContent = (content) => {
    if (!content) return '';
    
    return content.split('\n').map((line, index) => {
      // 对于PlantUML相关的行，保持原样不过滤
      if (line.startsWith('@startuml') || line.startsWith('@enduml') || line.includes('->') || line.includes('participant')) {
        return (
          <div key={index}>
            {line || <br />}
          </div>
        );
      }
      
      // 对于普通文本行，如果是PlantUML标签则不过滤
      return (
        <div key={index}>
          {line || <br />}
        </div>
      );
    });
  };

  const getCurrentContent = () => {
    if (isGenerating && streamingContent) {
      return streamingContent;
    }
    return result?.content || '';
  };

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">UML图生成器</h1>
            <div className="header-actions">
              {/* 流式输出切换 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                />
                流式输出
              </label>

              {/* API配置按钮 */}
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="api-config-btn"
              >
                <span>⚙️</span>
                <span>API配置</span>
                <span className="api-badge">
                  {apiKeyStatus.configured}/{apiKeyStatus.total}
                </span>
              </button>
              
              {/* 服务器状态 */}
              <div className="status-indicator">
                <div className={`status-dot ${
                  serverStatus === 'connected' ? 'status-connected' : 
                  serverStatus === 'error' ? 'status-error' : 'status-checking'
                }`}></div>
                <span>
                  {serverStatus === 'connected' ? '已连接' : 
                   serverStatus === 'error' ? '连接失败' : '连接中...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="main-content">
          {/* 输入区域 */}
          <div>
            <div className="card">
              <h2 className="card-title">输入素材</h2>
              
              {/* AI服务商选择 */}
              <div className="form-group">
                <label className="form-label">选择AI服务商</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="form-select"
                >
                  {AI_PROVIDERS.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {getProviderKeyStatus(provider.id) ? '✓ ' : '⚠ '} 
                      {provider.name} - {provider.description}
                    </option>
                  ))}
                </select>
                {!getProviderKeyStatus(selectedProvider) && (
                  <p className="provider-warning">
                    此服务需要配置API密钥
                  </p>
                )}
              </div>

              {/* 素材输入 */}
              <div className="form-group">
                <label className="form-label">项目需求或功能描述</label>
                <textarea
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="请详细描述您的项目需求、功能流程、参与者角色等信息..."
                  className="form-textarea"
                />
                <p className="form-hint">
                  提供越详细的信息，生成的UML图越准确
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="btn-group">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || serverStatus !== 'connected' || apiKeyStatus.configured === 0}
                  className="btn btn-primary"
                >
                  {isGenerating ? (useStreaming ? '流式生成中...' : '生成中...') : '生成UML图'}
                </button>
                <button
                  onClick={handleClear}
                  className="btn btn-secondary"
                >
                  清空
                </button>
              </div>
            </div>

            {/* 帮助区域 */}
            <div className={`help-section ${apiKeyStatus.configured === 0 ? 'help-warning' : 'help-info'}`}>
              <div className="help-title">
                {apiKeyStatus.configured === 0 ? '⚠️ 配置提醒' : '使用说明'}
              </div>
              {apiKeyStatus.configured === 0 ? (
                <div>
                  <p>请先点击右上角的"API配置"按钮配置至少一个AI服务的API密钥：</p>
                  <ul className="help-list">
                    <li>ChatGPT: 需要OpenAI API密钥</li>
                    <li>Claude: 需要Anthropic API密钥</li>
                    <li>DeepSeek: 需要DeepSeek API密钥</li>
                    <li>Kimi: 需要月之暗面API密钥</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <ul className="help-list">
                    <li>描述您的业务流程、系统功能或用户交互场景</li>
                    <li>包含关键参与者（用户、系统、外部服务等）</li>
                    <li>说明主要的操作步骤和决策点</li>
                    <li>提及重要的状态变化和错误处理</li>
                  </ul>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    💡 推荐使用流式输出，可以实时看到生成进度，避免超时问题
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 输出区域 */}
          <div>
            {/* 错误显示 */}
            {error && (
              <div className="error-alert">
                <div className="error-icon">⚠️</div>
                <div className="error-content">
                  <div className="error-title">生成失败</div>
                  <div className="error-message">{error}</div>
                </div>
              </div>
            )}

            {/* 加载状态/流式输出 */}
            {isGenerating && (
              <div className="card">
                {useStreaming ? (
                  <div className="result-content">
                    <div className="result-section">
                      <h3 className="section-title">
                        🔄 实时生成中... 
                        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'normal' }}>
                          ({streamingContent.length} 字符)
                        </span>
                      </h3>
                      <div className="text-content streaming-content">
                        {formatTextContent(streamingContent)}
                        <div className="streaming-cursor">|</div>
                      </div>
                    </div>
                    {streamingContent && (
                      <div className="result-section">
                        <h3 className="section-title">实时UML图表</h3>
                        <PlantUMLRenderer content={streamingContent} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="loading-card">
                    <div className="spinner"></div>
                    <span>正在生成UML图...</span>
                  </div>
                )}
              </div>
            )}

            {/* 结果显示 */}
            {result && !isGenerating && (
              <div className="card result-card">
                <div className="result-header">
                  <h2 className="card-title">生成结果</h2>
                  <div className="result-meta">
                    <span>使用：{AI_PROVIDERS.find(p => p.id === result.provider)?.name}</span>
                    <span>•</span>
                    <span>{new Date(result.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="result-content">
                  {/* 文本内容 */}
                  <div className="result-section">
                    <h3 className="section-title">分析文档</h3>
                    <div className="text-content">
                      {formatTextContent(result.content)}
                    </div>
                  </div>

                  {/* UML图表 */}
                  <div className="result-section">
                    <h3 className="section-title">UML图表</h3>
                    <PlantUMLRenderer content={result.content} />
                  </div>
                </div>
              </div>
            )}

            {/* 空状态 */}
            {!result && !isGenerating && !error && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3 className="empty-title">开始生成UML图</h3>
                  <p className="empty-description">在左侧输入您的项目素材，点击生成按钮开始</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API密钥配置模态框 */}
      <ApiKeyModal 
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
      />
    </div>
  );
}

export default App;