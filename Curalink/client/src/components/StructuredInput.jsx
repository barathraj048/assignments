// client/src/components/StructuredInput.jsx

const Field = ({ label, fieldKey, placeholder, ctx, onChange, locked, textarea }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      fontSize: '12px', fontWeight: '500',
      color: 'var(--apple-muted)', display: 'block', marginBottom: '6px'
    }}>
      {label}
    </label>
    {textarea ? (
      <textarea
        value={ctx[fieldKey]}
        disabled={locked}
        onChange={e => onChange({ ...ctx, [fieldKey]: e.target.value })}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', fontSize: '13px',
          border: '1px solid var(--apple-border)',
          borderRadius: 'var(--apple-radius-sm)',
          background: locked ? 'var(--apple-surface-2)' : 'white',
          outline: 'none', color: 'var(--apple-text)',
          resize: 'none', fontFamily: 'inherit', lineHeight: '1.5'
        }}
      />
    ) : (
      <input
        value={ctx[fieldKey]}
        disabled={locked}
        onChange={e => onChange({ ...ctx, [fieldKey]: e.target.value })}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px', fontSize: '14px',
          border: '1px solid var(--apple-border)',
          borderRadius: 'var(--apple-radius-sm)',
          background: locked ? 'var(--apple-surface-2)' : 'white',
          outline: 'none', color: 'var(--apple-text)'
        }}
      />
    )}
  </div>
);

export default function StructuredInput({ context, onChange, onSubmit, locked, onClear }) {
  return (
    <div>
      {/* Logo + title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--apple-blue)',
          borderRadius: '10px', marginBottom: '14px'
        }} />
        <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>
          Curalink
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--apple-muted)', marginTop: '4px' }}>
          AI medical research assistant
        </p>
      </div>

      <Field label="Patient name"    fieldKey="name"
             placeholder="John Smith"          ctx={context} onChange={onChange} locked={locked} />
      <Field label="Condition *"     fieldKey="disease"
             placeholder="Parkinson's disease" ctx={context} onChange={onChange} locked={locked} />
      <Field label="Location"        fieldKey="location"
             placeholder="Toronto, Canada"     ctx={context} onChange={onChange} locked={locked} />
      <Field label="Additional info" fieldKey="additionalInfo"
             placeholder="Any extra context (optional)"
             ctx={context} onChange={onChange} locked={locked} textarea />

      {!locked ? (
        <button
          onClick={onSubmit}
          disabled={!context.disease.trim()}
          style={{
            width: '100%', padding: '12px', marginTop: '4px',
            background: context.disease.trim() ? 'var(--apple-blue)' : 'var(--apple-surface-2)',
            color: context.disease.trim() ? 'white' : 'var(--apple-muted)',
            border: 'none', borderRadius: 'var(--apple-radius-sm)',
            fontSize: '14px', fontWeight: '600', cursor: context.disease.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s'
          }}
        >
          Start Research Session
        </button>
      ) : (
        <div>
          <div style={{
            padding: '10px 14px', background: '#EAF3DE',
            borderRadius: 'var(--apple-radius-sm)',
            fontSize: '12px', color: '#3B6D11',
            fontWeight: '500', marginBottom: '10px'
          }}>
            Session active · {context.disease}
          </div>
          <button
            onClick={onClear}
            style={{
              width: '100%', padding: '10px',
              background: 'transparent', color: 'var(--apple-muted)',
              border: '1px solid var(--apple-border)',
              borderRadius: 'var(--apple-radius-sm)',
              fontSize: '13px', cursor: 'pointer'
            }}
          >
            New session
          </button>
        </div>
      )}

      {/* Demo quick-fill buttons */}
      {!locked && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '11px', color: 'var(--apple-muted)',
                        marginBottom: '8px', fontWeight: '500' }}>
            DEMO QUERIES
          </div>
          {[
            { name: 'John', disease: 'lung cancer',        location: 'New York' },
            { name: 'Sara', disease: 'diabetes',           location: 'London'   },
            { name: 'Mike', disease: "Alzheimer's disease", location: 'Toronto' },
            { name: 'Lisa', disease: 'heart disease',      location: 'Sydney'   },
          ].map(d => (
            <button key={d.disease} onClick={() => onChange({ ...d, additionalInfo: '' })}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', marginBottom: '6px',
                background: 'var(--apple-surface-2)',
                border: '1px solid var(--apple-border)',
                borderRadius: 'var(--apple-radius-sm)',
                fontSize: '12px', color: 'var(--apple-text)', cursor: 'pointer'
              }}>
              {d.disease}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}