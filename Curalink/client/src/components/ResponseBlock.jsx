// client/src/components/ResponseBlock.jsx
import PublicationCard from './PublicationCard';
import TrialCard       from './TrialCard';

const Section = ({ title, color, children }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{
      fontSize: '10px', fontWeight: '700', color,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: '8px'
    }}>
      {title}
    </div>
    {children}
  </div>
);

export default function ResponseBlock({ response }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '18px 18px 18px 4px',
      border: '1px solid var(--apple-border)',
      padding: '20px 22px',
      fontSize: '14px', lineHeight: '1.65'
    }}>

      {response.overview && (
        <Section title="Overview" color="#0071E3">
          <p style={{ color: '#1D1D1F' }}>{response.overview}</p>
        </Section>
      )}

      {response.insights && (
        <Section title="Research Insights" color="#0F6E56">
          <p style={{ color: '#1D1D1F', whiteSpace: 'pre-wrap' }}>
            {response.insights}
          </p>
        </Section>
      )}

      {response.trialsSection && (
        <Section title="Clinical Trials" color="#854F0B">
          <p style={{ color: '#1D1D1F', whiteSpace: 'pre-wrap' }}>
            {response.trialsSection}
          </p>
        </Section>
      )}

      {response.recommendation && (
        <Section title="Recommendation" color="#534AB7">
          <p style={{ color: '#1D1D1F' }}>{response.recommendation}</p>
        </Section>
      )}

      {response.sources?.length > 0 && (
        <Section title={`Sources (${response.sources.length})`} color="#6E6E73">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {response.sources.map((s, i) => (
              <PublicationCard key={i} pub={s} index={i + 1} />
            ))}
          </div>
        </Section>
      )}

      {response.trials?.length > 0 && (
        <Section title={`Clinical Trial Details (${response.trials.length})`} color="#6E6E73">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {response.trials.map((t, i) => (
              <TrialCard key={i} trial={t} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}