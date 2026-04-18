// client/src/App.jsx
import { useState } from 'react';
import { useConversation } from './hooks/useConversation';
import StructuredInput from './components/StructuredInput';
import ChatInterface   from './components/ChatInterface';

export default function App() {
  const conv = useConversation();
  const [contextSet, setContextSet] = useState(false);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--apple-bg)'
    }}>

      {/* Left panel — patient context */}
      <div style={{
        width: '320px',
        flexShrink: 0,
        padding: '24px',
        borderRight: '1px solid var(--apple-border)',
        background: 'var(--apple-surface)',
        overflowY: 'auto'
      }}>
        <StructuredInput
          context={conv.patientCtx}
          onChange={conv.setPatientCtx}
          onSubmit={() => setContextSet(true)}
          locked={contextSet}
          onClear={() => { conv.clearChat(); setContextSet(false); }}
        />
      </div>

      {/* Right panel — chat */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <ChatInterface
          messages={conv.messages}
          loading={conv.loading}
          error={conv.error}
          onSend={conv.sendMessage}
          disabled={!contextSet}
        />
      </div>

    </div>
  );
}