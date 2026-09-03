import React from 'react';
import { User, Wrench, Landmark, Shield, ArrowRight, CheckCircle, Sparkles, Building2 } from 'lucide-react';

export default function RoleSelectLanding({ onSelectRole, onQuickLogin }) {
  const roles = [
    {
      id: 'citizen',
      title: 'Citizen',
      tagline: 'Public Portal',
      description: 'Report civic issues, endorse community concerns to boost priority, and verify completed repairs to earn Civic Karma.',
      badge: 'Sign In or Create Account',
      badgeColor: '#10B981',
      badgeBg: '#ECFDF5',
      icon: <User size={28} color="#1E3A5F" />,
      accentColor: '#1E3A5F',
      actionLabel: 'Sign In as Citizen',
      demoUser: 'Aarav Sharma (Citizen)',
      features: ['File photo grievances with GPS', 'Endorse duplicate issues', 'Earn Karma for verifying repairs']
    },
    {
      id: 'ward_engineer',
      title: 'Ward Department (BMC)',
      tagline: 'Engineering & Operations Desk',
      description: 'Ward H/West official desk. Inspect intake complaints, dispatch field contractors, and upload post-repair verification photos.',
      badge: 'Official Sign In Only',
      badgeColor: '#D97706',
      badgeBg: '#FFFBEB',
      icon: <Wrench size={28} color="#D97706" />,
      accentColor: '#D97706',
      actionLabel: 'Officer Sign In',
      demoUser: 'Er. Rajesh Sawant (Ward Officer)',
      features: ['SLA tracking & anti-deadlock', 'Contractor work orders', 'Upload after-repair proof']
    },
    {
      id: 'mla',
      title: 'MLA Oversight',
      tagline: 'Constituency Monitoring Desk',
      description: 'Executive accountability view for Bandra West / Mumbai Suburban. Monitor ward SLA performance, overdue hotspots, and contractor compliance.',
      badge: 'Legislative Sign In Only',
      badgeColor: '#7C3AED',
      badgeBg: '#F5F3FF',
      icon: <Landmark size={28} color="#7C3AED" />,
      accentColor: '#7C3AED',
      actionLabel: 'Legislator Sign In',
      demoUser: 'Shri Ashish Shelar (MLA)',
      features: ['Real-time ward SLA compliance', 'Neglected hotspot alerts', 'Contractor accountability audit']
    }
  ];

  return (
    <div className="auth-page-wrapper" style={{ padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Top Nav */}
      <div className="auth-top-nav" style={{ maxWidth: '1080px', width: '100%', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🏛️</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E3A5F' }}>
            Brihanmumbai Municipal Corporation (BMC) & Govt. of Maharashtra
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', background: '#FFFFFF', padding: '6px 14px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
          Official Access Portal
        </div>
      </div>

      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF3C7', padding: '6px 14px', borderRadius: '9999px', color: '#92400E', fontSize: '0.8rem', fontWeight: 700, marginBottom: '14px', border: '1px solid #FDE68A' }}>
          <Sparkles size={15} />
          <span>Official Civic Grievance & SLA Anti-Deadlock Network • Ward H/West</span>
        </div>
        <h1 style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Welcome to <span style={{ color: '#1E3A5F' }}>Sahayata</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#475569', margin: '0 0 18px', fontWeight: 500 }}>
          Help at Hand — <strong style={{ color: '#D97706' }}>Your Problem, Our Responsibility</strong>
        </p>

        {/* Distinct Question Banner */}
        <div style={{
          background: '#FFFFFF',
          border: '2px solid #E2E8F0',
          borderRadius: '16px',
          padding: '16px 28px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
          display: 'inline-block',
          maxWidth: '650px'
        }}>
          <h2 style={{ fontSize: '1.28rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
            Are you a Citizen, Ward Official, or MLA?
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0 }}>
            Please select your role below to log in to your dedicated municipal workspace:
          </p>
        </div>
      </div>

      {/* 3 Role Selection Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '1080px',
          width: '100%',
          margin: '0 auto 40px'
        }}
      >
        {roles.map(role => (
          <div
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = role.accentColor;
              e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(15, 23, 42, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(15, 23, 42, 0.05)';
            }}
          >
            {/* Card Top */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: role.badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {role.icon}
                </div>
                <span
                  style={{
                    background: role.badgeBg,
                    color: role.badgeColor,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: `1px solid ${role.badgeColor}33`
                  }}
                >
                  {role.badge}
                </span>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                {role.title}
              </h2>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: role.accentColor, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                {role.tagline}
              </div>

              <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px' }}>
                {role.description}
              </p>

              {/* Feature bullets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {role.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155' }}>
                    <CheckCircle size={14} color="#10B981" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole(role.id);
                }}
                style={{
                  background: role.id === 'citizen' ? '#1E3A5F' : role.id === 'ward_engineer' ? '#D97706' : '#7C3AED',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                }}
              >
                <span>{role.actionLabel}</span>
                <ArrowRight size={17} />
              </button>

              {onQuickLogin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickLogin(role.id);
                  }}
                  style={{
                    background: '#F8FAFC',
                    color: '#334155',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#F1F5F9';
                    e.currentTarget.style.borderColor = role.accentColor;
                    e.currentTarget.style.color = role.accentColor;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.color = '#334155';
                  }}
                  title={`Quick demo access as ${role.demoUser}`}
                >
                  <span>⚡ 1-Click Demo ({role.demoUser.split(' ')[0]})</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem', padding: '16px 0' }}>
        Govt. of Maharashtra & BMC • Ward H/West (Bandra West) Official Civic Network • Helpline: 1916
      </div>
    </div>
  );
}
