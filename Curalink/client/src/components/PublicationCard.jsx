// client/src/components/PublicationCard.jsx
const SOURCE_COLORS = {
  pubmed:   { bg: '#E6F1FB', text: '#185FA5', label: 'PubMed'   },
  openalex: { bg: '#EEEDFE', text: '#534AB7', label: 'OpenAlex' },
};

export default function PublicationCard({ pub, index }) {
  const c = SOURCE_COLORS[pub.source] || SOURCE_COLORS.openalex;

  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--apple-surface-2)',
      borderRadius: 'var(--apple-radius-sm)',
      border: '1px solid var(--apple-border)'
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '8px', marginBottom: '6px'
      }}>
        {/* Index + title */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'flex-start' }}>
          <span style={{
            fontSize: '10px', fontWeight: '700',
            color: 'var(--apple-muted)', marginTop: '2px', flexShrink: 0
          }}>
            [{index}]
          </span>
          <a href={pub.url} target="_blank" rel="noreferrer"
            style={{
              fontSize: '13px', fontWeight: '500',
              color: 'var(--apple-blue)', textDecoration: 'none',
              lineHeight: '1.4', flex: 1
            }}>
            {pub.title}
          </a>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: '600',
          padding: '2px 8px', borderRadius: '20px',
          whiteSpace: 'nowrap', flexShrink: 0,
          background: c.bg, color: c.text
        }}>
          {c.label}
        </span>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--apple-muted)', marginBottom: '4px' }}>
        {pub.authors} · {pub.year}
      </div>

      {pub.snippet && (
        <div style={{
          fontSize: '12px', color: '#3D3D3A',
          lineHeight: '1.5', marginTop: '4px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {pub.snippet}
        </div>
      )}
    </div>
  );
}