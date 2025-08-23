import plantumlEncoder from 'plantuml-encoder';
import React, { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';

// 纯前端PlantUML渲染器，直接使用外部服务
const PlantUMLViewer = ({ code, onCodeChange }) => {
  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);

  useEffect(() => {
    setEditedCode(code);
  }, [code]);

  const renderPlantUML = async (umlCode) => {
    try {
      setLoading(true);
      setError(null);

      // 编码PlantUML代码
      const encoded = plantumlEncoder.encode(umlCode);
      
      // 尝试多个PlantUML服务器，优先使用本地服务器
      const plantUMLServers = [
        `http://localhost:8080/svg/${encoded}`, // 本地Docker PlantUML服务器
        `https://plantuml-server.kkeisuke.dev/svg/${encoded}`,
        `https://www.plantuml.com/plantuml/svg/${encoded}`,
      ];
      
      let lastError = null;
      
      for (const plantUMLUrl of plantUMLServers) {
        try {
          console.log(`尝试PlantUML服务器: ${plantUMLUrl}`);
          
          const response = await fetch(plantUMLUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(30000) // 30秒超时
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const svgData = await response.text();
          
          // 验证返回的是否为有效SVG
          if (svgData && svgData.includes('<svg')) {
            setSvgContent(svgData);
            return; // 成功渲染，退出循环
          } else {
            throw new Error('返回的内容不是有效的SVG格式');
          }
        } catch (serverError) {
          console.warn(`PlantUML服务器 ${plantUMLUrl} 失败:`, serverError);
          lastError = serverError;
          continue; // 尝试下一个服务器
        }
      }
      
      // 所有服务器都失败了
      throw lastError || new Error('所有PlantUML服务器都无法访问');
      
    } catch (err) {
      console.error('PlantUML渲染错误:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      renderPlantUML(code);
    }
  }, [code]);

  // 下载PNG功能
  const downloadPNG = async () => {
    try {
      if (!svgContent) return;
      
      // 创建一个Canvas来转换SVG为PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // 创建SVG的Data URL
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        
        // 设置白色背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制SVG
        ctx.drawImage(img, 0, 0);
        
        // 下载PNG
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'plantuml-diagram.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          // 追踪PNG下载事件
          try {
            track('plantuml_png_downloaded', { 
              canvas_width: canvas.width, 
              canvas_height: canvas.height,
              file_size: blob.size 
            });
          } catch (trackError) {
            console.log('Analytics tracking failed:', trackError);
          }
        }, 'image/png');
        
        URL.revokeObjectURL(svgUrl);
      };
      
      img.src = svgUrl;
    } catch (err) {
      console.error('PNG下载失败:', err);
      alert('PNG下载失败，请尝试下载SVG格式');
    }
  };

  // 保存编辑
  const saveEdit = () => {
    if (editedCode !== code) {
      onCodeChange && onCodeChange(editedCode);
      renderPlantUML(editedCode);
    }
    setIsEditing(false);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditedCode(code);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="plantuml-loading">
        <div className="loading-spinner"></div>
        <span>正在渲染PlantUML图表...</span>
      </div>
    );
  }

  if (error) {
    // 出错时提供外部链接方案
    try {
      const encoded = plantumlEncoder.encode(code);
      const svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
      const pngUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
      const editUrl = `https://www.plantuml.com/plantuml/uml/${encoded}`;
      
      return (
        <div className="plantuml-error">
          <p className="error-message">渲染失败: {error}</p>
          <p className="fallback-message">使用外部服务作为备选方案：</p>
          <div className="action-buttons">
            <a href={svgUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              🔗 查看SVG
            </a>
            <a href={pngUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success">
              🖼️ 查看PNG
            </a>
            <a href={editUrl} target="_blank" rel="noopener noreferrer" className="btn btn-warning">
              📝 在线编辑
            </a>
          </div>
          <details className="code-details">
            <summary>查看PlantUML代码</summary>
            <pre className="code-content">{code}</pre>
          </details>
        </div>
      );
    } catch (encodeError) {
      return (
        <div className="plantuml-error">
          <p className="error-message">PlantUML渲染失败</p>
          <pre className="code-content">{code}</pre>
        </div>
      );
    }
  }

  return (
    <div className="plantuml-container">
      {/* 渲染SVG内容 */}
      <div className="svg-container" dangerouslySetInnerHTML={{ __html: svgContent }} />
      
      {/* 操作按钮 */}
      <div className="action-buttons">
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            alert('PlantUML代码已复制到剪贴板！');
            // 追踪代码复制事件
            try {
              track('plantuml_code_copied', { code_length: code.length });
            } catch (trackError) {
              console.log('Analytics tracking failed:', trackError);
            }
          }}
          className="btn btn-secondary"
        >
          📋 复制代码
        </button>
        
        <button
          onClick={() => {
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plantuml-diagram.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            // 追踪SVG下载事件
            try {
              track('plantuml_svg_downloaded', { file_size: svgContent.length });
            } catch (trackError) {
              console.log('Analytics tracking failed:', trackError);
            }
          }}
          className="btn btn-info"
        >
          💾 下载SVG
        </button>

        <button
          onClick={downloadPNG}
          className="btn btn-success"
        >
          🖼️ 下载PNG
        </button>

        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-warning"
        >
          📝 编辑UML
        </button>
      </div>
      
      {/* 编辑模态框 */}
      {isEditing && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>编辑PlantUML代码</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                className="code-editor"
                rows={20}
                placeholder="输入PlantUML代码..."
              />
            </div>
            <div className="modal-footer">
              <button onClick={cancelEdit} className="btn btn-secondary">
                取消
              </button>
              <button onClick={saveEdit} className="btn btn-primary">
                保存并重新渲染
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 可展开的代码区域 */}
      <details className="code-details">
        <summary>查看PlantUML代码</summary>
        <pre className="code-content">{code}</pre>
      </details>
    </div>
  );
};

export const PlantUMLRenderer = ({ content, onContentChange }) => {
  if (!content) return null;

  const plantUMLMatches = content.match(/@startuml[\s\S]*?@enduml/g);
  
  if (!plantUMLMatches || plantUMLMatches.length === 0) {
    return (
      <div className="plantuml-no-content">
        <p>未找到PlantUML图表内容</p>
      </div>
    );
  }

  const handleCodeChange = (index, newCode) => {
    if (onContentChange) {
      // 更新整个内容中的特定PlantUML代码
      let updatedContent = content;
      let matchIndex = 0;
      
      updatedContent = updatedContent.replace(/@startuml[\s\S]*?@enduml/g, (match) => {
        if (matchIndex === index) {
          matchIndex++;
          return newCode;
        }
        matchIndex++;
        return match;
      });
      
      onContentChange(updatedContent);
    }
  };

  return (
    <div className="plantuml-renderer">
      {plantUMLMatches.map((diagram, index) => {
        try {
          const cleanedDiagram = diagram.trim();
          console.log('PlantUML代码:', cleanedDiagram);
          
          // 验证PlantUML代码是否有效
          if (!cleanedDiagram || cleanedDiagram.length < 10) {
            throw new Error('PlantUML代码为空或过短');
          }
          
          return (
            <PlantUMLViewer 
              key={index} 
              code={cleanedDiagram}
              onCodeChange={(newCode) => handleCodeChange(index, newCode)}
            />
          );
        } catch (error) {
          console.error('PlantUML处理错误:', error);
          return (
            <div key={index} className="plantuml-error">
              <p className="error-message">PlantUML处理失败: {error.message}</p>
              <pre className="code-content">{diagram}</pre>
            </div>
          );
        }
      })}
    </div>
  );
};