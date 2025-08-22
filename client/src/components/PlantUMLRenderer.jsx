import plantumlEncoder from 'plantuml-encoder';
import React, { useState, useEffect } from 'react';

// 本地PlantUML渲染器，使用后端代理
const PlantUMLViewer = ({ code }) => {
  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const renderPlantUML = async () => {
      try {
        setLoading(true);
        setError(null);

        // 使用本地API端点渲染PlantUML
        const response = await fetch('http://localhost:3001/api/plantuml/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          throw new Error(`渲染失败: ${response.status}`);
        }

        const svgData = await response.text();
        setSvgContent(svgData);
      } catch (err) {
        console.error('PlantUML渲染错误:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      renderPlantUML();
    }
  }, [code]);

  if (loading) {
    return (
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '2rem', 
        marginBottom: '1rem',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ 
          display: 'inline-block', 
          width: '20px', 
          height: '20px', 
          border: '2px solid #007bff', 
          borderTop: '2px solid transparent', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginRight: '0.5rem'
        }}></div>
        <span>正在渲染PlantUML图表...</span>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    // 出错时回退到外部链接方案
    try {
      const encoded = plantumlEncoder.encode(code);
      const svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
      const editUrl = `https://www.plantuml.com/plantuml/uml/${encoded}`;
      
      return (
        <div style={{ 
          border: '1px solid #e74c3c', 
          borderRadius: '8px', 
          padding: '1rem', 
          backgroundColor: '#fdf2f2',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#e74c3c', margin: '0 0 1rem 0' }}>
            本地渲染失败: {error}
          </p>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
            使用外部链接作为备选方案：
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <a
              href={svgUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                textDecoration: 'none', 
                backgroundColor: '#007bff', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              🔗 查看图表
            </a>
            <a
              href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                textDecoration: 'none', 
                backgroundColor: '#28a745', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              📝 在线编辑
            </a>
          </div>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>查看PlantUML代码</summary>
            <pre style={{ 
              fontSize: '0.75rem', 
              overflow: 'auto', 
              backgroundColor: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px',
              marginTop: '0.5rem'
            }}>
              {code}
            </pre>
          </details>
        </div>
      );
    } catch (encodeError) {
      return (
        <div style={{ 
          border: '1px solid #e74c3c', 
          borderRadius: '8px', 
          padding: '1rem', 
          backgroundColor: '#fdf2f2',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#e74c3c', margin: '0 0 1rem 0' }}>PlantUML渲染失败</p>
          <pre style={{ 
            fontSize: '0.75rem', 
            overflow: 'auto', 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '4px'
          }}>
            {code}
          </pre>
        </div>
      );
    }
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
      {/* 渲染SVG内容 */}
      <div 
        style={{ textAlign: 'center', marginBottom: '1rem' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      
      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            alert('PlantUML代码已复制到剪贴板！');
          }}
          style={{ 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
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
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{ 
            backgroundColor: '#17a2b8', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          💾 下载SVG
        </button>
      </div>
      
      {/* 可展开的代码区域 */}
      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>查看PlantUML代码</summary>
        <pre style={{ 
          fontSize: '0.75rem', 
          overflow: 'auto', 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px',
          marginTop: '0.5rem'
        }}>
          {code}
        </pre>
      </details>
    </div>
  );
};

export const PlantUMLRenderer = ({ content }) => {
  if (!content) return null;

  const plantUMLMatches = content.match(/@startuml[\s\S]*?@enduml/g);
  
  if (!plantUMLMatches || plantUMLMatches.length === 0) {
    return (
      <div className="plantuml-error" style={{ 
        padding: '1rem', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '8px' 
      }}>
        <p>未找到PlantUML图表内容</p>
      </div>
    );
  }

  return (
    <div>
      {plantUMLMatches.map((diagram, index) => {
        try {
          const cleanedDiagram = diagram.trim();
          console.log('PlantUML代码:', cleanedDiagram);
          
          // 验证PlantUML代码是否有效
          if (!cleanedDiagram || cleanedDiagram.length < 10) {
            throw new Error('PlantUML代码为空或过短');
          }
          
          return (
            <PlantUMLViewer key={index} code={cleanedDiagram} />
          );
        } catch (error) {
          console.error('PlantUML处理错误:', error);
          return (
            <div key={index} style={{ 
              border: '1px solid #e74c3c', 
              borderRadius: '8px', 
              padding: '1rem', 
              backgroundColor: '#fdf2f2',
              marginBottom: '1rem'
            }}>
              <p style={{ color: '#e74c3c', margin: '0 0 1rem 0' }}>PlantUML处理失败: {error.message}</p>
              <pre style={{ 
                fontSize: '0.75rem', 
                overflow: 'auto', 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '4px'
              }}>
                {diagram}
              </pre>
            </div>
          );
        }
      })}
    </div>
  );
};