import React, { useState, useEffect } from 'react';

const API_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI ChatGPT', 
    key: 'OPENAI_API_KEY',
    placeholder: 'sk-...',
    description: '用于GPT-4o模型的API密钥',
    defaultModel: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  { 
    id: 'claude', 
    name: 'Anthropic Claude', 
    key: 'CLAUDE_API_KEY',
    placeholder: 'sk-ant-...',
    description: '用于Claude-3.5-Sonnet模型的API密钥',
    defaultModel: 'claude-3-5-sonnet-20241022',
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    key: 'DEEPSEEK_API_KEY',
    placeholder: 'sk-...',
    description: '用于DeepSeek Chat模型的API密钥',
    defaultModel: 'deepseek-chat',
    availableModels: ['deepseek-chat', 'deepseek-coder']
  },
  { 
    id: 'kimi', 
    name: 'Kimi (月之暗面)', 
    key: 'KIMI_API_KEY',
    placeholder: 'sk-...',
    description: '用于Moonshot模型的API密钥',
    defaultModel: 'moonshot-v1-32k',
    availableModels: ['moonshot-v1-32k', 'moonshot-v1-8k', 'moonshot-v1-128k']
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini', 
    key: 'GEMINI_API_KEY',
    placeholder: 'AI...',
    description: '用于Gemini 1.5 Pro模型的API密钥',
    defaultModel: 'gemini-1.5-pro',
    availableModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
  },
  { 
    id: 'qwen', 
    name: '通义千问 (阿里云)', 
    key: 'QWEN_API_KEY',
    placeholder: 'sk-...',
    description: '用于通义千问模型的API密钥',
    defaultModel: 'qwen-plus',
    availableModels: ['qwen-plus', 'qwen-turbo', 'qwen-max']
  }
];

export const ApiKeyModal = ({ isOpen, onClose, onSave }) => {
  const [apiKeys, setApiKeys] = useState({});
  const [models, setModels] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 从localStorage加载已保存的API密钥和模型配置
      const savedKeys = {};
      const savedModels = {};
      API_PROVIDERS.forEach(provider => {
        const savedKey = localStorage.getItem(`api_key_${provider.id}`);
        const savedModel = localStorage.getItem(`model_${provider.id}`);
        if (savedKey) {
          savedKeys[provider.id] = savedKey;
        }
        savedModels[provider.id] = savedModel || provider.defaultModel;
      });
      setApiKeys(savedKeys);
      setModels(savedModels);
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleKeyChange = (providerId, value) => {
    setApiKeys(prev => ({
      ...prev,
      [providerId]: value
    }));
    setHasChanges(true);
  };

  const handleModelChange = (providerId, model) => {
    setModels(prev => ({
      ...prev,
      [providerId]: model
    }));
    setHasChanges(true);
  };

  const toggleShowKey = (providerId) => {
    setShowKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const handleSave = () => {
    // 保存到localStorage
    Object.entries(apiKeys).forEach(([providerId, key]) => {
      if (key && key.trim()) {
        localStorage.setItem(`api_key_${providerId}`, key.trim());
      } else {
        localStorage.removeItem(`api_key_${providerId}`);
      }
    });

    // 保存模型配置
    Object.entries(models).forEach(([providerId, model]) => {
      if (model) {
        localStorage.setItem(`model_${providerId}`, model);
      }
    });

    // 通知父组件
    onSave({ apiKeys, models });
    setHasChanges(false);
    onClose();
  };

  const handleClear = (providerId) => {
    setApiKeys(prev => ({
      ...prev,
      [providerId]: ''
    }));
    setHasChanges(true);
  };

  const getConfiguredCount = () => {
    return Object.values(apiKeys).filter(key => key && key.trim()).length;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span>🔑</span>
            <span>API密钥配置</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="help-section help-info">
            <p>配置至少一个AI服务的API密钥即可开始使用。密钥仅保存在您的浏览器本地，不会上传到服务器。</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              当前已配置: <strong>{getConfiguredCount()}</strong> / {API_PROVIDERS.length} 个服务
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          {API_PROVIDERS.map((provider) => (
            <div key={provider.id} className="api-provider">
              <div className="provider-header">
                <div className="provider-info">
                  <h3>{provider.name}</h3>
                  <p>{provider.description}</p>
                </div>
                <div className={`provider-status ${
                  apiKeys[provider.id] && apiKeys[provider.id].trim() 
                    ? 'configured' 
                    : ''
                }`}></div>
              </div>
              
              {/* API密钥输入 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="api-input-group" style={{ flex: 1 }}>
                  <input
                    type={showKeys[provider.id] ? 'text' : 'password'}
                    value={apiKeys[provider.id] || ''}
                    onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                    placeholder={provider.placeholder}
                    className="api-input"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(provider.id)}
                    className="toggle-btn"
                  >
                    {showKeys[provider.id] ? '🙈' : '👁️'}
                  </button>
                </div>
                {apiKeys[provider.id] && (
                  <button
                    onClick={() => handleClear(provider.id)}
                    className="clear-btn"
                  >
                    清除
                  </button>
                )}
              </div>

              {/* 模型选择 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  minWidth: '60px'
                }}>
                  模型:
                </label>
                <select
                  value={models[provider.id] || provider.defaultModel}
                  onChange={(e) => handleModelChange(provider.id, e.target.value)}
                  className="model-select"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}
                >
                  {provider.availableModels.map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <a 
              href="https://github.com/your-repo/uml-generate#api密钥获取" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#2563eb', textDecoration: 'none' }}
            >
              如何获取API密钥？
            </a>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="btn btn-primary"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};