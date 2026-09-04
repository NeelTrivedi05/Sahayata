import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Building2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Droplets,
  Layers,
  RotateCcw,
  Star,
  DollarSign,
  AlertCircle,
  X,
  Calendar,
  Users,
  HardHat,
  ShieldCheck,
  Check,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';

export default function HistoricalBmcView({ onSelectComplaintForMap }) {
  // Navigation sub-tabs within Historical View
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'wards' | 'categories' | 'departments' | 'explorer'

  // Global & filtered dataset state
  const [stats, setStats] = useState(null);
  const [wards, setWards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Explorer filters & pagination
  const [explorerData, setExplorerData] = useState([]);
  const [explorerTotal, setExplorerTotal] = useState(0);
  const [explorerPage, setExplorerPage] = useState(1);
  const [explorerPageSize, setExplorerPageSize] = useState(15);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Active filters for Explorer & Stats
  const [filterWard, setFilterWard] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for 35-field Modal Inspector
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Load overview data on mount
  useEffect(() => {
    loadOverviewData();
  }, []);

  // Load paginated complaints whenever explorer controls change
  useEffect(() => {
    if (activeSubTab === 'explorer') {
      loadExplorerComplaints();
    }
  }, [activeSubTab, explorerPage, explorerPageSize, filterWard, filterCategory, filterSeverity, filterStatus, filterYear]);

  const loadOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, wardsRes, catsRes, deptsRes, trendsRes] = await Promise.all([
        api.getBmcStats(),
        api.getBmcWards(),
        api.getBmcCategories(),
        api.getBmcDepartments(),
        api.getBmcTrends()
      ]);

      setStats(statsRes);
      setWards(wardsRes.wards || []);
      setCategories(catsRes.categories || []);
      setDepartments(deptsRes.departments || []);
      setTrends(trendsRes || null);
    } catch (err) {
      console.error('[HistoricalBmcView] Error loading historical data:', err);
      setError('Could not connect to the BMC historical database service. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadExplorerComplaints = async () => {
    setExplorerLoading(true);
    try {
      const params = {
        page: explorerPage,
        pageSize: explorerPageSize
      };
      if (filterWard) params.ward_code = filterWard;
      if (filterCategory) params.category = filterCategory;
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      if (filterYear) params.year = filterYear;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getBmcComplaints(params);
      setExplorerData(res.data || []);
      setExplorerTotal(res.total || 0);
    } catch (err) {
      console.error('[HistoricalBmcView] Error fetching explorer complaints:', err);
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setExplorerPage(1);
    loadExplorerComplaints();
  };

  const resetFilters = () => {
    setFilterWard('');
    setFilterCategory('');
    setFilterSeverity('');
    setFilterStatus('');
    setFilterYear('');
    setSearchQuery('');
    setExplorerPage(1);
  };

  const handleOpenDetailModal = async (complaintId) => {
    setModalLoading(true);
    try {
      const res = await api.getBmcComplaintById(complaintId);
      if (res && res.data) {
        setSelectedComplaint(res.data);
      }
    } catch (err) {
      console.error('[HistoricalBmcView] Error fetching single complaint details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const sev = (severity || '').toLowerCase();
    if (sev === 'critical') {
      return <span style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #F87171', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Critical</span>;
    }
    if (sev === 'high') {
      return <span style={{ background: '#FFEDD5', color: '#9A3412', border: '1px solid #FB923C', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>High</span>;
    }
    if (sev === 'medium') {
      return <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Medium</span>;
    }
    return <span style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Low</span>;
  };

  const getStatusBadge = (status) => {
    const st = (status || '').toLowerCase();
    if (st.includes('resolved')) {
      return <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Resolved</span>;
    }
    if (st.includes('progress')) {
      return <span style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>In Progress</span>;
    }
    if (st.includes('escalated')) {
      return <span style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Escalated</span>;
    }
    if (st.includes('reopened')) {
      return <span style={{ background: '#FDF4FF', color: '#86198F', border: '1px solid #F0ABFC', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Reopened</span>;
    }
    return <span style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>{status}</span>;
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: '#1D4ED8', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>Loading BMC Historical Intelligence Layer...</h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Querying indexed 960,000-complaint database across 24 Mumbai municipal wards.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ margin: '32px', padding: '24px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#991B1B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertCircle size={20} />
          <h4 style={{ margin: 0, fontWeight: 700 }}>BMC Intelligence Offline</h4>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem' }}>{error}</p>
        <button
          onClick={loadOverviewData}
          style={{ marginTop: '14px', background: '#1D4ED8', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const totalComplaintsFormatted = (stats?.totalComplaints || 960000).toLocaleString();
  const totalPages = Math.ceil(explorerTotal / explorerPageSize);

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 1. Header Banner with Strict Source Separation */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px',
          padding: '24px 32px',
          color: '#FFFFFF',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #334155'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  background: '#1D4ED8',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                Source: BMC_HISTORICAL
              </span>
              <span
                style={{
                  background: '#334155',
                  color: '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                Mumbai Municipal Archive (2018–2024)
              </span>
              <span
                style={{
                  background: '#065F46',
                  color: '#A7F3D0',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                Verified Clean (960,000 Records)
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              🏛️ Brihanmumbai Municipal Corporation (BMC) Historical Intelligence
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0, maxWidth: '850px', lineHeight: '1.45' }}>
              Real historical grievance redressal data across Mumbai's 24 administrative municipal wards (A to T).
              Integrated as an intelligence and analytical reference layer separate from live citizen reports.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => {
                setActiveSubTab('explorer');
                setFilterSeverity('Critical');
                setExplorerPage(1);
              }}
              style={{
                background: '#EF4444',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertTriangle size={15} />
              <span>Explore Critical Grievances</span>
            </button>
            <button
              onClick={loadOverviewData}
              style={{
                background: '#1E293B',
                color: '#E2E8F0',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '9px 14px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Metric Summary Cards (35-Field Synthesized KPIs) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Historical Archive</span>
            <Building2 size={18} color="#1D4ED8" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>{totalComplaintsFormatted}</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            Across 24 Wards & 13 Categories
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Historical Resolution Rate</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
            {stats?.resolvedRate || '57.9'}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            {(stats?.resolvedCount || 556014).toLocaleString()} Resolved Cases
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Average Resolution SLA</span>
            <Clock size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
            {stats?.avgResolutionDays || '13.73'} <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>days</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Work Quality: ★ {stats?.avgWorkQualityRating || '3.42'} / 5.0
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Site Inspection Rate</span>
            <HardHat size={18} color="#7C3AED" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
            {stats?.siteInspectionRate || '45.2'}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Physical Field Verification
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Citizen Satisfaction</span>
            <Star size={18} color="#EAB308" fill="#EAB308" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
            {stats?.citizenSatisfactionRate || '76.82'}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            BMC Post-Resolution Survey
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Monsoon Impact Ratio</span>
            <Droplets size={18} color="#0284C7" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
            {stats?.monsoonRate || '33.2'}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            {(stats?.monsoonComplaints || 318720).toLocaleString()} Monsoon Surge Reports
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #E2E8F0',
          marginBottom: '24px',
          overflowX: 'auto'
        }}
      >
        <button
          onClick={() => setActiveSubTab('overview')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'overview' ? '3px solid #1D4ED8' : '3px solid transparent',
            color: activeSubTab === 'overview' ? '#1D4ED8' : '#64748B',
            fontWeight: activeSubTab === 'overview' ? 700 : 600,
            fontSize: '0.88rem',
            padding: '12px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <BarChart3 size={16} />
          <span>Macro Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wards')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'wards' ? '3px solid #1D4ED8' : '3px solid transparent',
            color: activeSubTab === 'wards' ? '#1D4ED8' : '#64748B',
            fontWeight: activeSubTab === 'wards' ? 700 : 600,
            fontSize: '0.88rem',
            padding: '12px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <MapPin size={16} />
          <span>24 Mumbai Wards ({wards.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'categories' ? '3px solid #1D4ED8' : '3px solid transparent',
            color: activeSubTab === 'categories' ? '#1D4ED8' : '#64748B',
            fontWeight: activeSubTab === 'categories' ? 700 : 600,
            fontSize: '0.88rem',
            padding: '12px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} />
          <span>13 Civic Categories</span>
        </button>

        <button
          onClick={() => setActiveSubTab('departments')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'departments' ? '3px solid #1D4ED8' : '3px solid transparent',
            color: activeSubTab === 'departments' ? '#1D4ED8' : '#64748B',
            fontWeight: activeSubTab === 'departments' ? 700 : 600,
            fontSize: '0.88rem',
            padding: '12px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Building2 size={16} />
          <span>Department Performance ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('explorer')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'explorer' ? '3px solid #1D4ED8' : '3px solid transparent',
            color: activeSubTab === 'explorer' ? '#1D4ED8' : '#64748B',
            fontWeight: activeSubTab === 'explorer' ? 700 : 600,
            fontSize: '0.88rem',
            padding: '12px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Search size={16} />
          <span>Complaint Explorer (960k Records)</span>
        </button>
      </div>

      {/* 4. SUB-TAB CONTENT VIEWS */}

      {/* VIEW 1: MACRO OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Category Load Chart */}
            <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Top Grievance Categories by Volume
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>13 Categories</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {categories.slice(0, 6).map((cat, idx) => {
                  const maxCount = categories[0]?.totalComplaints || 1;
                  const pct = Math.round((cat.totalComplaints / maxCount) * 100);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#1E293B' }}>{cat.category}</span>
                        <span style={{ color: '#64748B' }}>
                          <strong>{cat.totalComplaints.toLocaleString()}</strong> ({cat.satisfactionRate}% satisfied)
                        </span>
                      </div>
                      <div style={{ background: '#F1F5F9', height: '8px', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: idx === 0 ? '#1D4ED8' : idx === 1 ? '#2563EB' : idx === 2 ? '#3B82F6' : '#60A5FA',
                            borderRadius: '999px'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Longitudinal Trend (2018 - 2024) */}
            <div style={{ background: '#FFFFFF', padding: '22px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Annual Volume & Resolution SLA (2018–2024)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>7-Year Trend</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(trends?.yearly || []).map((yr, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A', width: '45px' }}>{yr.year}</span>
                      <span style={{ color: '#475569' }}>
                        {yr.totalComplaints.toLocaleString()} complaints
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ color: '#D97706', fontWeight: 600 }}>Avg {yr.avgResolutionDays}d SLA</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>{yr.satisfactionRate}% Sat.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monsoon Seasonal Surge Comparison */}
          {trends?.monsoonComparison && (
            <div
              style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Droplets size={22} color="#0284C7" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0369A1', margin: 0 }}>
                  Seasonal Analytical Findings: Monsoon Surge vs Non-Monsoon Operations
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E0F2FE' }}>
                  <div style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 700, textTransform: 'uppercase' }}>Monsoon Season (June – Sept)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '6px 0' }}>
                    {trends.monsoonComparison.monsoon?.totalComplaints?.toLocaleString()} Reports
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Avg Resolution: <strong>{trends.monsoonComparison.monsoon?.avgResolutionDays} days</strong> • Satisfaction: <strong>{trends.monsoonComparison.monsoon?.satisfactionRate}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Surge categories: Potholes/Roads, Storm Water Drains, Fallen Trees.
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E0F2FE' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Non-Monsoon Baseline (Oct – May)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '6px 0' }}>
                    {trends.monsoonComparison.nonMonsoon?.totalComplaints?.toLocaleString()} Reports
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Avg Resolution: <strong>{trends.monsoonComparison.nonMonsoon?.avgResolutionDays} days</strong> • Satisfaction: <strong>{trends.monsoonComparison.nonMonsoon?.satisfactionRate}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Baseline categories: Garbage Collection, Streetlights, Water Supply.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 24 MUMBAI WARDS PROFILE */}
      {activeSubTab === 'wards' && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Official Mumbai 24 Administrative Municipal Wards Profile
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.82rem' }}>
                Civic burden mapped against population density, slum percentage, resolution days, and citizen satisfaction.
              </p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Ward Code</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Locality / Area Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Zone</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Total Complaints</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Slum Density</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Avg SLA Days</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Inspected %</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Satisfaction</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {wards.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1D4ED8' }}>
                      Ward {w.wardCode}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E293B' }}>
                      {w.wardFullName || w.wardArea}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>
                      {w.zone}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>
                      {w.totalComplaints?.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: w.slumPercentage > 40 ? '#FEF2F2' : '#F1F5F9', color: w.slumPercentage > 40 ? '#B91C1C' : '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        {w.slumPercentage}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#D97706', fontWeight: 700 }}>
                      {w.avgResolutionDays}d
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {w.siteInspectionRate}%
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: w.satisfactionRate >= 75 ? '#059669' : '#D97706' }}>
                      {w.satisfactionRate}%
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => {
                          setFilterWard(w.wardCode);
                          setActiveSubTab('explorer');
                          setExplorerPage(1);
                        }}
                        style={{
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #BFDBFE',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        View Cases
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: 13 CIVIC CATEGORIES */}
      {activeSubTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
          {categories.map((c, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    {c.category}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    Dept: {c.primaryDepartment}
                  </span>
                </div>
                <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {c.totalComplaints.toLocaleString()} Cases
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0', background: '#F8FAFC', padding: '12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Avg Resolution</div>
                  <div style={{ fontWeight: 800, color: '#D97706', fontSize: '0.95rem' }}>{c.avgResolutionDays} days</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Satisfaction</div>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>{c.satisfactionRate}%</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>High/Crit Severity</div>
                  <div style={{ fontWeight: 700, color: '#DC2626' }}>{(c.highSeverityCount || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Avg Est. Cost</div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>₹{(c.avgCost || 0).toLocaleString()}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setFilterCategory(c.category);
                  setActiveSubTab('explorer');
                  setExplorerPage(1);
                }}
                style={{
                  width: '100%',
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '7px 0',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Inspect Category Complaints →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 4: DEPARTMENT PERFORMANCE */}
      {activeSubTab === 'departments' && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              BMC Municipal Departments Operational Efficiency
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.82rem' }}>
              Internal department performance evaluated by reassignments, contractor ratings, field inspections, and resolution days.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Assigned Department</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Total Complaints</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Avg Reassignments</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Avg Resolution Days</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Work Quality</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Site Inspected</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Satisfaction</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Avg Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B' }}>
                      {d.department}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>
                      {d.totalComplaints?.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: d.avgReassignments > 1.2 ? '#DC2626' : '#475569', fontWeight: 600 }}>
                      {d.avgReassignments}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#D97706' }}>
                      {d.avgResolutionDays}d
                    </td>
                    <td style={{ padding: '12px 16px', color: '#D97706', fontWeight: 700 }}>
                      ★ {d.avgWorkQuality} / 5.0
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {d.siteInspectionRate}%
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: d.satisfactionRate >= 75 ? '#059669' : '#D97706' }}>
                      {d.satisfactionRate}%
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      ₹{Number(d.avgCost || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 5: PAGINATED 35-FIELD COMPLAINT EXPLORER */}
      {activeSubTab === 'explorer' && (
        <div>
          {/* Multi-Filter Bar */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '18px 20px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} color="#1D4ED8" />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Historical Record Query Engine</span>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  ({explorerTotal.toLocaleString()} matching records found)
                </span>
              </div>
              <button
                onClick={resetFilters}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RotateCcw size={13} />
                <span>Reset All Filters</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
              {/* Ward Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Ward</label>
                <select
                  value={filterWard}
                  onChange={(e) => { setFilterWard(e.target.value); setExplorerPage(1); }}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFF' }}
                >
                  <option value="">All 24 Wards</option>
                  {wards.map((w, idx) => (
                    <option key={idx} value={w.wardCode}>Ward {w.wardCode} - {w.wardArea}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setExplorerPage(1); }}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFF' }}
                >
                  <option value="">All 13 Categories</option>
                  {categories.map((c, idx) => (
                    <option key={idx} value={c.category}>{c.category}</option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => { setFilterSeverity(e.target.value); setExplorerPage(1); }}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFF' }}
                >
                  <option value="">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setExplorerPage(1); }}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFF' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Resolved">Resolved</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed Without Resolution">Closed Without Resolution</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => { setFilterYear(e.target.value); setExplorerPage(1); }}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', background: '#FFF' }}
                >
                  <option value="">All Years (2018–2024)</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2018">2018</option>
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>Search</label>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="ID (e.g. BMC2024...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                  <button
                    type="submit"
                    style={{ background: '#1D4ED8', color: '#FFF', border: 'none', borderRadius: '6px', padding: '0 10px', cursor: 'pointer' }}
                  >
                    <Search size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Paginated Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Complaint ID</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Ward</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Department</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Severity</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>SLA Days</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Citizen Satisfied</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>35-Field Details</th>
                  </tr>
                </thead>
                <tbody>
                  {explorerLoading ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#1D4ED8' }} />
                        <div>Executing query on indexed BMC historical database...</div>
                      </td>
                    </tr>
                  ) : explorerData.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                        No historical BMC records matched the selected filter criteria. Try broadening your filters.
                      </td>
                    </tr>
                  ) : (
                    explorerData.map((item, idx) => {
                      const h = item.historicalData || {};
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace' }}>
                            {h.complaint_id}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>
                            {h.complaint_date}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>Ward {h.ward_code}</span>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B' }}>{h.ward_area}</span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>
                            {h.complaint_category}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>
                            {h.department_assigned}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {getSeverityBadge(h.severity)}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {getStatusBadge(h.complaint_status)}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#D97706' }}>
                            {h.resolution_days}d
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {h.citizen_satisfied ? (
                              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} /> Yes
                              </span>
                            ) : (
                              <span style={{ color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <X size={14} /> No
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <button
                              onClick={() => handleOpenDetailModal(h.complaint_id)}
                              style={{
                                background: '#1E293B',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={13} />
                              <span>Inspect 35 Fields</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                background: '#F8FAFC'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Showing page <strong>{explorerPage}</strong> of <strong>{totalPages || 1}</strong> ({explorerTotal.toLocaleString()} complaints)
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select
                  value={explorerPageSize}
                  onChange={(e) => { setExplorerPageSize(Number(e.target.value)); setExplorerPage(1); }}
                  style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', background: '#FFF' }}
                >
                  <option value={15}>15 per page</option>
                  <option value={30}>30 per page</option>
                  <option value={50}>50 per page</option>
                </select>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    disabled={explorerPage <= 1}
                    onClick={() => setExplorerPage(p => Math.max(1, p - 1))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: explorerPage <= 1 ? '#F1F5F9' : '#FFFFFF',
                      color: explorerPage <= 1 ? '#94A3B8' : '#1E293B',
                      cursor: explorerPage <= 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <button
                    disabled={explorerPage >= totalPages}
                    onClick={() => setExplorerPage(p => p + 1)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: explorerPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
                      color: explorerPage >= totalPages ? '#94A3B8' : '#1E293B',
                      cursor: explorerPage >= totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 35-FIELD DETAILED INSPECTION MODAL DRAWER */}
      {selectedComplaint && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedComplaint(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #CBD5E1'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '16px 16px 0 0'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: '#1D4ED8', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                    SOURCE: BMC_HISTORICAL
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                    35-Field BMC Record Audit
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {selectedComplaint.historicalData?.complaint_id}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '2px' }}>
                  {selectedComplaint.historicalData?.complaint_category} • {selectedComplaint.historicalData?.ward_area}, Ward {selectedComplaint.historicalData?.ward_code}
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: '#334155',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Categorized 35 Fields */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(() => {
                const d = selectedComplaint.historicalData || {};
                return (
                  <>
                    {/* Category 1: Temporal & Reporting Channel */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        1. Temporal & Channel Metadata
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Complaint Date</span><strong>{d.complaint_date}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Year / Month</span><strong>{d.year} / {d.month}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Monsoon Season</span><strong>{d.is_monsoon_season ? '🌧️ Yes (Monsoon)' : '☀️ Non-Monsoon'}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Time of Day</span><strong>{d.complaint_time_of_day}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Channel</span><strong>{d.complaint_channel}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Complainant Type</span><strong>{d.complainant_type}</strong></div>
                      </div>
                    </div>

                    {/* Category 2: Municipal Ward & Demographics */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        2. Ward Geography & Demographics
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Ward Code & Area</span><strong>Ward {d.ward_code} ({d.ward_area})</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Zone</span><strong>{d.zone}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Ward Type</span><strong>{d.ward_type}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Population Density</span><strong>{d.population_density?.toLocaleString()} / km²</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Slum Population %</span><strong>{d.ward_slum_percentage}%</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Property Type</span><strong>{d.property_type}</strong></div>
                      </div>
                    </div>

                    {/* Category 3: Civic Grievance & Severity */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        3. Grievance & Sensitivity Attributes
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Category</span><strong>{d.complaint_category}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Assigned Department</span><strong>{d.department_assigned}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>BMC Historical Severity</span><div>{getSeverityBadge(d.severity)}</div></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Photo Evidence</span><strong>{d.has_photo_evidence ? '📷 Available in Record' : 'No Photo'}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>GPS Geotagged</span><strong>{d.has_gps_location ? '📍 GPS Tagged' : 'No Coordinates'}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Media / Sensitivity</span><strong>{d.media_attention ? '📰 Media Attention' : 'Standard'} • {d.politically_sensitive ? '⚠️ Sensitive' : 'Normal'}</strong></div>
                      </div>
                    </div>

                    {/* Category 4: Operational Resolution & Contractor Quality */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        4. Resolution & Contractor Quality
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Complaint Status</span><div>{getStatusBadge(d.complaint_status)}</div></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Resolution Days (SLA)</span><strong style={{ color: '#D97706' }}>{d.resolution_days} days</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Number of Reassignments</span><strong>{d.num_reassignments}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Contractor Category</span><strong>{d.contractor_category}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Work Quality Rating</span><strong style={{ color: '#D97706' }}>★ {d.work_quality_rating} / 5.0</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Site Inspected</span><strong>{d.site_inspected ? '✅ Field Inspected' : '❌ Not Inspected'}</strong></div>
                      </div>
                    </div>

                    {/* Category 5: Asset Integrity & Citizen Satisfaction Target */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        5. Asset Lifecycle & Citizen Outcome Target
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Estimated Cost (INR)</span><strong>₹{d.estimated_cost_inr?.toLocaleString()}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Infrastructure Age</span><strong>{d.infrastructure_age_years} years</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Maintenance Gap</span><strong>{d.months_since_last_maintained} months</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Defect Liability Claim</span><strong>{d.defect_liability_claim ? '⚠️ Claim Active' : 'None'}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Repeat Complainant</span><strong>{d.repeat_complainant ? `Yes (${d.prior_complaints_count} prior)` : 'No'}</strong></div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Citizen Satisfied (Target)</span>
                          <strong style={{ color: d.citizen_satisfied ? '#059669' : '#DC2626', fontSize: '0.95rem' }}>
                            {d.citizen_satisfied ? '✅ Satisfied' : '❌ Dissatisfied'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#F8FAFC',
                borderRadius: '0 0 16px 16px'
              }}
            >
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
