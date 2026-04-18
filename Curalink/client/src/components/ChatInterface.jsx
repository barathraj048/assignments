// client/src/components/ChatInterface.jsx
import { useState, useEffect, useRef } from 'react';
import MessageBubble  from './MessageBubble';
import ThinkingLoader from './ThinkingLoader';

const SUGGESTIONS = [
  'Latest treatment for lung cancer',
  'Clinical trials for diabetes',
  'Top researchers in Alzheimer\'s disease',
  'Recent studies on heart disease',
];

export default function ChatInterface({ messages, loading, error, onSend, disabled }) {
  const [input, setInput] = useState('');
  const bottomRef         = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    if (input.trim() && !loading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--apple-border)',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '15px', fontWeight: '600' }}>Research Chat</span>
        {messages.length > 0 && (
          <span style={{ fontSize: '12px', color: 'var(--apple-muted)' }}>
            {messages.filter(m => m.role === 'user').length} queries
          </span>
        )}
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }}>

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{
              fontSize: '32px', marginBottom: '12px',
              color: 'var(--apple-muted)'
            }}>
              &#9679;
            </div>
            <p style={{ fontSize: '15px', color: 'var(--apple-muted)', marginBottom: '24px' }}>
              {disabled
                ? 'Fill in patient context on the left to begin'
                : 'Ask anything about your condition'}
            </p>
            {/* Suggestion chips */}
            {!disabled && (
              <div style={{
                display: 'flex', flexWrap: 'wrap',
                gap: '8px', justifyContent: 'center', maxWidth: '480px', margin: '0 auto'
              }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => onSend(s)}
                    style={{
                      padding: '8px 14px', fontSize: '12px',
                      background: 'white', border: '1px solid var(--apple-border)',
                      borderRadius: '20px', cursor: 'pointer',
                      color: 'var(--apple-text)', transition: 'all 0.15s'
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message list */}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {/* Thinking loader */}
        {loading && (
          <div style={{ display: 'flex' }}>
            <ThinkingLoader />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', background: '#FCEBEB',
            borderRadius: 'var(--apple-radius-sm)',
            color: '#A32D2D', fontSize: '13px',
            border: '1px solid #F7C1C1'
          }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--apple-border)',
        background: 'var(--apple-surface)',
        display: 'flex', gap: '10px', alignItems: 'center'
      }}>
        <input
          value={input}
          disabled={disabled || loading}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={disabled
            ? 'Set patient context first...'
            : 'Ask about treatments, trials, researchers...'}
          style={{
            flex: 1, padding: '12px 18px', fontSize: '14px',
            border: '1px solid var(--apple-border)',
            borderRadius: '24px', outline: 'none',
            background: (disabled || loading) ? 'var(--apple-surface-2)' : 'white',
            color: 'var(--apple-text)', transition: 'all 0.15s'
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || loading || !input.trim()}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: (!disabled && !loading && input.trim())
              ? 'var(--apple-blue)' : 'var(--apple-surface-2)',
            border: 'none', cursor: 'pointer',
            color: (!disabled && !loading && input.trim()) ? 'white' : 'var(--apple-muted)',
            fontSize: '18px', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}