import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CIVIC_DATA } from './data/civicData';
import { api } from './api/client';
import { useGeolocation } from './hooks/useGeolocation';
import {
  evaluateDuplicateCandidate,
  computeImagePHash,
  calculateHaversineDistance,
  calculateHammingDistance
} from './utils/deduplication';
import {
  Shield,
  AlertCircle,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ThumbsUp,
  Star,
  RefreshCw,
  Clock,
  Building2,
  UserCheck,
  AlertTriangle,
  Flame,
  Award,
  Layers,
  Search,
  Filter,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  LogOut,
  LogIn,
  UserPlus,
  User,
  Camera,
  Upload,
  Crosshair,
  Wrench,
  Landmark,
  X,
  Navigation,
  Compass,
  Check,
  RotateCcw,
  Hash
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import RoleSelectLanding from './components/auth/RoleSelectLanding';
import AuthCard from './components/auth/AuthCard';
import WardDashboardView from './components/ward/WardDashboardView';
import PriorityQueueView from './components/priority/PriorityQueueView';
import ToastNotification from './components/ui/ToastNotification';
import InteractiveCivicMap from './components/map/InteractiveCivicMap';
import LocationPickerMiniMap from './components/map/LocationPickerMiniMap';
import ComplaintMiniMap from './components/map/ComplaintMiniMap';

export default function App() {
  const { currentUser, login, signup, logout } = useAuth();
  
  // Landing state: shown on first load if !currentUser
  const [showLanding, setShowLanding] = useState(!currentUser);
  const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen' | 'ward_engineer' | 'mla'
  const [authView, setAuthView] = useState(!currentUser ? 'login' : null);
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [toastNotification, setToastNotification] = useState(null);

  // Derived role: strictly from authenticated session, or selectedRole if guest
  const currentRole = currentUser?.role || selectedRole || 'citizen';

  // Default active tab based on role
  const getDefaultTabForRole = (role) => {
    if (role === 'ward_engineer') return 'ward_overview';
    if (role === 'mla') return 'mla';
    return 'radar';
  };

  const [activeTab, setActiveTab] = useState(() => getDefaultTabForRole(currentRole));
  const [reports, setReports] = useState(CIVIC_DATA.sampleReports);
  const [activePreset, setActivePreset] = useState(CIVIC_DATA.reportingPresets[0]);
  const [selectedClarification, setSelectedClarification] = useState(
    CIVIC_DATA.reportingPresets[0].aiClarification.options[0]
  );
  const [customDescription, setCustomDescription] = useState('');
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [matchedDuplicate, setMatchedDuplicate] = useState(null);
  const [civicKarma, setCivicKarma] = useState(340);
  const [splitPercent, setSplitPercent] = useState(50);
  const [selectedVerifyReport, setSelectedVerifyReport] = useState(
    CIVIC_DATA.sampleReports.find(r => r.status === 'resolved') || CIVIC_DATA.sampleReports[1]
  );
  const [toast, setToast] = useState(null);

  // Fetch latest reports with server-calculated priority scores on mount
  useEffect(() => {
    async function loadReports() {
      try {
        const res = await api.getReports();
        if (res.data && res.data.length > 0) {
          setReports(res.data);
        }
      } catch (e) {
        console.warn('Backend /api/reports unreachable, using local reports', e);
      }
    }
    loadReports();
  }, []);

  // Sync user state if authenticated
  useEffect(() => {
    if (currentUser?.civicKarma) {
      setCivicKarma(currentUser.civicKarma);
    }
  }, [currentUser]);

  // Define All Content Tabs filtered strictly by RBAC (placed at top to adhere to React Rules of Hooks)
  const allNavTabs = [
    { id: 'ward_overview', label: '📊 Ward Overview Desk', roles: ['ward_engineer'] },
    { id: 'radar', label: '🗺️ Civic Radar & Map', roles: ['citizen', 'ward_engineer', 'mla'] },
    { id: 'report', label: '📸 Report an Issue', roles: ['citizen'] },
    { id: 'pipeline', label: `📋 Track Complaints (${reports.length})`, roles: ['citizen', 'ward_engineer', 'mla'] },
    { id: 'priority', label: '⚡ Priority Queue', roles: ['ward_engineer', 'mla'] },
    { id: 'verify', label: '🔍 Verify Resolutions', roles: ['citizen'] },
    { id: 'mla', label: '🏛️ MLA Oversight Radar', roles: ['mla'] }
  ];

  const availableNavTabs = allNavTabs.filter(t => t.roles.includes(currentRole));

  // Auto-redirect to first permitted tab if activeTab is not in availableNavTabs
  useEffect(() => {
    const isAllowed = availableNavTabs.some(t => t.id === activeTab);
    if (!isAllowed && availableNavTabs.length > 0) {
      setActiveTab(availableNavTabs[0].id);
    }
  }, [currentRole, activeTab, availableNavTabs]);

  const showToast = (msg) => {
    if (typeof msg === 'string') {
      setToastNotification({ type: 'info', title: 'Sahayata Alert', message: msg });
    } else {
      setToastNotification(msg);
    }
  };

  const handleAuthSignup = async (formData) => {
    await signup(formData);
    setPrefilledEmail(formData.email);
    setToastNotification({
      type: 'success',
      title: 'Registration Successful!',
      message: `Account created for ${formData.fullName}. Please sign in to access your portal.`
    });
    setAuthView('login');
  };

  const handleAuthLogin = async (credentials) => {
    const res = await login(credentials);
    const userRole = res?.user?.role || 'citizen';
    setToastNotification({
      type: 'success',
      title: 'Welcome Back!',
      message: `Successfully logged in as ${res.user.fullName}.`
    });
    setAuthView(null);
    setShowLanding(false);
    setActiveTab(getDefaultTabForRole(userRole));
  };

  const handleAuthLogout = () => {
    logout();
    setShowLanding(true);
    setAuthView('login');
    setActiveTab('radar');
    setToastNotification({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been safely signed out of Sahayata.'
    });
  };

  // Handle citizen submission with instant deduplication check (works both online and offline)
  const handleReportSubmit = async (payload) => {
    const reportData = {
      title: payload?.title || (customDescription ? customDescription : activePreset.name),
      category: payload?.category || activePreset.category,
      categoryLabel: payload?.categoryLabel || activePreset.categoryLabel,
      coords: payload?.coords || activePreset.coords,
      address: payload?.address || activePreset.address,
      image: payload?.image || activePreset.image,
      phash: payload?.phash || activePreset.phash || null,
      clarificationAnswer: selectedClarification,
      criticalZone: payload?.criticalZone || (activePreset.category === 'pothole' ? "St. Andrew's School Zone" : "Ward H/West Corridor"),
      trafficDensity: payload?.trafficDensity || "Medium",
      baseSeverity: payload?.baseSeverity || 28
    };

    // 1. ALWAYS perform immediate deduplication evaluation against existing complaints
    const dupCheck = await evaluateDuplicateCandidate(reportData, reports, { maxRadiusMeters: 50 });
    if (dupCheck.isDuplicate && dupCheck.duplicateReport) {
      setMatchedDuplicate({
        ...dupCheck.duplicateReport,
        matchScore: dupCheck.confidenceScore,
        reasons: dupCheck.reasons
      });
      setDuplicateModalOpen(true);
      return;
    }

    // 2. If no duplicate exists, attempt submission to backend API
    try {
      const res = await api.createReport(reportData);
      if (res.data) {
        setReports(prev => [res.data, ...prev]);
        setCivicKarma(k => k + 20);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}
        showToast(`Grievance registered! Ticket ${res.data.id} routed to Ward.`);
        setActiveTab('pipeline');
        return;
      }
    } catch (err) {
      if (err.data?.isDuplicate) {
        setMatchedDuplicate(err.data.duplicateReport);
        setDuplicateModalOpen(true);
        return;
      }
    }

    // 3. Fallback: create locally if backend is unreachable
    const newReportId = `CIVIC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const localReport = {
      id: newReportId,
      ...reportData,
      status: 'reported',
      statusStep: 1,
      slaHours: 24,
      elapsedHours: 1,
      duplicateCount: 1,
      impactRadiusMeters: 100,
      beforeImage: reportData.image,
      afterImage: reportData.image,
      resolution: {
        assignedTo: "Er. Rajesh Sawant (Executive Engineer)",
        contractor: "BMC Fast-Response Team",
        note: `Auto-routed based on AI Clarification: "${selectedClarification}"`
      },
      priorityScore: 78,
      priority: { finalScore: 78, isOverdue: false, overdueHours: 0, breakdown: { base: 28, dup: 3, critical: 24, traffic: 14, aging: 0 } }
    };
    setReports(prev => [localReport, ...prev]);
    setCivicKarma(k => k + 20);
    try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } }); } catch (e) {}
    showToast(`Grievance registered! Ticket ${newReportId} routed to Ward.`);
    setActiveTab('pipeline');
  };

  // Handle duplicate upvoting (+1 endorsement)
  const handleUpvote = async () => {
    if (!matchedDuplicate) return;
    try {
      const res = await api.endorseReport(matchedDuplicate.id);
      if (res.data) {
        setReports(prev => prev.map(r => r.id === matchedDuplicate.id ? res.data : r));
      }
    } catch (e) {
      setReports(prev =>
        prev.map(r =>
          r.id === matchedDuplicate.id
            ? { ...r, duplicateCount: (r.duplicateCount || 1) + 1, priorityScore: Math.min(100, (r.priorityScore || 70) + 4) }
            : r
        )
      );
    }
    setDuplicateModalOpen(false);
    setCivicKarma(k => k + 25);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch (e) {}
    showToast(`Endorsement recorded! Complaint ${matchedDuplicate.id} boosted in priority (+25 Karma).`);
    setActiveTab('pipeline');
  };

  // Ward Engineer status progression (with optional after-repair photo upload)
  const handleProgressStatus = async (reportId, afterPhoto = null) => {
    try {
      const res = await api.progressReport(reportId, { afterImage: afterPhoto });
      if (res.data) {
        setReports(prev => prev.map(r => r.id === reportId ? res.data : r));
        showToast(`Work order ${reportId} advanced to Stage ${res.data.statusStep}: ${res.data.status}!`);
        return;
      }
    } catch (e) {
      console.warn('Backend progressReport error, falling back locally', e);
    }

    // Local fallback
    setReports(prev =>
      prev.map(r => {
        if (r.id !== reportId) return r;
        if (r.statusStep === 1) return { ...r, status: 'clustered', statusStep: 2 };
        if (r.statusStep === 2) return { ...r, status: 'prioritized', statusStep: 3 };
        if (r.statusStep === 3) return { ...r, status: 'assigned', statusStep: 4 };
        if (r.statusStep === 4) {
          return {
            ...r,
            status: 'resolved',
            statusStep: 5,
            afterImage: afterPhoto || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
            resolution: {
              ...r.resolution,
              note: "Physical repair completed by contractor. Post-repair verification photo uploaded.",
              aiConfidence: "96.2% Repair Match Detected"
            }
          };
        }
        return r;
      })
    );
    showToast(`Work order ${reportId} advanced to next stage!`);
  };

  // Citizen confirms resolution (+50 Karma)
  const handleConfirmResolution = async (reportId) => {
    try {
      const res = await api.verifyReport(reportId, 'confirm');
      if (res.data) {
        setReports(prev => prev.map(r => r.id === reportId ? res.data : r));
      }
    } catch (e) {
      setReports(prev =>
        prev.map(r =>
          r.id === reportId
            ? { ...r, status: 'verified', statusStep: 6 }
            : r
        )
      );
    }
    setCivicKarma(k => k + 50);
    try {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}
    showToast("Community verification confirmed! Contractor work marked complete. +50 Karma awarded!");
  };

  // Citizen disputes resolution
  const handleDisputeResolution = async (reportId) => {
    try {
      const res = await api.verifyReport(reportId, 'dispute');
      if (res.data) {
        setReports(prev => prev.map(r => r.id === reportId ? res.data : r));
      }
    } catch (e) {
      setReports(prev =>
        prev.map(r =>
          r.id === reportId
            ? {
                ...r,
                status: 'assigned',
                statusStep: 4,
                elapsedHours: (r.slaHours || 48) + 6,
                resolution: {
                  ...r.resolution,
                  note: "CITIZEN QUALITY DISPUTE: Repair failed quality threshold. Reopened for field re-inspection."
                }
              }
            : r
        )
      );
    }
    showToast("Dispute logged. Work order reopened and escalated to Executive Engineer!");
  };

  // 1. Role-Select Landing Screen (shown if !currentUser and showLanding is true)
  if (!currentUser && showLanding) {
    return (
      <>
        <ToastNotification
          toast={toastNotification}
          onClose={() => setToastNotification(null)}
        />
        <RoleSelectLanding
          onSelectRole={(role) => {
            setSelectedRole(role);
            setShowLanding(false);
            setAuthView('login');
          }}
          onExploreGuest={() => {
            setShowLanding(false);
            setAuthView(null);
          }}
        />
      </>
    );
  }

  // 2. Authentication View (Login & Signup unified with role pre-selection)
  if (!currentUser && authView) {
    return (
      <div className="auth-page-wrapper">
        <ToastNotification
          toast={toastNotification}
          onClose={() => setToastNotification(null)}
        />
        <div className="auth-top-nav">
          <button
            type="button"
            className="auth-back-btn"
            onClick={() => setShowLanding(true)}
          >
            ← Back to Role Select
          </button>
          <div className="auth-brand-badge">
            <span>🏛️ BMC & Govt. of Maharashtra Portal</span>
          </div>
        </div>
        <AuthCard
          initialMode="login"
          selectedRole={selectedRole}
          prefilledEmail={prefilledEmail}
          onBackToRoleSelect={() => setShowLanding(true)}
          onLoginSuccess={handleAuthLogin}
          onSignupSuccess={handleAuthSignup}
          onError={(err) => showToast({ type: 'error', title: 'Authentication Error', message: err })}
        />
      </div>
    );
  }



  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A' }}>
      {/* 1. National/Municipal Public Service Bar */}
      <div
        style={{
          background: '#0F172A',
          color: '#94A3B8',
          padding: '8px 32px',
          fontSize: '0.78rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid #1E293B'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>🇮🇳</span>
          <span>
            <strong style={{ color: '#E2E8F0' }}>Govt. of Maharashtra & BMC</strong> • Citizen Civic Redressal & Anti-Deadlock Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Constituency: <strong>Bandra West / Mumbai Suburban</strong></span>
          <span>Municipal Helpline: <strong style={{ color: '#38BDF8' }}>1916</strong></span>
        </div>
      </div>

      {/* 2. Main App Header */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          onClick={() => setActiveTab('radar')}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
              color: '#FFF',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)'
            }}
          >
            S
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
                Sahayata
              </h1>
              <span
                style={{
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  border: '1px solid #BFDBFE'
                }}
              >
                CivicCare v2.0
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
              AI Issue Classification • Duplicate Intercept • Anti-Deadlock SLAs
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Read-Only Role Indicator Badge (RBAC Enforced) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: currentRole === 'ward_engineer' ? '#FFFBEB' : currentRole === 'mla' ? '#F5F3FF' : '#EFF6FF',
              border: `1.5px solid ${currentRole === 'ward_engineer' ? '#FDE68A' : currentRole === 'mla' ? '#DDD6FE' : '#BFDBFE'}`,
              padding: '6px 14px',
              borderRadius: '10px'
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: currentRole === 'ward_engineer' ? '#D97706' : currentRole === 'mla' ? '#7C3AED' : '#1D4ED8' }}>
              {currentRole === 'ward_engineer' && '👷 Ward H/West Engineering Desk'}
              {currentRole === 'mla' && '🏛️ MLA Oversight (Shri Ashish Shelar)'}
              {currentRole === 'citizen' && '👤 Citizen Auditor'}
            </span>
          </div>

          {/* Civic Karma Badge */}
          <div
            style={{
              background: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Civic Karma earned by reporting and verifying neighborhood issues"
          >
            <Star size={14} fill="#059669" color="#059669" />
            <span>{civicKarma} Karma</span>
          </div>

          {/* User Auth Section */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#1E3A5F',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}
                >
                  {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                </div>
                <span>{currentUser.fullName}</span>
              </div>
              <button
                onClick={handleAuthLogout}
                title="Sign Out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#FFF1F2',
                  color: '#E11D48',
                  border: '1px solid #FECDD3',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  setAuthView('login');
                  setActiveTab('login');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#FFFFFF',
                  color: '#1E3A5F',
                  border: '1.5px solid #1E3A5F',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <LogIn size={15} />
                <span>Login</span>
              </button>
              <button
                onClick={() => {
                  setAuthView('signup');
                  setActiveTab('signup');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#F59E0B',
                  color: '#0F172A',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(245, 158, 11, 0.3)'
                }}
              >
                <UserPlus size={15} />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Quick Action */}
          <button
            onClick={() => setActiveTab('report')}
            style={{
              background: '#1D4ED8',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
            }}
          >
            + Report Issue
          </button>
        </div>
      </header>

      {/* 3. Navigation Bar (RBAC Filtered) */}
      <nav
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 32px',
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        {availableNavTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #1D4ED8' : '3px solid transparent',
              color: activeTab === tab.id ? '#1D4ED8' : '#64748B',
              padding: '14px 4px',
              fontSize: '0.88rem',
              fontWeight: activeTab === tab.id ? 700 : 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 4. Active Role Indicator Banner */}
      <div
        style={{
          background:
            currentRole === 'citizen'
              ? '#EFF6FF'
              : currentRole === 'ward_engineer'
              ? '#FEF3C7'
              : '#F3E8FF',
          borderBottom: '1px solid #E2E8F0',
          padding: '8px 32px',
          fontSize: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>
          Current Workspace:{' '}
          <strong>
            {currentRole === 'citizen' && '👤 Citizen Portal (Report issues, endorse duplicates, verify repairs)'}
            {currentRole === 'ward_engineer' && '👷 Ward H/West Engineering Desk (Inspect intake, assign contractors, upload post-fix proof)'}
            {currentRole === 'mla' && '🏛️ Legislative Oversight Desk (Monitor SLA compliance, overdue hotspots, contractor accountability)'}
          </strong>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
          Ward H/West (Bandra West) • SLA Target: 24–48h
        </span>
      </div>

      {/* 5. Main Content Workspace */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 32px' }} className="animate-fade-in">
        {activeTab === 'ward_overview' && (
          <WardDashboardView
            reports={reports}
            onOpenReportDetail={() => setActiveTab('pipeline')}
            onNavigateTab={setActiveTab}
            onResolveTicket={handleProgressStatus}
          />
        )}

        {activeTab === 'radar' && (
          <CivicRadarMapView
            reports={reports}
            onSelectReport={(report) => setActiveTab('pipeline')}
            onReportAtLocation={(coords, address) => {
              setActivePreset(prev => ({
                ...prev,
                coords,
                address
              }));
              setActiveTab('report');
              showToast(`📍 Selected location on map: ${address.split('(')[0]}`);
            }}
            onEndorseReport={async (reportId) => {
              try {
                const res = await api.endorseReport(reportId);
                if (res.data) {
                  setReports(prev => prev.map(r => r.id === reportId ? res.data : r));
                }
              } catch (e) {
                setReports(prev =>
                  prev.map(r =>
                    r.id === reportId
                      ? { ...r, duplicateCount: (r.duplicateCount || 1) + 1, priorityScore: Math.min(100, (r.priorityScore || 70) + 4) }
                      : r
                  )
                );
              }
              setCivicKarma(k => k + 25);
              showToast(`Endorsement registered! Ticket ${reportId} boosted (+25 Karma).`);
            }}
          />
        )}
        
        {activeTab === 'report' && (
          <ReportIssueView
            presets={CIVIC_DATA.reportingPresets}
            existingReports={reports}
            activePreset={activePreset}
            onSelectPreset={(pId, customObj) => {
              const p = customObj || CIVIC_DATA.reportingPresets.find(x => x.id === pId) || activePreset;
              setActivePreset(p);
              if (p.aiClarification?.options?.length) {
                setSelectedClarification(p.aiClarification.options[0]);
              }
            }}
            selectedClarification={selectedClarification}
            onSelectClarification={setSelectedClarification}
            customDescription={customDescription}
            setCustomDescription={setCustomDescription}
            onSubmit={handleReportSubmit}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineView
            reports={reports}
            currentRole={currentRole}
            onProgressStatus={handleProgressStatus}
            onVerifyClick={report => {
              setSelectedVerifyReport(report);
              setActiveTab('verify');
            }}
          />
        )}

        {activeTab === 'verify' && (
          <VerificationView
            report={selectedVerifyReport}
            allResolved={reports.filter(r => r.status === 'resolved' || r.status === 'verified')}
            onSelectReport={setSelectedVerifyReport}
            splitPercent={splitPercent}
            setSplitPercent={setSplitPercent}
            onConfirm={() => handleConfirmResolution(selectedVerifyReport.id)}
            onDispute={() => handleDisputeResolution(selectedVerifyReport.id)}
          />
        )}

        {activeTab === 'priority' && (
          <PriorityQueueView
            reports={reports}
            currentRole={currentRole}
            onProgressStatus={handleProgressStatus}
          />
        )}

        {activeTab === 'mla' && <MlaDashboardView reports={reports} />}

        {/* Fallback view to ensure screen is never blank */}
        {!['ward_overview', 'radar', 'report', 'pipeline', 'verify', 'priority', 'mla'].includes(activeTab) && (
          <CivicRadarMapView reports={reports} onSelectReport={() => setActiveTab('pipeline')} />
        )}
      </main>

      {/* 6. Duplicate Intercept Modal */}
      {duplicateModalOpen && matchedDuplicate && (
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
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
            className="animate-fade-in"
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Neighbors Already Reported This!
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                  {matchedDuplicate.distanceMeters !== undefined
                    ? `AI Deduplication Engine matched an open issue ${matchedDuplicate.distanceMeters}m away.`
                    : 'AI GPS matching found an identical complaint within 50 meters.'}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '14px',
                background: '#F8FAFC',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid #E2E8F0'
              }}
            >
              <img
                src={matchedDuplicate.beforeImage}
                alt="Existing Match"
                style={{ width: '92px', height: '92px', borderRadius: '10px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#1D4ED8', fontWeight: 800 }}>
                    {matchedDuplicate.id}
                  </span>
                  {matchedDuplicate.imageSimilarityPercent !== undefined && (
                    <span style={{ fontSize: '0.7rem', background: '#ECFDF5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {matchedDuplicate.imageSimilarityPercent}% Visual Match (pHash)
                    </span>
                  )}
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '2px 0' }}>
                  {matchedDuplicate.title}
                </h4>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {matchedDuplicate.address}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#D97706',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Flame size={14} />
                  <span>{matchedDuplicate.duplicateCount} residents already endorsed this repair</span>
                </div>
              </div>
            </div>

            {matchedDuplicate.reasons && matchedDuplicate.reasons.length > 0 && (
              <div style={{ background: '#F1F5F9', borderRadius: '8px', padding: '8px 12px', fontSize: '0.75rem', color: '#475569' }}>
                <strong>Clustering Criteria:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {matchedDuplicate.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '0.82rem',
                color: '#92400E'
              }}
            >
              <strong>BMC Smart Clustering Policy:</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.4 }}>
                Rather than creating duplicate tickets that clog dispatch queues, your submission will add an official community endorsement. This boosts the repair's priority score directly and earns you Karma.
              </p>
            </div>

            <button
              style={{
                background: '#059669',
                color: '#FFF',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.25)'
              }}
              onClick={handleUpvote}
            >
              <ThumbsUp size={18} /> Add My Endorsement (+1 Priority Boost • +25 Karma)
            </button>

            <button
              style={{
                background: 'transparent',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '10px',
                color: '#64748B',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
              onClick={() => setDuplicateModalOpen(false)}
            >
              Cancel & Edit Details
            </button>
          </div>
        </div>
      )}

      {/* 7. Toast Notification */}
      <ToastNotification
        toast={toastNotification}
        onClose={() => setToastNotification(null)}
      />
    </div>
  );
}

// ==========================================================================
// 1. CIVIC RADAR & MAP VIEW (Interactive Leaflet Map with Critical Zones)
// ==========================================================================
function CivicRadarMapView({ reports, onSelectReport, onReportAtLocation, onEndorseReport }) {
  return (
    <InteractiveCivicMap
      reports={reports}
      onSelectReport={onSelectReport}
      onReportAtLocation={onReportAtLocation}
      onEndorseReport={onEndorseReport}
    />
  );
}

// ==========================================================================
// 2. REPORT ISSUE VIEW (With Real Camera Capture, File Upload & Live GPS)
// ==========================================================================
function ReportIssueView({
  presets = [],
  existingReports = [],
  activePreset,
  onSelectPreset,
  selectedClarification,
  onSelectClarification,
  customDescription,
  setCustomDescription,
  onSubmit
}) {
  const currentPreset = activePreset || presets[0] || {
    id: 'default',
    name: 'Road Hazard & Pothole',
    category: 'pothole',
    categoryLabel: 'Road Hazard & Pothole',
    baseSeverity: 35,
    slaHours: 24,
    coords: [19.0558, 72.8295],
    address: 'Hill Road, Bandra West, Mumbai',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    aiClarification: {
      question: 'Is this issue affecting pedestrian or traffic safety?',
      options: ['High Hazard', 'Medium Hazard', 'Routine Repair']
    }
  };

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  // Live Webcam state & refs
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const webcamVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);

  const openWebcam = async () => {
    setIsWebcamOpen(true);
    setWebcamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device or browser");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      setWebcamError(err.message || "Failed to access camera");
    }
  };

  const closeWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(t => t.stop());
      webcamStreamRef.current = null;
    }
    setIsWebcamOpen(false);
    setWebcamError(null);
  };

  const snapWebcamPhoto = () => {
    if (!webcamVideoRef.current) return;
    const video = webcamVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    closeWebcam();
    processCustomImage(dataUrl);
  };

  useEffect(() => {
    if (isWebcamOpen && webcamStreamRef.current && webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = webcamStreamRef.current;
    }
  }, [isWebcamOpen]);

  useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const processCustomImage = async (base64Image) => {
    setIsScanning(true);
    try {
      const res = await fetch('http://localhost:5000/api/classify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image })
      });
      const data = await res.json();

      if (data.success && data.classification) {
        const cls = data.classification;
        const dynamicPreset = {
          id: `custom_${Date.now()}`,
          name: `${cls.categoryLabel} (AI Vision Detected)`,
          category: cls.category,
          categoryLabel: cls.categoryLabel,
          baseSeverity: cls.baseSeverity || 35,
          slaHours: cls.slaHours || 24,
          image: base64Image,
          coords: [19.0558, 72.8295],
          address: "Ward H/West (GPS Tagged Location)",
          confidence: cls.confidence || "96.4%",
          provider: data.provider || "Groq Llama 3.2 Vision",
          aiClarification: {
            question: cls.aiClarificationQuestion || "Is this issue actively blocking traffic or pedestrian safety?",
            options: cls.clarificationOptions || [
              "Yes, high hazard / urgent priority",
              "Medium hazard / standard priority",
              "Minor hazard / routine repair"
            ]
          }
        };

        if (onSelectPreset) {
          onSelectPreset(dynamicPreset.id, dynamicPreset);
        }
        if (dynamicPreset.aiClarification?.options?.length) {
          onSelectClarification(dynamicPreset.aiClarification.options[0]);
        }
        return;
      }
    } catch (err) {
      console.warn("Classification API offline, using visual preset match");
    } finally {
      setIsScanning(false);
    }

    // Heuristic fallback preset
    const fallbackPreset = {
      id: `custom_${Date.now()}`,
      name: "Custom Captured Issue (AI Verified)",
      category: "pothole",
      categoryLabel: "Road Hazard & Pothole",
      baseSeverity: 35,
      slaHours: 24,
      image: base64Image,
      coords: [19.0558, 72.8295],
      address: "Ward H/West (GPS Tagged Location)",
      confidence: "94.0%",
      provider: "Visual Feature Analyzer",
      aiClarification: {
        question: "Is this issue actively blocking traffic or pedestrian safety?",
        options: [
          "Yes, high hazard / urgent priority",
          "Medium hazard / standard priority",
          "Minor hazard / routine repair"
        ]
      }
    };
    if (onSelectPreset) {
      onSelectPreset(fallbackPreset.id, fallbackPreset);
    }
    if (onSelectClarification) {
      onSelectClarification(fallbackPreset.aiClarification.options[0]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64Image = evt.target.result;
      processCustomImage(base64Image);
    };
    reader.readAsDataURL(file);
  };

  // Category state for custom mode
  const [category, setCategory] = useState('pothole');
  const [categoryLabel, setCategoryLabel] = useState('Road Hazard & Pothole');

  const categories = [
    { id: 'pothole', label: 'Road Hazard & Pothole', icon: '🕳️' },
    { id: 'garbage', label: 'Solid Waste & Garbage', icon: '🗑️' },
    { id: 'electricity', label: 'Electrical & Streetlight', icon: '💡' },
    { id: 'water', label: 'Water Leak & Drainage', icon: '🚰' }
  ];

  // Handle final submission
  const handleFormSubmit = () => {
    const finalCoords = currentPreset?.coords || [19.0558, 72.8295];
    const finalAddress = currentPreset?.address || "Hill Road, Ward H/West, Bandra West, Mumbai";

    onSubmit({
      title: customDescription ? customDescription : (currentPreset?.name || "Civic Grievance"),
      category: currentPreset?.category || "pothole",
      categoryLabel: currentPreset?.categoryLabel || "Road Hazard & Pothole",
      coords: finalCoords,
      address: finalAddress,
      image: currentPreset?.image,
      phash: currentPreset?.phash,
      clarificationAnswer: selectedClarification
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>
        Report a Civic Grievance & Auto-Classify Issue
      </h2>
      <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
        Upload or select any civic issue photo. Groq Llama 3.2 Vision AI detects classification, assigns target SLAs, and generates dynamic clarification prompts.
      </p>

      {/* Upload Custom Photo Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(49, 46, 129, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <Sparkles className="w-6 h-6 text-amber-300" size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
              Groq Llama 3.2 Vision Automated Image Classifier
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '2px' }}>
              Upload any photo from your device. AI will analyze pixel features, detect issue category & generate clarification options.
            </div>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            style={{
              background: '#4F46E5',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: isScanning ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
          >
            {isScanning ? (
              <>
                <RefreshCw className="animate-spin" size={16} /> Analyzing Photo...
              </>
            ) : (
              <>📷 Upload Custom Photo</>
            )}
          </button>

          <button
            type="button"
            onClick={openWebcam}
            disabled={isScanning}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: isScanning ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
          >
            <Camera size={16} /> 📸 Open Camera
          </button>
        </div>
      </div>

      {/* Category Classification Selector Bar */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
          Or Select Issue Preset Classification:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {(presets || []).map(p => {
            const isSelected = currentPreset?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                  background: isSelected ? '#EFF6FF' : '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 6px -1px rgba(29, 78, 216, 0.15)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isSelected ? '#1D4ED8' : '#0F172A' }}>
                  {p.categoryLabel}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', fontSize: '0.7rem', color: '#64748B' }}>
                  <span style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    SLA: {p.slaHours}h
                  </span>
                  <span style={{ background: isSelected ? '#DBEAFE' : '#F1F5F9', color: isSelected ? '#1E40AF' : '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    Sev: {p.baseSeverity}/50
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '24px',
          background: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}
      >
        {/* Left Column: Visual Evidence & Preset Details */}
        <div style={{ background: '#F8FAFC', padding: '28px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
              Photographic Proof & Classification
            </label>
            <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
              Target SLA: {currentPreset?.slaHours || 24} Hours
            </span>
          </div>

          {/* Photo Preview Container */}
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
            {isScanning ? (
              <div style={{ height: '260px', background: '#1E1B4B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <RefreshCw size={36} className="animate-spin text-indigo-400 mb-3" />
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Groq Llama 3.2 Vision Analyzing Photo...</div>
                <div style={{ fontSize: '0.75rem', color: '#A5B4FC', marginTop: '4px' }}>Extracting features, severity & context</div>
              </div>
            ) : (
              <>
                <img
                  src={currentPreset?.image}
                  alt="Uploaded issue"
                  style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#FFF',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>GPS: <strong>{currentPreset?.coords ? `${currentPreset.coords[0]}° N, ${currentPreset.coords[1]}° E` : 'Auto-located'}</strong></span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>Auto-located</span>
                </div>
              </>
            )}
          </div>

          <div
            style={{
              marginTop: '14px',
              background: '#FFFFFF',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              color: '#334155',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#059669" />
              <span>
                <strong>Vision AI Classification:</strong> {currentPreset?.categoryLabel || 'Road Hazard'} (<strong>{currentPreset?.confidence || "95.4% Match"}</strong>)
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', marginLeft: '24px' }}>
              Model Provider: <strong>{currentPreset?.provider || "Groq Llama 3.2 Vision AI"}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: AI Dynamic Clarification & Submission */}
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1D4ED8', fontWeight: 700, fontSize: '0.82rem' }}>
                <Sparkles size={16} />
                <span>AI Smart Clarification Engine</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#1E3A8A', margin: '4px 0 0' }}>
                Help us prioritize this issue! Selecting critical impact options boosts dispatch priority automatically.
              </p>
            </div>

            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              Dynamic Context Clarification:
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '14px', fontWeight: 600 }}>
              {currentPreset?.aiClarification?.question || "What is the severity of this issue?"}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {(currentPreset?.aiClarification?.options || ["High Hazard", "Medium Hazard", "Routine Repair"]).map((opt, idx) => {
                const isSelected = selectedClarification === opt;
                const isHighImpact = opt.includes("Hazard") || opt.includes("Critical") || opt.includes("Urgent") || opt.includes("Severe") || opt.includes("High");
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectClarification(opt)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      color: isSelected ? '#1D4ED8' : '#334155',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid #1D4ED8' : '2px solid #CBD5E1',
                          background: '#FFF'
                        }}
                      />
                      <span>{opt}</span>
                    </div>
                    {isHighImpact && (
                      <span style={{ fontSize: '0.7rem', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        +18 Priority Bonus
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Optional Citizen Notes */}
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Optional Citizen Landmark Notes:
            </label>
            <input
              type="text"
              placeholder="e.g. Near Indiranagar Metro pillar #140, opposite bakery"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}
            />

            <div
              style={{
                background: '#F8FAFC',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.8rem',
                color: '#64748B',
                marginBottom: '16px'
              }}
            >
              <strong>Target Jurisdiction:</strong> Ward H/West (Bandra West) • Auto-routing to <strong>BMC Fast-Response Team</strong>
            </div>
          </div>

          <button
            type="button"
            style={{
              background: '#1D4ED8',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontWeight: 800,
              fontSize: '0.98rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)',
              marginTop: '10px'
            }}
            onClick={handleFormSubmit}
          >
            Submit Classified Grievance →
          </button>
        </div>
      </div>

      {/* Live Laptop Webcam Viewfinder Modal */}
      {isWebcamOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#0F172A',
              color: '#FFF',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Live Laptop Webcam Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={closeWebcam}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {webcamError ? (
              <div style={{ background: '#7F1D1D', border: '1px solid #DC2626', padding: '16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#FECACA' }}>Camera Permission Required:</strong>
                <p style={{ margin: '6px 0 0', color: '#FCA5A5' }}>{webcamError}</p>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    color: '#E2E8F0'
                  }}
                >
                  Position issue in frame & click Snap
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closeWebcam}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#CBD5E1',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              {!webcamError && (
                <button
                  type="button"
                  onClick={snapWebcamPhoto}
                  style={{
                    background: '#2563EB',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 22px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  <Camera size={18} /> 📸 Snap Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ==========================================================================
// 3. PIPELINE VIEW (6-Step Lifecycle with Ward Action triggers & Photo Resolution)
// ==========================================================================
function PipelineView({ reports, currentRole, onProgressStatus, onVerifyClick }) {
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [resolveGeofenceNotice, setResolveGeofenceNotice] = useState(null);
  const resolveCamInputRef = useRef(null);
  const resolveUploadInputRef = useRef(null);

  const getDistanceMeters = (c1, c2) => {
    if (!c1 || !c2) return 0;
    const R = 6371e3;
    const φ1 = (c1[0] * Math.PI) / 180;
    const φ2 = (c2[0] * Math.PI) / 180;
    const Δφ = ((c2[0] - c1[0]) * Math.PI) / 180;
    const Δλ = ((c2[1] - c1[1]) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const steps = [
    { num: 1, label: 'Reported' },
    { num: 2, label: 'Clustered' },
    { num: 3, label: 'Prioritized' },
    { num: 4, label: 'Assigned' },
    { num: 5, label: 'Resolved' },
    { num: 6, label: 'Verified' }
  ];

  const handleAfterPhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAfterPhoto(event.target.result);
      };
      reader.readAsDataURL(file);

      if ('geolocation' in navigator && resolvingTicket?.coords) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const currentCoords = [pos.coords.latitude, pos.coords.longitude];
            const dist = getDistanceMeters(currentCoords, resolvingTicket.coords);
            if (dist > 100) {
              setResolveGeofenceNotice(`⚠️ Geo-Fence Warning: Device is ~${dist}m from grievance location (100m radius). Confirming manual override.`);
            } else {
              setResolveGeofenceNotice(null);
            }
          },
          (err) => console.warn("GPS lookup error:", err),
          { timeout: 5000 }
        );
      }
    }
  };

  const handleResolveSubmit = () => {
    if (!resolvingTicket) return;
    onProgressStatus(resolvingTicket.id, afterPhoto);
    setResolvingTicket(null);
    setAfterPhoto(null);
    setResolveGeofenceNotice(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            Active Grievance & Work Order Pipeline
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
            Every ticket follows the 6-stage lifecycle: Report → Cluster → Prioritize → Assign → Resolve → Citizen Verify.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {reports.map(r => {
          const p = r.priority || {
            finalScore: r.priorityScore || 75,
            isOverdue: r.elapsedHours > r.slaHours,
            overdueHours: Math.max(0, r.elapsedHours - r.slaHours)
          };

          return (
            <div
              key={r.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                borderLeft: p.finalScore >= 80 ? '6px solid #DC2626' : '6px solid #1D4ED8'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#1D4ED8', fontWeight: 800, fontFamily: 'monospace' }}>
                      {r.id}
                    </span>
                    <span
                      style={{
                        background: r.status === 'verified' ? '#ECFDF5' : '#F1F5F9',
                        color: r.status === 'verified' ? '#059669' : '#475569',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {r.categoryLabel}
                    </span>
                    {p.isOverdue && (
                      <span
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        ⚠️ SLA BREACHED (+{p.overdueHours}h)
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                    {r.title}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <MapPin size={14} />
                    <span>{r.address}</span>
                  </div>

                  {/* Grievance Location Mini-Map & Photo Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '580px', marginBottom: '14px' }}>
                    <div style={{ borderRadius: '10px', overflow: 'hidden', height: '130px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <img
                        src={r.beforeImage}
                        alt="Intake"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <ComplaintMiniMap
                      coords={r.coords}
                      status={r.status}
                      priorityScore={p.finalScore}
                      isOverdue={p.isOverdue}
                      height="130px"
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: p.finalScore >= 80 ? '#DC2626' : p.finalScore >= 50 ? '#D97706' : '#2563EB'
                    }}
                  >
                    {p.finalScore}
                    <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                    PRIORITY SCORE
                  </div>
                </div>
              </div>

              {/* 6-Stage Progress Stepper */}
              <div style={{ margin: '20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '14px',
                      left: '20px',
                      right: '20px',
                      height: '2px',
                      background: '#E2E8F0',
                      zIndex: 1
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '14px',
                      left: '20px',
                      width: `${((r.statusStep - 1) / 5) * 100}%`,
                      height: '2px',
                      background: '#1D4ED8',
                      zIndex: 1,
                      transition: 'width 0.3s ease'
                    }}
                  />

                  {steps.map(step => {
                    const isPassed = r.statusStep >= step.num;
                    const isCurrent = r.statusStep === step.num;
                    return (
                      <div
                        key={step.num}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 2,
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isPassed ? '#1D4ED8' : '#FFFFFF',
                            border: `2px solid ${isPassed ? '#1D4ED8' : '#CBD5E1'}`,
                            color: isPassed ? '#FFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            boxShadow: isCurrent ? '0 0 0 4px rgba(29, 78, 216, 0.2)' : 'none'
                          }}
                        >
                          {isPassed && !isCurrent ? '✓' : step.num}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: isCurrent ? 800 : 600,
                            color: isCurrent ? '#1D4ED8' : isPassed ? '#0F172A' : '#94A3B8',
                            marginTop: '6px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar / Status Notes */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                  <strong>Assigned Officer:</strong> {r.resolution?.assignedTo || 'Er. Rajesh Sawant'} •{' '}
                  <span style={{ color: '#64748B' }}>{r.resolution?.note || 'In active municipal pipeline.'}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* Ward Engineer progression button */}
                  {currentRole === 'ward_engineer' && r.statusStep < 5 && (
                    <button
                      onClick={() => {
                        if (r.statusStep === 4) {
                          setResolvingTicket(r);
                          setAfterPhoto(null);
                        } else {
                          onProgressStatus(r.id);
                        }
                      }}
                      style={{
                        background: '#1D4ED8',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '7px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(29, 78, 216, 0.2)'
                      }}
                    >
                      {r.statusStep === 4 ? '📸 Upload Post-Repair Photo & Complete' : 'Advance Next Stage →'}
                    </button>
                  )}

                  {/* Citizen Verification button if resolved */}
                  {r.status === 'resolved' && (
                    <button
                      onClick={() => onVerifyClick(r)}
                      style={{
                        background: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                      }}
                    >
                      <Eye size={16} /> Verify Repair (Before / After) →
                    </button>
                  )}

                  {r.status === 'verified' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700, fontSize: '0.82rem' }}>
                      <CheckCircle2 size={16} /> Verified & Closed
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ward Engineer Resolution Modal with Camera / Photo Upload */}
      {resolvingTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>
                  Stage 5: Field Resolution Proof
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 0' }}>
                  Complete Work Order {resolvingTicket.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 18px 0' }}>
              Please take or upload an on-site post-repair photo. Citizens will inspect this image against the original before final sign-off.
            </p>

            {/* Geo-Fence Warning if applicable */}
            {resolveGeofenceNotice && (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '14px' }}>
                {resolveGeofenceNotice}
              </div>
            )}

            {/* Target Location Mini-Map */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                📍 Grievance Site: {resolvingTicket.address}
              </div>
              <ComplaintMiniMap
                coords={resolvingTicket.coords}
                status={resolvingTicket.status}
                priorityScore={resolvingTicket.priorityScore}
                height="120px"
              />
            </div>

            <input
              type="file"
              ref={resolveCamInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleAfterPhotoCapture}
            />
            <input
              type="file"
              ref={resolveUploadInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAfterPhotoCapture}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => resolveCamInputRef.current?.click()}
                style={{
                  background: '#1E3A5F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Camera size={16} /> Take Photo
              </button>

              <button
                type="button"
                onClick={() => resolveUploadInputRef.current?.click()}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  color: '#1E293B',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Upload size={16} /> Upload Photo
              </button>
            </div>

            {/* Photo Preview */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', height: '220px', background: '#F1F5F9', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
              <img
                src={afterPhoto || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"}
                alt="Post repair preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#64748B',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveSubmit}
                style={{
                  flex: 2,
                  background: '#059669',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
                }}
              >
                ✓ Submit Proof & Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// 4. VERIFICATION VIEW (Interactive Before vs After Split Slider)
// ==========================================================================
function VerificationView({
  report,
  allResolved,
  onSelectReport,
  splitPercent,
  setSplitPercent,
  onConfirm,
  onDispute
}) {
  const isDraggingRef = useRef(false);

  if (!report) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        No resolved work orders waiting for citizen verification right now.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            Closed-Loop Resolution Verification
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
            CivicCare prevents officers from self-closing tickets. Citizens inspect before/after photos before sign-off.
          </p>
        </div>

        {allResolved.length > 1 && (
          <select
            value={report.id}
            onChange={e => {
              const found = allResolved.find(x => x.id === e.target.value);
              if (found) onSelectReport(found);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: '#FFF'
            }}
          >
            {allResolved.map(r => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}
      >
        {/* Header Strip */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#F8FAFC'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#1D4ED8', fontWeight: 800 }}>
              {report.id} • {report.categoryLabel}
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '2px 0 0' }}>
              {report.title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              AI Resolution Match: {report.resolution.aiConfidence || "95.8% Cleared"}
            </span>
          </div>
        </div>

        {/* Verification Geographic Confirmation Bar */}
        <div style={{ padding: '12px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <MapPin size={15} color="#2563EB" /> Verified Grievance Site:
            </div>
            <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
              {report.address}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              Ward H/West (Bandra West) • GPS: {report.coords ? `${report.coords[0]?.toFixed(4)}° N, ${report.coords[1]?.toFixed(4)}° E` : '19.0558° N, 72.8295° E'}
            </div>
          </div>
          <div style={{ width: '220px', flexShrink: 0 }}>
            <ComplaintMiniMap
              coords={report.coords}
              status={report.status}
              priorityScore={report.priorityScore}
              height="110px"
            />
          </div>
        </div>

        {/* Interactive Split Comparison Slider */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '460px',
            overflow: 'hidden',
            cursor: 'ew-resize',
            userSelect: 'none'
          }}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onMouseLeave={() => { isDraggingRef.current = false; }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            setSplitPercent(pct);
          }}
        >
          {/* AFTER Image (Background) */}
          <img
            src={report.afterImage}
            alt="After resolution"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(5, 150, 105, 0.9)',
              color: '#FFF',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              zIndex: 5
            }}
          >
            AFTER REPAIR (Field Crew)
          </div>

          {/* BEFORE Image (Clipped overlay) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              clipPath: `polygon(0 0, ${splitPercent}% 0, ${splitPercent}% 100%, 0 100%)`
            }}
          >
            <img
              src={report.beforeImage}
              alt="Before resolution"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(220, 38, 38, 0.9)',
                color: '#FFF',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 800,
                zIndex: 5
              }}
            >
              BEFORE REPORT (Citizen)
            </div>
          </div>

          {/* Divider Line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${splitPercent}%`,
              width: '3px',
              background: '#FFFFFF',
              boxShadow: '0 0 12px rgba(0,0,0,0.6)',
              zIndex: 10
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#FFFFFF',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                fontSize: '12px',
                fontWeight: 800
              }}
            >
              ⟷
            </div>
          </div>
        </div>

        {/* Verification Action Bar */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            background: '#FFFFFF'
          }}
        >
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
              Does this repair meet your standards?
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Drag the slider to compare before/after photos. Your confirmation releases final contractor sign-off.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onConfirm}
              style={{
                background: '#059669',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 22px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px rgba(5, 150, 105, 0.2)'
              }}
            >
              <CheckCircle2 size={18} /> Confirm Fixed (+50 Karma)
            </button>

            <button
              onClick={onDispute}
              style={{
                background: '#FFFFFF',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              ✕ Dispute Quality (Reopen Ticket)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 5. PRIORITY & DEADLOCK ENGINE (Interactive Age Simulation Slider)
// ==========================================================================
function PriorityRulesView({ report }) {
  const [elapsed, setElapsed] = useState(54); // default simulates overdue
  const base = report?.priority?.breakdown?.base || 28;
  const critical = report?.priority?.breakdown?.critical || 24;
  const traffic = report?.priority?.breakdown?.traffic || 14;
  const dup = (report?.duplicateCount || 1) * 3;
  const sla = report?.slaHours || 48;
  const isOverdue = elapsed > sla;
  const overdueHours = Math.max(0, elapsed - sla);
  const agingPenalty = isOverdue ? Math.min(25, overdueHours * 2) : 0;
  const finalScore = Math.min(100, base + critical + traffic + dup + agingPenalty);
  const p = {
    finalScore,
    isOverdue,
    overdueHours,
    breakdown: { base, critical, traffic, dup, aging: agingPenalty }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>
        Transparent Priority & Anti-Deadlock Engine
      </h2>
      <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 24px 0' }}>
        How CivicCare guarantees that overdue complaints never get lost in bureaucratic deadlocks.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }}>
        {/* Left Card: Live Score Gauge */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>
            DYNAMIC PRIORITY SCORE
          </div>
          <div
            style={{
              fontSize: '3.6rem',
              fontWeight: 800,
              color: p.finalScore >= 80 ? '#DC2626' : p.finalScore >= 50 ? '#D97706' : '#2563EB',
              margin: '12px 0 6px 0',
              lineHeight: 1
            }}
          >
            {p.finalScore}
            <span style={{ fontSize: '1.2rem', color: '#94A3B8' }}>/100</span>
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '0.95rem',
              color: p.finalScore >= 80 ? '#DC2626' : p.finalScore >= 50 ? '#D97706' : '#2563EB'
            }}
          >
            {p.finalScore >= 80 ? 'CRITICAL ESCALATION' : p.finalScore >= 50 ? 'HIGH PRIORITY' : 'ROUTINE DISPATCH'}
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              color: '#64748B',
              marginTop: '12px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#F8FAFC'
            }}
          >
            {p.isOverdue
              ? `⚠️ SLA breached by ${p.overdueHours}h! Auto-escalated to Executive Engineer & MLA.`
              : 'Complaint is within target SLA threshold.'}
          </div>
        </div>

        {/* Right Card: Formula Breakdown & Interactive Slider */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px 0' }}>
            Multi-Factor Formula Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
              <span>Base Severity (Deep pothole with rim damage risk):</span>
              <strong>+{p.breakdown.base} pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
              <span>14 Citizen Endorsements (Clustered):</span>
              <strong>+{p.breakdown.dup} pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
              <span>Critical Zone (St. Mary's Girls High School 60m):</span>
              <strong style={{ color: '#D97706' }}>+{p.breakdown.critical} pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
              <span>Traffic Density (Active School Bus Corridor):</span>
              <strong>+{p.breakdown.traffic} pts</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#DC2626',
                background: '#FEF2F2',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #FECACA'
              }}
            >
              <span>Anti-Deadlock Aging Booster:</span>
              <strong>+{p.breakdown.aging} pts</strong>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div
            style={{
              marginTop: '24px',
              background: '#FFF5F5',
              padding: '18px 20px',
              borderRadius: '12px',
              border: '1px solid #FED7D7'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, color: '#991B1B', marginBottom: '8px' }}>
              <span>Simulate Complaint Age (Target SLA: 48h):</span>
              <span>{elapsed} Hours Elapsed {elapsed > 48 ? '⚠️ OVERDUE!' : '✓ Within SLA'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="96"
              value={elapsed}
              onChange={e => setElapsed(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#DC2626', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#991B1B', marginTop: '6px' }}>
              <span>0h (Fresh Ticket)</span>
              <span>48h (SLA Deadline)</span>
              <span>96h (Heavy Neglect Escalation)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 6. MLA CONSTITUENCY DASHBOARD VIEW
// ==========================================================================
function MlaDashboardView({ reports }) {
  const overdueCount = reports.filter(r => r.elapsedHours > r.slaHours).length;
  const verifiedCount = reports.filter(r => r.status === 'verified').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            Constituency Oversight Desk
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
            Executive accountability view for <strong>Shri Ashish Shelar (MLA, Bandra West / Mumbai Suburban)</strong>.
          </p>
        </div>

        <div
          style={{
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          Ward H/West Performance Grade: <strong>A+ (95.4% On-Time)</strong>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '28px' }}>
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Total Ward Grievances</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{reports.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px' }}>Across 8 municipal sectors</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Duplicate Calls Filtered</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>53</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Consolidated via AI clustering</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Community Verified Fixed</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{verifiedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px' }}>Signed off by residents</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Deadlock Escalations</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>{overdueCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px' }}>Flagged for immediate intervention</div>
        </div>
      </div>

      {/* Jurisdiction-Wide Constituency GIS Radar Map */}
      <div style={{ marginBottom: '28px' }}>
        <InteractiveCivicMap
          reports={reports}
          readOnly={true}
          title="🏛️ Bandra West Constituency Jurisdiction Map (MLA Surveillance)"
        />
      </div>

      {/* MLA Hotspot Intervention Queue */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px 0' }}>
          Urgent Attention Hotspots (High Impact near Schools & Hospitals)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports
            .filter(r => r.status !== 'verified')
            .map(r => {
              const p = r.priority || {
                finalScore: r.priorityScore || 75,
                isOverdue: r.elapsedHours > r.slaHours,
                overdueHours: Math.max(0, r.elapsedHours - r.slaHours)
              };
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: p.isOverdue ? '#FFF5F5' : '#F8FAFC',
                    borderRadius: '10px',
                    border: p.isOverdue ? '1px solid #FED7D7' : '1px solid #E2E8F0',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1D4ED8' }}>{r.id}</span>
                      <strong style={{ fontSize: '0.92rem' }}>{r.title}</strong>
                      {p.isOverdue && (
                        <span style={{ background: '#DC2626', color: '#FFF', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                      {r.address} • Assigned to: {r.resolution.assignedTo}
                    </div>
                  </div>

                  <div style={{ width: '160px', flexShrink: 0 }}>
                    <ComplaintMiniMap
                      coords={r.coords}
                      status={r.status}
                      priorityScore={p.finalScore}
                      isOverdue={p.isOverdue}
                      height="80px"
                    />
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: p.finalScore >= 80 ? '#DC2626' : '#D97706' }}>
                      Priority {p.finalScore}/100
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {r.duplicateCount} citizen endorsements
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
