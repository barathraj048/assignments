// client/src/components/MessageBubble.jsx
import ResponseBlock from './ResponseBlock';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '70%', padding: '12px 16px',
          background: 'var(--apple-blue)', color: 'white',
          borderRadius: '18px 18px 4px 18px',
          fontSize: '14px', lineHeight: '1.5'
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: '92%', width: '100%' }}>
        <ResponseBlock response={message} />
      </div>
    </div>
  );
}