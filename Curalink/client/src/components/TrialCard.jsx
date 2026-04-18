// client/src/components/TrialCard.jsx
const STATUS_STYLE = {
  RECRUITING:              { bg: '#EAF3DE', text: '#3B6D11' },
  ACTIVE_NOT_RECRUITING:   { bg: '#E6F1FB', text: '#185FA5' },
  COMPLETED:               { bg: '#F1EFE8', text: '#5F5E5A' },
  NOT_YET_RECRUITING:      { bg: '#FAEEDA', text: '#854F0B' },
  ENROLLING_BY_INVITATION: { bg: '#EEEDFE', text: '#534AB7' },
  TERMINATED:              { bg: '#FCEBEB', text: '#A32D2D' },
};

export default function TrialCard({ trial }) {
  const s = STATUS_STYLE[trial.status] || STATUS_STYLE.COMPLETED;

  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--apple-surface-2)',
      borderRadius: 'var(--apple-radius-sm)',
      border: '1px solid var(--apple-border)'
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '8px', marginBottom: '8px'
      }}>
        <a href={trial.url} target="_blank" rel="noreferrer"
          style={{
            fontSize: '13px', fontWeight: '500',
            color: 'var(--apple-blue)', textDecoration: 'none',
            lineHeight: '1.4', flex: 1
          }}>
          {trial.title}
        </a>
        <span style={{
          fontSize: '10px', fontWeight: '600',
          padding: '2px 8px', borderRadius: '20px',
          whiteSpace: 'nowrap', flexShrink: 0,
          background: s.bg, color: s.text
        }}>
          {(trial.status || '').replace(/_/g, ' ')}
        </span>
      </div>

      {trial.location && (
        <div style={{
          fontSize: '12px', color: 'var(--apple-muted)',
          marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          {trial.location}
        </div>
      )}

      {trial.eligibility && (
        <div style={{
          fontSize: '12px', color: '#3D3D3A',
          lineHeight: '1.5', marginBottom: '6px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {trial.eligibility}
        </div>
      )}

      {trial.contact && (
        <div style={{
          fontSize: '11px', color: 'var(--apple-muted)',
          paddingTop: '6px',
          borderTop: '1px solid var(--apple-border)'
        }}>
          Contact: {trial.contact}
        </div>
      )}
    </div>
  );
}