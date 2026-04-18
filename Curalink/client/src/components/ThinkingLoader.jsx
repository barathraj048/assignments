// client/src/components/ThinkingLoader.jsx
export default function ThinkingLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '14px 18px', background: 'white',
      borderRadius: '18px 18px 18px 4px',
      border: '1px solid var(--apple-border)',
      width: 'fit-content'
    }}>
      <style>{`
        @keyframes cura-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
          40%            { transform: scale(1);   opacity: 1;    }
        }
        .cura-dot {
          width: 7px; height: 7px;
          background: #1D1D1F; border-radius: 50%;
          animation: cura-pulse 1.2s ease-in-out infinite;
        }
        .cura-dot:nth-child(2) { animation-delay: 0.15s; }
        .cura-dot:nth-child(3) { animation-delay: 0.30s; }
      `}</style>
      <div className="cura-dot" />
      <div className="cura-dot" />
      <div className="cura-dot" />
    </div>
  );
}