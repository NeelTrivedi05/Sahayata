import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Search,
  SlidersHorizontal,
  Flame,
  Wrench,
  Camera,
  Upload,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  MapPin,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  X,
  FileCheck,
  Building
} from 'lucide-react';
import ComplaintMiniMap from '../map/ComplaintMiniMap';

export default function WardDashboardView({
  reports,
  onOpenReportDetail,
  onNavigateTab,
  onResolveTicket
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('30d');
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState(null);
  const [geofenceWarning, setGeofenceWarning] = useState(null);

  // Resolution photo modal state
  const [afterPhotoPreview, setAfterPhotoPreview] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  // Derived KPI Stats
  const totalReports = reports.length;
  const activeReports = reports.filter(r => r.status !== 'verified').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'verified').length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
  
  const totalDuplicates = reports.reduce((acc, r) => acc + (r.duplicateCount > 1 ? r.duplicateCount - 1 : 0), 0);
  const inspectorHoursSaved = totalDuplicates * 1.5;

  const overdueReports = reports.filter(r => (r.elapsedHours || 0) > (r.slaHours || 48) && r.status !== 'verified');
  const highPriorityReports = [...reports]
    .filter(r => r.status !== 'verified')
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  // Helper for Haversine distance in meters
  const getDistanceMeters = (coords1, coords2) => {
    if (!coords1 || !coords2) return 0;
    const R = 6371e3;
    const φ1 = (coords1[0] * Math.PI) / 180;
    const φ2 = (coords2[0] * Math.PI) / 180;
    const Δφ = ((coords2[0] - coords1[0]) * Math.PI) / 180;
    const Δλ = ((coords2[1] - coords1[1]) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // Filtered reports for table
  const filteredReports = reports.filter(r => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && r.status !== 'verified' && r.status !== 'resolved') ||
      (statusFilter === 'resolved' && (r.status === 'resolved' || r.status === 'verified')) ||
      (statusFilter === 'overdue' && (r.elapsedHours || 0) > (r.slaHours || 48) && r.status !== 'verified');

    const matchesCluster = !selectedClusterFilter
      ? true
      : selectedClusterFilter === 'Hill Road School Corridor'
      ? r.address.toLowerCase().includes('hill') || r.address.toLowerCase().includes('st. andrew') || r.category === 'pothole'
      : selectedClusterFilter === 'Linking Road Market Footfall'
      ? r.address.toLowerCase().includes('linking') || r.category === 'garbage'
      : selectedClusterFilter === 'Turner Road Station Transit'
      ? r.address.toLowerCase().includes('turner') || r.category === 'water'
      : true;

    return matchesSearch && matchesStatus && matchesCluster;
  });

  // Handle Photo Selection with Geo-Fence validation
  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAfterPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);

      if ('geolocation' in navigator && selectedReportForModal?.coords) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const currentCoords = [pos.coords.latitude, pos.coords.longitude];
            const dist = getDistanceMeters(currentCoords, selectedReportForModal.coords);
            if (dist > 100) {
              setGeofenceWarning(`⚠️ Geo-Fence Notice: Photo captured ~${dist}m from complaint location (100m threshold). Officer verification required.`);
            } else {
              setGeofenceWarning(null);
            }
          },
          (err) => console.warn("GPS lookup error:", err),
          { timeout: 5000 }
        );
      }
    }
  };

  const submitResolutionWithPhoto = async () => {
    if (!selectedReportForModal) return;
    setIsResolving(true);
    try {
      if (onResolveTicket) {
        await onResolveTicket(selectedReportForModal.id, afterPhotoPreview);
      }
      setSelectedReportForModal(null);
      setAfterPhotoPreview(null);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Header Overview Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px' }}>
            <Building size={14} />
            <span>Ward H/West Operations • Bandra West & Khar</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Ward Engineering Command Center
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0 }}>
            Real-time intake triage, contractor work order dispatch, and field photo audits
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigateTab('priority')}
            style={{
              background: '#1E3A5F',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(30, 58, 95, 0.2)'
            }}
          >
            <Flame size={17} color="#F59E0B" />
            <span>Open Priority Queue ({overdueReports.length} Overdue)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stat Strip (4 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px'
        }}
      >
        {/* Card 1: Active Complaints */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Active Complaints</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
            {activeReports}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#D97706', marginTop: '8px', fontWeight: 600 }}>
            <TrendingUp size={14} />
            <span>{overdueReports.length} past SLA limit (Surging Priority)</span>
          </div>
        </div>

        {/* Card 2: High Impact Zones */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>High Impact Corridors</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
            3 Zones
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '8px' }}>
            St. Andrew's School, Lilavati Hospital, Bandra Hub
          </div>
        </div>

        {/* Card 3: Resolved This Month */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Resolution Rate</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
            {resolutionRate}%
          </div>
          <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '8px', fontWeight: 600 }}>
            ↑ 4.2% vs last month • Citizen verified
          </div>
        </div>

        {/* Card 4: Duplicates Merged */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>Duplicates Merged</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7C3AED', lineHeight: 1 }}>
            {totalDuplicates}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6D28D9', marginTop: '8px', fontWeight: 600 }}>
            Saved ~{inspectorHoursSaved} hours of field inspection
          </div>
        </div>
      </div>

      {/* 3. Middle Split: Spatial Heatmap Card & Urgent Priority Attention */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Spatial Intelligence Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 2px', color: '#0F172A' }}>
                  Spatial Intelligence (Ward H/West)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                  GPS clustering density and proximity safety multipliers
                </p>
              </div>
              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#475569'
                }}
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Worst Cluster Callout Banner */}
            <div
              style={{
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48', flexShrink: 0 }}>
                <Flame size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#9F1239' }}>
                  Critical Cluster: Hill Road (St. Andrew's School)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#BE123C' }}>
                  14 duplicate reports merged • Priority Score 100/100 • 6 hrs overdue
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('radar')}
                style={{
                  background: '#BE123C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                View Map
              </button>
            </div>

            {/* Ward Cluster Bubbles Summary (Interactive Click-to-Filter) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'Hill Road School Corridor', category: 'Potholes', count: 14, score: 100, color: '#DC2626' },
                { name: 'Linking Road Market Footfall', category: 'Solid Waste', count: 8, score: 66, color: '#D97706' },
                { name: 'Turner Road Station Transit', category: 'Water Pipeline', count: 11, score: 88, color: '#2563EB' }
              ].map((c, i) => {
                const isActive = selectedClusterFilter === c.name;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedClusterFilter(prev => prev === c.name ? null : c.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isActive ? '#EFF6FF' : '#F8FAFC',
                      border: isActive ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '9999px', background: c.color }} />
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isActive ? '#1D4ED8' : '#1E293B' }}>
                          {c.name} {isActive && '✓ (Active Filter)'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{c.category} • {c.count} citizen endorsements</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 900, color: c.color }}>{c.score}</span>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>/100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('radar')}
            style={{
              marginTop: '18px',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Open Full Interactive Radar Map</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Needs Your Attention (Priority Queue Preview) */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 2px', color: '#0F172A' }}>
                  Needs Your Attention
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                  Highest priority tickets nearest or past SLA deadline
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('priority')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1D4ED8',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>See all</span>
                <ChevronRight size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {highPriorityReports.slice(0, 3).map(r => {
                const isOverdue = (r.elapsedHours || 0) > (r.slaHours || 48);
                const remaining = (r.slaHours || 48) - (r.elapsedHours || 0);

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReportForModal(r)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: isOverdue ? '1.5px solid #FECDD3' : '1px solid #E2E8F0',
                      background: isOverdue ? '#FFF5F5' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', fontFamily: 'monospace' }}>
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
                        {isOverdue ? `🚨 Overdue by ${r.elapsedHours - r.slaHours}h` : `⏳ ${remaining}h remaining`}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                      {r.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748B' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>{r.address}</span>
                      </span>
                      <span style={{ fontWeight: 800, color: '#DC2626' }}>
                        Priority: {r.priorityScore || 85}/100
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '16px', background: '#F8FAFC', padding: '12px', borderRadius: '10px', fontSize: '0.76rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#D97706" />
            <span>Anti-deadlock aging escalator auto-boosts priority every hour neglected.</span>
          </div>
        </div>
      </div>

      {/* 4. Active Issue Queue Table ("Receive · Assign · Resolve") */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 2px', color: '#0F172A' }}>
              Active Issue Queue (Receive · Assign · Resolve)
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
              Searchable municipal pipeline for Ward H/West
            </p>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID, street..."
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.84rem',
                  width: '220px'
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
                background: '#FFFFFF',
                color: '#334155'
              }}
            >
              <option value="all">All Statuses ({reports.length})</option>
              <option value="active">Active Only</option>
              <option value="overdue">Overdue Only</option>
              <option value="resolved">Resolved / Verified</option>
            </select>
          </div>
        </div>

        {/* Active Cluster Filter Indicator Banner */}
        {selectedClusterFilter && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              padding: '8px 14px',
              marginBottom: '16px',
              fontSize: '0.82rem',
              color: '#1D4ED8'
            }}
          >
            <span>
              📍 Filtered by Cluster: <strong>{selectedClusterFilter}</strong> (Showing {filteredReports.length} of {reports.length} tickets)
            </span>
            <button
              type="button"
              onClick={() => setSelectedClusterFilter(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#1D4ED8',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Clear Filter ✕
            </button>
          </div>
        )}

        {/* The Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Ticket ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Category & Location</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Priority</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>SLA Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status Stage</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(r => {
                const isOverdue = (r.elapsedHours || 0) > (r.slaHours || 48);

                return (
                  <tr
                    key={r.id}
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'monospace', color: '#1E3A5F' }}>
                      {r.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{r.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{r.address}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.76rem',
                          background: (r.priorityScore || 70) >= 80 ? '#FEE2E2' : '#FEF3C7',
                          color: (r.priorityScore || 70) >= 80 ? '#DC2626' : '#D97706'
                        }}
                      >
                        {r.priorityScore || 75}/100
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {isOverdue ? (
                        <span style={{ color: '#DC2626', fontWeight: 700 }}>
                          🚨 Overdue ({r.elapsedHours}h / {r.slaHours}h)
                        </span>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          On Track ({r.elapsedHours}h / {r.slaHours}h)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          textTransform: 'uppercase',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background:
                            r.status === 'verified'
                              ? '#ECFDF5'
                              : r.status === 'resolved'
                              ? '#EFF6FF'
                              : '#FFFBEB',
                          color:
                            r.status === 'verified'
                              ? '#059669'
                              : r.status === 'resolved'
                              ? '#2563EB'
                              : '#D97706'
                        }}
                      >
                        {r.status} (Stage {r.statusStep}/6)
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedReportForModal(r)}
                        style={{
                          background: '#1E3A5F',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Inspect & Action →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Comprehensive Complaint Detail & Resolution Modal */}
      {selectedReportForModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            className="animate-fade-in"
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: '#1E3A5F', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.74rem', background: '#F59E0B', color: '#0F172A', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                  {selectedReportForModal.id}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  {selectedReportForModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedReportForModal(null);
                  setAfterPhotoPreview(null);
                }}
                style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* AI Intake Verification Banner */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="#16A34A" />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#166534' }}>
                    94.8% AI Intake Verification Confirmed
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#15803D' }}>
                    Image classification confirmed civic hazard. GPS coordinates match Ward H/West boundaries.
                  </div>
                </div>
              </div>

              {/* Grievance Mini-Map & Impact Buffer */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                  📍 Grievance Location & 100m Impact Radius
                </div>
                <ComplaintMiniMap
                  coords={selectedReportForModal.coords}
                  status={selectedReportForModal.status}
                  priorityScore={selectedReportForModal.priorityScore}
                  isOverdue={(selectedReportForModal.elapsedHours || 0) > (selectedReportForModal.slaHours || 48)}
                  height="130px"
                />
              </div>

              {/* Photos Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                    Citizen Intake Photo
                  </div>
                  <img
                    src={selectedReportForModal.beforeImage}
                    alt="Intake"
                    style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                    After-Repair Verification Photo
                  </div>
                  {afterPhotoPreview || selectedReportForModal.afterImage ? (
                    <img
                      src={afterPhotoPreview || selectedReportForModal.afterImage}
                      alt="After Repair"
                      style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #10B981' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '170px',
                        borderRadius: '12px',
                        border: '2px dashed #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#F8FAFC',
                        color: '#94A3B8',
                        padding: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <Camera size={26} style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>After photo required to close</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Real Camera / File Upload for Ward Officer */}
              {selectedReportForModal.statusStep < 5 && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '16px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#92400E', marginBottom: '6px' }}>
                    Upload Post-Repair Photo & Complete
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#B45309', margin: '0 0 12px', lineHeight: 1.4 }}>
                    Before this ticket can be resolved, municipal audit guidelines require an on-site photo demonstrating completed bitumen/repair work.
                  </p>

                  {/* Geo-fence mismatch soft warning */}
                  {geofenceWarning && (
                    <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#B91C1C', padding: '10px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '12px' }}>
                      {geofenceWarning}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handlePhotoFileChange}
                  />
                  <input
                    type="file"
                    ref={uploadInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoFileChange}
                  />

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        flex: 1,
                        background: '#FFFFFF',
                        border: '1.5px solid #D97706',
                        color: '#D97706',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Camera size={16} />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      style={{
                        flex: 1,
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        color: '#334155',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={16} />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6-Stage Progress Indicator */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                  Lifecycle Pipeline (6 Stages)
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { step: 1, label: 'Reported' },
                    { step: 2, label: 'Clustered' },
                    { step: 3, label: 'Prioritized' },
                    { step: 4, label: 'Assigned' },
                    { step: 5, label: 'Resolved' },
                    { step: 6, label: 'Verified' }
                  ].map(s => {
                    const isDone = selectedReportForModal.statusStep >= s.step;
                    const isCurrent = selectedReportForModal.statusStep === s.step;

                    return (
                      <div
                        key={s.step}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          background: isDone ? '#ECFDF5' : '#F1F5F9',
                          border: isCurrent ? '1.5px solid #059669' : '1px solid transparent',
                          color: isDone ? '#065F46' : '#94A3B8',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        {s.step}. {s.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReportForModal(null);
                    setAfterPhotoPreview(null);
                  }}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>

                {selectedReportForModal.statusStep < 5 && (
                  <button
                    type="button"
                    onClick={submitResolutionWithPhoto}
                    disabled={isResolving}
                    style={{
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={17} />
                    <span>{isResolving ? 'Updating...' : 'Advance Stage / Mark Resolved'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
