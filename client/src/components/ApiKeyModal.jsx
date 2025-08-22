import React, { useState, useEffect } from 'react';

const API_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI ChatGPT', 
    key: 'OPENAI_API_KEY',
    placeholder: 'sk-...',
    description: '用于GPT-4模型的API密钥'
  },
  { 
    id: 'claude', 
    name: 'Anthropic Claude', 
    key: 'CLAUDE_API_KEY',
    placeholder: 'sk-ant-...',
    description: '用于Claude-3模型的API密钥'
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    key: 'DEEPSEEK_API_KEY',
    placeholder: 'sk-...',
    description: '用于DeepSeek Chat模型的API密钥'
  },
  { 
    id: 'kimi', 
    name: 'Kimi (月之暗面)', 
    key: 'KIMI_API_KEY',
    placeholder: 'sk-...',
    description: '用于Moonshot V1模型的API密钥'
  }
];

export const ApiKeyModal = ({ isOpen, onClose, onSave }) => {
  const [apiKeys, setApiKeys] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 从localStorage加载已保存的API密钥
      const savedKeys = {};
      API_PROVIDERS.forEach(provider => {
        const saved = localStorage.getItem(`api_key_${provider.id}`);
        if (saved) {
          savedKeys[provider.id] = saved;
        }
      });
      setApiKeys(savedKeys);
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

    // 通知父组件
    onSave(apiKeys);
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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