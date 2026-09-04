import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check
} from 'lucide-react';

export default function PriorityQueueView({
  reports,
  currentRole, // 'ward_engineer' | 'mla'
  onProgressStatus
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Sorted descending by server-calculated priority score
  const sortedReports = [...reports].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  const filteredReports = sortedReports.filter(r => {
    if (filterCategory === 'all') return true;
    return r.category === filterCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px' }}>
            <Flame size={14} />
            <span>Anti-Deadlock Dynamic SLA Escalation Engine</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Live Civic Priority Queue
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0 }}>
            {currentRole === 'ward_engineer'
              ? 'Ward H/West engineering action queue — auto-ranked by safety risk and aging'
              : 'Constituency oversight priority audit — read-only monitor for Shri Ashish Shelar'}
          </p>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['all', 'pothole', 'garbage', 'electricity', 'water', 'drainage', 'traffic', 'others'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                background: filterCategory === cat ? '#1E3A5F' : '#FFFFFF',
                color: filterCategory === cat ? '#FFFFFF' : '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'capitalize',
                cursor: 'pointer'
              }}
            >
              {cat === 'all' ? 'All Complaints' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sorted Queue Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredReports.map((r, index) => {
          const isOverdue = (r.elapsedHours || 0) > (r.slaHours || 48);
          const breakdown = r.priority?.breakdown || {};

          return (
            <div
              key={r.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: isOverdue ? '1.5px solid #FECDD3' : '1px solid #E2E8F0',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: isOverdue
                  ? '0 10px 20px -5px rgba(239, 68, 68, 0.08)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
              }}
            >
              {/* Left: Rank & Details */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 400px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: index === 0 ? '#DC2626' : index < 3 ? '#EA580C' : '#64748B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  #{index + 1}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1E3A5F', fontFamily: 'monospace' }}>
                      {r.id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: isOverdue ? '#FEE2E2' : '#EFF6FF',
                        color: isOverdue ? '#DC2626' : '#2563EB'
                      }}
                    >
                      {isOverdue ? `🚨 SLA EXCEEDED (+${r.elapsedHours - r.slaHours}h)` : `⏳ ${r.slaHours - r.elapsedHours}h remaining`}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                      Ward H/West (Bandra)
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                    {r.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: '#64748B', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} />
                      <span>{r.address}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#475569' }}>
                      <Users size={13} />
                      <span>{r.duplicateCount} Endorsement{r.duplicateCount > 1 ? 's' : ''}</span>
                    </span>
                  </div>

                  {/* Multi-factor Score Breakdown Chips */}
                  {r.priority?.breakdown && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>
                        Base: {breakdown.base}
                      </span>
                      {breakdown.dup > 0 && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#1D4ED8' }}>
                          +Dup Cluster: {breakdown.dup}
                        </span>
                      )}
                      {breakdown.critical > 0 && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}>
                          +Critical Zone: {breakdown.critical}
                        </span>
                      )}
                      {breakdown.aging > 0 && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: '#FFFBEB', color: '#D97706' }}>
                          +Anti-Deadlock Aging: {breakdown.aging}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Score & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Priority Score
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: (r.priorityScore || 70) >= 80 ? '#DC2626' : '#D97706', lineHeight: 1 }}>
                    {r.priorityScore || 75}
                    <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                    Stage {r.statusStep}/6 ({r.status})
                  </div>
                </div>

                {/* Ward Department Action Button */}
                {currentRole === 'ward_engineer' && (
                  <div>
                    {r.statusStep < 5 ? (
                      <button
                        type="button"
                        onClick={() => onProgressStatus(r.id)}
                        style={{
                          background: '#059669',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 16px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)'
                        }}
                      >
                        <Check size={16} />
                        <span>
                          {r.statusStep === 4 ? 'Complete Repair' : 'Advance Stage →'}
                        </span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, background: '#ECFDF5', padding: '6px 12px', borderRadius: '8px' }}>
                        ✓ Repair Done
                      </span>
                    )}
                  </div>
                )}

                {/* MLA View Badge (Monitor Only) */}
                {currentRole === 'mla' && (
                  <div style={{ background: '#F5F3FF', color: '#7C3AED', padding: '6px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700 }}>
                    Audited by MLA Desk
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Mathematical Formula Reference for Officials */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          style={{
            width: '100%',
            padding: '16px 20px',
            background: 'none',
            border: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#D97706" />
            <span>Anti-Deadlock Scoring Formula & Municipal Governance Rules</span>
          </div>
          {showFormulaDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showFormulaDetails && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B', lineHeight: 1.6 }}>
            <p style={{ margin: '14px 0 8px' }}>
              Priority is calculated server-side in <code>Backend/server.js</code> dynamically:
            </p>
            <div style={{ background: '#0F172A', color: '#38BDF8', padding: '12px 16px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              FinalScore = min(100, BaseSeverity + min(35, DuplicateCount × 3.5) + CriticalZoneBonus(24) + TrafficBonus(14) + AgingBonus)
            </div>
            <ul style={{ margin: '10px 0 0', paddingLeft: '20px' }}>
              <li><strong>Critical Zone (+24 pts)</strong>: Complaints within 180m–250m of schools (St. Andrew's) or hospitals (Lilavati).</li>
              <li><strong>Anti-Deadlock Aging (+18 to +45 pts)</strong>: When a complaint exceeds its SLA threshold, its priority score surges hourly so ignored complaints cannot stay buried.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
