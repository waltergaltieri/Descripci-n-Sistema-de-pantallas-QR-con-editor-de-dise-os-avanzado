import React, { useState, useEffect } from 'react';
import { Puck } from '@measured/puck';
import '@measured/puck/puck.css';
import './EasyblocksEditor.css';

const PuckEditor = ({ design, onSave, onPreview, onDataChange }) => {
  const [editorData, setEditorData] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    if (design && design.content) {
      try {
        const parsedContent = typeof design.content === 'string' 
          ? JSON.parse(design.content) 
          : design.content;
        setEditorData(parsedContent);
      } catch (error) {
        console.error('Error parsing design content:', error);
        setEditorData(getInitialData());
      }
    } else {
      setEditorData(getInitialData());
    }
  }, [design]);

  const getInitialData = () => ({
    content: [],
    root: { props: { title: 'My Page' } }
  });

  const handleSave = (data) => {
    if (onSave) {
      try {
        // Create a clean copy of the data without circular references
        const cleanData = {
          content: data.content || [],
          root: data.root || { props: { title: 'My Page' } }
        };
        
        onSave({
          ...design,
          content: JSON.stringify(cleanData)
        });
        setUnsavedChanges(false);
      } catch (error) {
        console.error('Error saving design:', error);
        // Fallback: save only the essential data
        const fallbackData = {
          content: Array.isArray(data.content) ? data.content : [],
          root: { props: { title: data.root?.props?.title || 'My Page' } }
        };
        
        onSave({
          ...design,
          content: JSON.stringify(fallbackData)
        });
        setUnsavedChanges(false);
       }
     }
   };

  const handleDataChange = (newData) => {
    setEditorData(newData);
    setUnsavedChanges(true);
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  const handlePublish = (data) => {
    handleSave(data);
  };

  // Puck configuration with custom components
  const config = {
    components: {
      HeadingBlock: {
        fields: {
          children: {
            type: 'text',
            label: 'Heading Text'
          },
          level: {
            type: 'select',
            label: 'Heading Level',
            options: [
              { label: 'H1', value: 'h1' },
              { label: 'H2', value: 'h2' },
              { label: 'H3', value: 'h3' },
              { label: 'H4', value: 'h4' },
              { label: 'H5', value: 'h5' },
              { label: 'H6', value: 'h6' }
            ]
          },
          color: {
            type: 'text',
            label: 'Text Color'
          }
        },
        defaultProps: {
          children: 'Heading',
          level: 'h2',
          color: '#333333'
        },
        render: ({ children, level, color }) => {
          const HeadingTag = level;
          return (
            <HeadingTag style={{ color, margin: '16px 0' }}>
              {children}
            </HeadingTag>
          );
        }
      },
      TextBlock: {
        fields: {
          children: {
            type: 'textarea',
            label: 'Text Content'
          },
          fontSize: {
            type: 'text',
            label: 'Font Size'
          },
          color: {
            type: 'text',
            label: 'Text Color'
          },
          textAlign: {
            type: 'select',
            label: 'Text Alignment',
            options: [
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
              { label: 'Justify', value: 'justify' }
            ]
          }
        },
        defaultProps: {
          children: 'Enter your text here...',
          fontSize: '16px',
          color: '#333333',
          textAlign: 'left'
        },
        render: ({ children, fontSize, color, textAlign }) => {
          return (
            <p style={{ 
              fontSize, 
              color, 
              textAlign,
              margin: '12px 0',
              lineHeight: '1.6'
            }}>
              {children}
            </p>
          );
        }
      },
      ButtonBlock: {
        fields: {
          children: {
            type: 'text',
            label: 'Button Text'
          },
          href: {
            type: 'text',
            label: 'Link URL'
          },
          backgroundColor: {
            type: 'text',
            label: 'Background Color'
          },
          textColor: {
            type: 'text',
            label: 'Text Color'
          },
          size: {
            type: 'select',
            label: 'Button Size',
            options: [
              { label: 'Small', value: 'small' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large', value: 'large' }
            ]
          }
        },
        defaultProps: {
          children: 'Click me',
          href: '#',
          backgroundColor: '#007bff',
          textColor: '#ffffff',
          size: 'medium'
        },
        render: ({ children, href, backgroundColor, textColor, size }) => {
          const sizeStyles = {
            small: { padding: '8px 16px', fontSize: '14px' },
            medium: { padding: '12px 24px', fontSize: '16px' },
            large: { padding: '16px 32px', fontSize: '18px' }
          };

          return (
            <a
              href={href}
              style={{
                display: 'inline-block',
                backgroundColor,
                color: textColor,
                textDecoration: 'none',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                margin: '8px 0',
                ...sizeStyles[size]
              }}
            >
              {children}
            </a>
          );
        }
      },
      ImageBlock: {
        fields: {
          src: {
            type: 'text',
            label: 'Image URL'
          },
          alt: {
            type: 'text',
            label: 'Alt Text'
          },
          width: {
            type: 'text',
            label: 'Width'
          },
          height: {
            type: 'text',
            label: 'Height'
          }
        },
        defaultProps: {
          src: 'https://via.placeholder.com/400x200',
          alt: 'Placeholder image',
          width: '100%',
          height: 'auto'
        },
        render: ({ src, alt, width, height }) => {
          return (
            <img
              src={src}
              alt={alt}
              style={{
                width,
                height,
                display: 'block',
                margin: '16px 0'
              }}
            />
          );
        }
      },
      ContainerBlock: {
        fields: {
          backgroundColor: {
            type: 'text',
            label: 'Background Color'
          },
          padding: {
            type: 'text',
            label: 'Padding'
          },
          margin: {
            type: 'text',
            label: 'Margin'
          },
          borderRadius: {
            type: 'text',
            label: 'Border Radius'
          }
        },
        defaultProps: {
          backgroundColor: 'transparent',
          padding: '20px',
          margin: '0',
          borderRadius: '0'
        },
        render: ({ children, backgroundColor, padding, margin, borderRadius }) => {
          return (
            <div style={{
              backgroundColor,
              padding,
              margin,
              borderRadius,
              minHeight: '50px'
            }}>
              {children}
            </div>
          );
        }
      }
    }
  };

  if (!editorData) {
    return <div className="puck-loading">Loading editor...</div>;
  }

  return (
    <div className="puck-editor-container">
      <Puck
        config={config}
        data={editorData}
        onPublish={handlePublish}
        onChange={handleDataChange}
      />
    </div>
  );
};

export default PuckEditor;