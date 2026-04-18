import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FlaskConical, ChevronDown, ChevronUp, ExternalLink, MapPin, Users, Calendar } from 'lucide-react';

function PublicationCard({ title, authors, year, platform, url, snippet, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '14px',
        padding: '14px 16px',
        marginBottom: '8px',
        cursor: snippet ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
      whileHover={{ borderColor: 'rgba(0, 113, 227, 0.3)' }}
      onClick={() => snippet && setExpanded(e => !e)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <p style={{
          fontWeight: 500,
          fontSize: '13px',
          color: '#1D1D1F',
          lineHeight: '1.45',
          flex: 1,
          margin: 0,
        }}>
          {title}
        </p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              flexShrink: 0,
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F5F5F7',
              borderRadius: '8px',
              color: '#0071E3',
              transition: 'background 0.15s',
            }}
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
        {authors?.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6E6E73' }}>
            <Users size={10} />
            {authors.slice(0, 2).join(', ')}{authors.length > 2 ? ` +${authors.length - 2}` : ''}
          </span>
        )}
        {year && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6E6E73' }}>
            <Calendar size={10} />
            {year}
          </span>
        )}
        {platform && (
          <span style={{
            background: '#E8F4FD',
            color: '#0071E3',
            fontSize: '10px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '6px',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            {platform}
          </span>
        )}
      </div>

      <AnimatePresence>
        {expanded && snippet && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: '12px',
              color: '#6E6E73',
              lineHeight: '1.6',
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              margin: '10px 0 0',
              overflow: 'hidden',
            }}
          >
            {snippet}
          </motion.p>
        )}
      </AnimatePresence>

      {snippet && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '8px',
          fontSize: '11px',
          color: '#0071E3',
          fontWeight: 500,
        }}>
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Hide abstract' : 'Show abstract'}
        </div>
      )}
    </motion.div>
  );
}

function TrialCard({ title, status, location, eligibility, nctId, url, index }) {
  const [expanded, setExpanded] = useState(false);
  const isRecruiting = status?.toUpperCase() === 'RECRUITING';
  const isCompleted  = status?.toUpperCase() === 'COMPLETED';

  const statusStyle = isRecruiting
    ? { background: '#F0FFF4', color: '#1A7F37' }
    : isCompleted
    ? { background: '#F2F2F2', color: '#6E6E73' }
    : { background: '#FFF8E1', color: '#8A5300' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '14px',
        padding: '14px 16px',
        marginBottom: '8px',
        cursor: eligibility ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
      whileHover={{ borderColor: isRecruiting ? 'rgba(26, 127, 55, 0.3)' : 'rgba(0,0,0,0.15)' }}
      onClick={() => eligibility && setExpanded(e => !e)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <p style={{
          fontWeight: 500,
          fontSize: '13px',
          color: '#1D1D1F',
          lineHeight: '1.45',
          flex: 1,
          margin: 0,
        }}>
          {title}
        </p>
        <span style={{
          flexShrink: 0,
          fontSize: '10px',
          fontWeight: 600,
          padding: '3px 9px',
          borderRadius: '7px',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          ...statusStyle,
        }}>
          {isRecruiting ? 'Recruiting' : status}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
        {location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6E6E73' }}>
            <MapPin size={10} />
            {location}
          </span>
        )}
        {nctId && (
          <span style={{ fontSize: '11px', color: '#6E6E73', fontFamily: 'SF Mono, monospace' }}>
            {nctId}
          </span>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: '11px', color: '#0071E3', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            ClinicalTrials.gov <ExternalLink size={10} />
          </a>
        )}
      </div>

      <AnimatePresence>
        {expanded && eligibility && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Eligibility
              </p>
              <p style={{ fontSize: '12px', color: '#1D1D1F', lineHeight: '1.6', margin: 0 }}>
                {eligibility}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {eligibility && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '8px',
          fontSize: '11px',
          color: '#0071E3',
          fontWeight: 500,
        }}>
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Hide eligibility' : 'View eligibility'}
        </div>
      )}
    </motion.div>
  );
}

export default function SourcePanel({ publications = [], trials = [] }) {
  const [activeTab, setActiveTab] = useState('publications');
  const hasPublications = publications.length > 0;
  const hasTrials       = trials.length > 0;

  const tabStyle = (tab) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s',
    background: activeTab === tab ? '#0071E3' : 'transparent',
    color:      activeTab === tab ? '#FFFFFF'  : '#6E6E73',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
      style={{
        background: '#F5F5F7',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        maxHeight: '380px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: '#F5F5F7',
        flexShrink: 0,
      }}>
        {hasPublications && (
          <button style={tabStyle('publications')} onClick={() => setActiveTab('publications')}>
            <BookOpen size={13} />
            Publications
            <span style={{
              background: activeTab === 'publications' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
              color: activeTab === 'publications' ? '#fff' : '#6E6E73',
              fontSize: '10px',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '5px',
              marginLeft: '2px',
            }}>
              {publications.length}
            </span>
          </button>
        )}
        {hasTrials && (
          <button style={tabStyle('trials')} onClick={() => setActiveTab('trials')}>
            <FlaskConical size={13} />
            Clinical trials
            <span style={{
              background: activeTab === 'trials' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
              color: activeTab === 'trials' ? '#fff' : '#6E6E73',
              fontSize: '10px',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '5px',
              marginLeft: '2px',
            }}>
              {trials.length}
            </span>
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{
        overflowY: 'auto',
        padding: '12px 16px',
        flex: 1,
      }}>
        <AnimatePresence mode="wait">
          {activeTab === 'publications' && hasPublications && (
            <motion.div
              key="publications"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {publications.map((pub, i) => (
                <PublicationCard key={pub.url || i} {...pub} index={i} />
              ))}
            </motion.div>
          )}

          {activeTab === 'trials' && hasTrials && (
            <motion.div
              key="trials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {trials.map((trial, i) => (
                <TrialCard key={trial.nctId || i} {...trial} index={i} />
              ))}
            </motion.div>
          )}

          {!hasPublications && !hasTrials && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: '13px', color: '#6E6E73', textAlign: 'center', paddingTop: '24px' }}
            >
              No sources found for this query.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}