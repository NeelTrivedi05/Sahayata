import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CIVIC_DATA, calculatePriorityScore } from './data/civicData';
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
  Camera,
  Upload,
  Navigation,
  Compass,
  Crosshair,
  Check,
  RotateCcw,
  Hash
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState('citizen'); // 'citizen' | 'ward_engineer' | 'mla'
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'report' | 'pipeline' | 'verify' | 'priority' | 'mla'
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Handle citizen submission with multi-factor deduplication (Haversine + pHash + Category)
  const handleReportSubmit = async (customPayload) => {
    const reportData = customPayload || {
      title: customDescription ? customDescription : activePreset.name,
      category: activePreset.category,
      categoryLabel: activePreset.categoryLabel,
      coords: activePreset.coords,
      address: activePreset.address,
      image: activePreset.image,
      phash: activePreset.phash || "a1b2c3d4e5f60719",
      clarificationAnswer: selectedClarification
    };

    // Evaluate against active complaints using 50m radius and 64-bit pHash
    const check = await evaluateDuplicateCandidate(reportData, reports, { maxRadiusMeters: 50 });

    if (check.isDuplicate && check.duplicateReport) {
      setMatchedDuplicate({
        ...check.duplicateReport,
        matchScore: check.confidenceScore,
        reasons: check.reasons
      });
      setDuplicateModalOpen(true);
    } else {
      const newReportId = `CIVIC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReport = {
        id: newReportId,
        title: reportData.title || `${reportData.categoryLabel} reported by Citizen`,
        category: reportData.category,
        categoryLabel: reportData.categoryLabel,
        coords: reportData.coords,
        address: reportData.address || "Ward 142, Indiranagar, Bengaluru",
        status: 'reported',
        statusStep: 1,
        slaHours: 24,
        elapsedHours: 1,
        duplicateCount: 1,
        impactRadiusMeters: 100,
        criticalZone: reportData.category === 'pothole' ? "St. Mary's School Zone" : "Ward 142 Corridor",
        trafficDensity: "Medium",
        baseSeverity: 28,
        phash: reportData.phash || "a1b2c3d4e5f60718",
        reportedBy: "You (Citizen)",
        reportedAt: "Just now",
        beforeImage: reportData.image,
        afterImage: reportData.image,
        resolution: {
          assignedTo: "Er. Ravi Kumar (Executive Engineer)",
          contractor: "BBMP Fast-Response Team",
          note: `Auto-routed based on AI Clarification: "${reportData.clarificationAnswer || selectedClarification}"`
        }
      };

      setReports([newReport, ...reports]);
      setCivicKarma(k => k + 20);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
      showToast(`Grievance registered! Ticket ${newReportId} routed to Ward 142.`);
      setActiveTab('pipeline');
    }
  };

  // Handle duplicate upvoting (+1 endorsement)
  const handleUpvote = () => {
    if (!matchedDuplicate) return;
    setReports(prev =>
      prev.map(r =>
        r.id === matchedDuplicate.id
          ? { ...r, duplicateCount: (r.duplicateCount || 1) + 1 }
          : r
      )
    );
    setDuplicateModalOpen(false);
    setCivicKarma(k => k + 25);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch (e) {}
    showToast(`Endorsement recorded! Complaint ${matchedDuplicate.id} boosted in priority (+25 Karma).`);
    setActiveTab('pipeline');
  };

  // Ward Engineer status progression
  const handleProgressStatus = (reportId) => {
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
            afterImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
            resolution: {
              ...r.resolution,
              note: "Physical repair completed by contractor. Uploaded post-repair verification photo.",
              aiConfidence: "94.4% Repair Match Detected"
            }
          };
        }
        return r;
      })
    );
    showToast(`Work order ${reportId} advanced to next stage!`);
  };

  // Citizen confirms resolution
  const handleConfirmResolution = (reportId) => {
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, status: 'verified', statusStep: 6 }
          : r
      )
    );
    setCivicKarma(k => k + 50);
    try {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}
    showToast("Community verification confirmed! Contractor work marked complete. +50 Karma awarded!");
  };

  // Citizen disputes resolution
  const handleDisputeResolution = (reportId) => {
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              status: 'assigned',
              statusStep: 4,
              elapsedHours: r.slaHours + 6, // Force deadlock escalation
              resolution: {
                ...r.resolution,
                note: "CITIZEN QUALITY DISPUTE: Repair failed quality threshold. Reopened for field re-inspection."
              }
            }
          : r
      )
    );
    showToast("Dispute logged. Work order reopened and escalated to Executive Engineer!");
  };

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
            <strong style={{ color: '#E2E8F0' }}>Govt. of Karnataka & BBMP</strong> • Citizen Civic Redressal & Anti-Deadlock Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Constituency: <strong>Shantinagar / Indiranagar</strong></span>
          <span>Municipal Helpline: <strong style={{ color: '#38BDF8' }}>1533</strong></span>
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
          {/* Role Switcher Pill */}
          <div
            style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1'
            }}
          >
            {[
              { id: 'citizen', label: '👤 Citizen', hint: 'Report & Verify' },
              { id: 'ward_engineer', label: '👷 Ward 142 Eng.', hint: 'Assign & Fix' },
              { id: 'mla', label: '🏛️ MLA Oversight', hint: 'Monitor SLAs' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => {
                  setCurrentRole(r.id);
                  if (r.id === 'mla') setActiveTab('mla');
                  if (r.id === 'ward_engineer') setActiveTab('pipeline');
                }}
                style={{
                  background: currentRole === r.id ? '#FFFFFF' : 'transparent',
                  color: currentRole === r.id ? '#1D4ED8' : '#64748B',
                  fontWeight: currentRole === r.id ? 700 : 500,
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: currentRole === r.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {r.label}
              </button>
            ))}
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

      {/* 3. Navigation Bar */}
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
        {[
          { id: 'radar', label: '🗺️ Civic Radar & Map' },
          { id: 'report', label: '📸 Report an Issue' },
          { id: 'pipeline', label: `📋 Track Complaints (${reports.length})` },
          { id: 'verify', label: '🔍 Verify Resolutions (Before / After)' },
          { id: 'priority', label: '⚡ Priority & Deadlock Engine' },
          { id: 'mla', label: '🏛️ MLA Oversight Radar' }
        ].map(tab => (
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
          Current View Mode:{' '}
          <strong>
            {currentRole === 'citizen' && '👤 Citizen Portal (Report issues, endorse duplicates, verify repairs)'}
            {currentRole === 'ward_engineer' && '👷 Ward 142 Engineering Desk (Inspect complaints, assign contractors, upload post-fix proof)'}
            {currentRole === 'mla' && '🏛️ Constituency Monitoring Desk (Track SLA compliance, overdue hotspots, contractor accountability)'}
          </strong>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
          Ward 142 (Indiranagar Central) • SLA Target: 24–48h
        </span>
      </div>

      {/* 5. Main Content Workspace */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 32px' }} className="animate-fade-in">
        {activeTab === 'radar' && <CivicRadarMapView reports={reports} onSelectReport={() => setActiveTab('pipeline')} />}
        
        {activeTab === 'report' && (
          <ReportIssueView
            presets={CIVIC_DATA.reportingPresets}
            existingReports={reports}
            activePreset={activePreset}
            onSelectPreset={pId => {
              const p = CIVIC_DATA.reportingPresets.find(x => x.id === pId);
              setActivePreset(p);
              setSelectedClarification(p.aiClarification.options[0]);
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

        {activeTab === 'priority' && <PriorityRulesView report={reports[0]} />}

        {activeTab === 'mla' && <MlaDashboardView reports={reports} />}
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
              <strong>BBMP Smart Clustering Policy:</strong>
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
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '14px 22px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.88rem',
            zIndex: 2000,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #334155'
          }}
          className="animate-fade-in"
        >
          <Sparkles size={16} color="#38BDF8" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// 1. CIVIC RADAR & MAP VIEW (Interactive Leaflet Map with Critical Zones)
// ==========================================================================
function CivicRadarMapView({ reports, onSelectReport }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [showCriticalZones, setShowCriticalZones] = useState(true);
  const [showImpactRadius, setShowImpactRadius] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([12.9755, 77.6415], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // 1. Plot Critical Buffer Zones (Schools, Hospitals)
    if (showCriticalZones) {
      CIVIC_DATA.criticalZones.forEach(z => {
        const color = z.type === 'school' ? '#D97706' : z.type === 'hospital' ? '#DC2626' : '#2563EB';
        L.circle(z.coords, {
          radius: z.bufferRadius,
          color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '5,5'
        })
          .bindPopup(`
            <div style="font-family: inherit;">
              <span style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;">${z.tag}</span>
              <h4 style="font-size:14px;margin:2px 0 6px;">${z.name}</h4>
              <p style="font-size:12px;color:#64748B;margin:0;">High priority safety buffer: <strong>${z.bufferRadius}m</strong></p>
            </div>
          `)
          .addTo(map);
      });
    }

    // 2. Plot Reports with Priority Pins & Impact Radiuses
    reports.forEach(r => {
      const p = calculatePriorityScore(r);
      const color =
        r.status === 'verified'
          ? '#059669'
          : p.finalScore >= 80
          ? '#DC2626'
          : p.finalScore >= 50
          ? '#D97706'
          : '#2563EB';

      // Impact Radius circle
      if (showImpactRadius) {
        L.circle(r.coords, {
          radius: r.impactRadiusMeters,
          color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 1.5
        }).addTo(map);
      }

      // Priority Marker Pin
      const icon = L.divIcon({
        html: `
          <div style="
            width:34px;
            height:34px;
            background:${color};
            border:2.5px solid #FFFFFF;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#FFFFFF;
            font-weight:800;
            font-size:12px;
            box-shadow:0 4px 10px rgba(0,0,0,0.3);
            cursor:pointer;
          ">
            ${p.finalScore}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker(r.coords, { icon })
        .bindPopup(`
          <div style="font-family: inherit; min-width: 180px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:11px;font-weight:800;color:${color};">${r.id}</span>
              <span style="font-size:11px;background:#F1F5F9;padding:2px 6px;border-radius:4px;font-weight:600;">${r.status.toUpperCase()}</span>
            </div>
            <h4 style="font-size:13px;margin:4px 0;">${r.title}</h4>
            <div style="font-size:11px;color:#64748B;margin-bottom:6px;">${r.address}</div>
            <div style="background:#F8FAFC;padding:6px 8px;border-radius:6px;font-size:11px;">
              <strong>Priority: ${p.finalScore}/100</strong> • ${r.duplicateCount} Endorsements<br/>
              ${p.isOverdue ? '<span style="color:#DC2626;font-weight:700;">⚠️ SLA Overdue (Surged)</span>' : 'Within SLA'}
            </div>
          </div>
        `)
        .addTo(map);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [reports, showCriticalZones, showImpactRadius]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            Civic Radar & Ward 142 Geospatial Map
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
            Real-time geospatial clustering, danger radius zones, and school/hospital buffer corridors.
          </p>
        </div>

        {/* Map Filter Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowCriticalZones(!showCriticalZones)}
            style={{
              background: showCriticalZones ? '#FEF3C7' : '#FFFFFF',
              color: showCriticalZones ? '#B45309' : '#64748B',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Shield size={14} /> Critical Zones ({showCriticalZones ? 'ON' : 'OFF'})
          </button>
          <button
            onClick={() => setShowImpactRadius(!showImpactRadius)}
            style={{
              background: showImpactRadius ? '#EFF6FF' : '#FFFFFF',
              color: showImpactRadius ? '#1D4ED8' : '#64748B',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={14} /> Impact Radiuses ({showImpactRadius ? 'ON' : 'OFF'})
          </button>
        </div>
      </div>

      {/* Map Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          position: 'relative'
        }}
      >
        <div ref={mapContainerRef} style={{ width: '100%', height: '560px' }} />

        {/* Floating Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.78rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            border: '1px solid #CBD5E1',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>Map Legend:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#DC2626' }}></div>
            <span>Critical Priority (Score ≥ 80 / Overdue)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#D97706' }}></div>
            <span>Medium-High Priority (Score 50–79)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669' }}></div>
            <span>Community Verified Fixed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '0px', borderTop: '2px dashed #D97706' }}></div>
            <span>School / Hospital Buffer Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 2. REPORT ISSUE VIEW (With AI Clarification Questions & Presets)
// ==========================================================================
function ReportIssueView({
  presets,
  existingReports,
  activePreset,
  onSelectPreset,
  selectedClarification,
  onSelectClarification,
  customDescription,
  setCustomDescription,
  onSubmit
}) {
  const [reportMode, setReportMode] = useState('camera_gps'); // 'camera_gps' | 'preset'
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  // Custom photo & pHash state
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [photoPHash, setPhotoPHash] = useState('');
  const [computingHash, setComputingHash] = useState(false);

  // Category state for custom mode
  const [category, setCategory] = useState('pothole');
  const [categoryLabel, setCategoryLabel] = useState('Road Hazard & Pothole');

  // Geolocation Hook
  const geo = useGeolocation();

  // Dynamic nearby duplicate detection candidate
  const [nearbyCandidate, setNearbyCandidate] = useState(null);

  const categories = [
    { id: 'pothole', label: 'Road Hazard & Pothole', icon: '🕳️' },
    { id: 'garbage', label: 'Solid Waste & Garbage', icon: '🗑️' },
    { id: 'electricity', label: 'Electrical & Streetlight', icon: '💡' },
    { id: 'water', label: 'Water Leak & Drainage', icon: '🚰' }
  ];

  // Handle native camera / upload photo selection
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCapturedPhoto(previewUrl);
    setPhotoName(file.name);
    setComputingHash(true);

    try {
      const hashResult = await computeImagePHash(previewUrl);
      setPhotoPHash(hashResult.hexHash);
    } catch (err) {
      console.error("pHash computation error:", err);
      setPhotoPHash("a1b2c3d4e5f60718");
    } finally {
      setComputingHash(false);
    }
  };

  // Live background deduplication radar: evaluates candidate whenever location/photo/category changes
  useEffect(() => {
    const currentCoords =
      reportMode === 'camera_gps'
        ? geo.coords || [12.9723, 77.6418]
        : activePreset.coords;
    const currentCat = reportMode === 'camera_gps' ? category : activePreset.category;
    const currentHash = reportMode === 'camera_gps' ? photoPHash : activePreset.phash;

    evaluateDuplicateCandidate(
      {
        coords: currentCoords,
        category: currentCat,
        phash: currentHash
      },
      existingReports,
      { maxRadiusMeters: 50 }
    ).then((res) => {
      if (res.isDuplicate && res.duplicateReport) {
        setNearbyCandidate(res.duplicateReport);
      } else {
        setNearbyCandidate(null);
      }
    });
  }, [geo.coords, category, photoPHash, reportMode, activePreset, existingReports]);

  // Handle final submission
  const handleFormSubmit = () => {
    if (reportMode === 'preset') {
      onSubmit({
        title: customDescription ? customDescription : activePreset.name,
        category: activePreset.category,
        categoryLabel: activePreset.categoryLabel,
        coords: activePreset.coords,
        address: activePreset.address,
        image: activePreset.image,
        phash: activePreset.phash,
        clarificationAnswer: selectedClarification
      });
    } else {
      const finalCoords = geo.coords || [12.9723, 77.6418];
      const finalAddress = geo.address || "12th Main Road, Ward 142, Indiranagar, Bengaluru";
      const finalImage =
        capturedPhoto ||
        (category === 'pothole'
          ? "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"
          : category === 'garbage'
          ? "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80"
          : "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80");

      onSubmit({
        title: customDescription || `${categoryLabel} reported near ${finalAddress.split(',')[0]}`,
        category,
        categoryLabel,
        coords: finalCoords,
        address: finalAddress,
        image: finalImage,
        phash: photoPHash || "a1b2c3d4e5f60718",
        clarificationAnswer: selectedClarification
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            Report a Civic Grievance
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
            Capture a photo with GPS. Vision AI and our Deduplication Engine verify and route your complaint directly to Ward 142.
          </p>
        </div>

        {/* Input Mode Selector */}
        <div style={{ display: 'flex', background: '#E2E8F0', padding: '3px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setReportMode('camera_gps')}
            style={{
              background: reportMode === 'camera_gps' ? '#FFFFFF' : 'transparent',
              color: reportMode === 'camera_gps' ? '#1D4ED8' : '#64748B',
              fontWeight: reportMode === 'camera_gps' ? 700 : 600,
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: reportMode === 'camera_gps' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Camera size={15} /> 📸 Live Camera & GPS (Real Device)
          </button>
          <button
            type="button"
            onClick={() => setReportMode('preset')}
            style={{
              background: reportMode === 'preset' ? '#FFFFFF' : 'transparent',
              color: reportMode === 'preset' ? '#1D4ED8' : '#64748B',
              fontWeight: reportMode === 'preset' ? 700 : 600,
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: reportMode === 'preset' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Sliders size={15} /> 🧪 Demo Presets
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '28px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}
      >
        {/* ================= LEFT COLUMN: PHOTO EVIDENCE & GPS ================= */}
        <div style={{ background: '#F8FAFC', padding: '28px', borderRight: '1px solid #E2E8F0' }}>
          {reportMode === 'preset' ? (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                Select Test Scenario:
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  background: '#FFF'
                }}
                value={activePreset.id}
                onChange={(e) => onSelectPreset(e.target.value)}
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                <img
                  src={activePreset.image}
                  alt="Uploaded issue"
                  style={{ width: '100%', height: '270px', objectFit: 'cover', display: 'block' }}
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
                  <span>GPS: <strong>{activePreset.coords[0]}° N, {activePreset.coords[1]}° E</strong></span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>Preset Verified</span>
                </div>
              </div>

              <div style={{ marginTop: '12px', background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>64-bit pHash:</strong> <code style={{ color: '#1D4ED8', fontWeight: 700 }}>{activePreset.phash || "a1b2c3d4e5f60719"}</code></span>
                <span style={{ color: '#059669', fontWeight: 700 }}>✓ Indexed</span>
              </div>
            </div>
          ) : (
            <div>
              {/* Native Camera (capture="environment") + Gallery Upload Controls */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />

              <label style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block', marginBottom: '8px', color: '#0F172A' }}>
                1. Capture Photo Evidence:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    background: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(29, 78, 216, 0.2)'
                  }}
                >
                  <Camera size={18} /> Take Photo (Camera)
                </button>

                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  style={{
                    background: '#FFFFFF',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Upload size={18} /> Upload Photo
                </button>
              </div>

              {/* Photo Display Card */}
              {capturedPhoto ? (
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                  <img
                    src={capturedPhoto}
                    alt="Captured issue"
                    style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#FFF',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                    onClick={() => {
                      setCapturedPhoto(null);
                      setPhotoPHash('');
                    }}
                  >
                    ✕ Retake Photo
                  </div>

                  {/* pHash Banner */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      right: '10px',
                      background: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFF',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.72rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>
                      pHash: <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{photoPHash || 'Calculating...'}</strong>
                    </span>
                    <span style={{ color: '#A7F3D0', fontWeight: 700 }}>
                      {computingHash ? 'Hashing...' : '✓ 64-bit Fingerprint'}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: '140px',
                    border: '2px dashed #CBD5E1',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    background: '#FFFFFF',
                    gap: '6px'
                  }}
                >
                  <Camera size={28} color="#94A3B8" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>No photo selected yet</span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Tap "Take Photo" or "Upload Photo" above</span>
                </div>
              )}

              {/* 2. Geolocation Access (GPS) */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                    2. Location Access (GPS):
                  </label>
                  {geo.coords && (
                    <span style={{ fontSize: '0.72rem', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                      ✓ GPS Locked (±{geo.accuracyMeters}m)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={geo.requestLocation}
                  disabled={geo.loading}
                  style={{
                    width: '100%',
                    background: geo.coords ? '#ECFDF5' : '#FFFFFF',
                    color: geo.coords ? '#065F46' : '#1D4ED8',
                    border: geo.coords ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Navigation size={16} className={geo.loading ? 'animate-spin' : ''} />
                  {geo.loading
                    ? 'Acquiring High-Precision GPS Signal...'
                    : geo.coords
                    ? '📍 Location Detected (Click to Refresh)'
                    : '📍 Detect My Current Location (GPS)'}
                </button>

                {geo.coords && (
                  <div style={{ marginTop: '10px', background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#334155' }}>
                    <div><strong>Coordinates:</strong> {geo.coords[0].toFixed(5)}° N, {geo.coords[1].toFixed(5)}° E</div>
                    <div style={{ marginTop: '2px', color: '#64748B' }}><strong>Address:</strong> {geo.address}</div>
                  </div>
                )}

                {geo.error && (
                  <div style={{ marginTop: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: '#DC2626' }}>
                    <strong>Location Error:</strong> {geo.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: AI CONTEXT & SUBMISSION ================= */}
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Category Selector if in Custom Camera mode */}
            {reportMode === 'camera_gps' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block', marginBottom: '8px', color: '#0F172A' }}>
                  Select Grievance Category:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCategory(c.id);
                        setCategoryLabel(c.label);
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: category === c.id ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                        background: category === c.id ? '#EFF6FF' : '#FFFFFF',
                        color: category === c.id ? '#1D4ED8' : '#334155',
                        fontWeight: category === c.id ? 700 : 500,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Dynamic Clarification Prompt */}
            <div
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1D4ED8', fontWeight: 700, fontSize: '0.82rem' }}>
                <Sparkles size={16} />
                <span>AI Automated Context Clarification</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#1E3A8A', margin: '4px 0 0' }}>
                Vision AI identified this risk. Answer this quick prompt to fine-tune anti-deadlock priority:
              </p>
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Clarification Question:
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#334155', marginBottom: '12px', fontWeight: 600 }}>
              {activePreset.aiClarification.question}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {activePreset.aiClarification.options.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectClarification(opt)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border:
                      selectedClarification === opt
                        ? '2px solid #1D4ED8'
                        : '1px solid #CBD5E1',
                    background: selectedClarification === opt ? '#EFF6FF' : '#FFFFFF',
                    color: selectedClarification === opt ? '#1D4ED8' : '#334155',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: selectedClarification === opt ? 700 : 500,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border:
                        selectedClarification === opt
                          ? '5px solid #1D4ED8'
                          : '2px solid #CBD5E1',
                      background: '#FFF'
                    }}
                  />
                  <span>{opt}</span>
                </div>
              ))}
            </div>

            {/* Optional Citizen Notes */}
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Optional Citizen Notes:
            </label>
            <input
              type="text"
              placeholder="e.g. Causing traffic jams during 8 AM school drop-offs"
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

            {/* LIVE DEDUPLICATION RADAR BANNER */}
            {nearbyCandidate && (
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  color: '#92400E',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                  <AlertTriangle size={16} />
                  <span>Deduplication Radar Active ({nearbyCandidate.distanceMeters}m away)</span>
                </div>
                <p style={{ margin: '4px 0 0', lineHeight: 1.4 }}>
                  A matching <strong>{nearbyCandidate.categoryLabel}</strong> is already open on this road.
                  Submitting will cluster your report and boost ticket <strong>{nearbyCandidate.id}</strong> with an endorsement vote (+25 Karma).
                </p>
              </div>
            )}
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
            Submit Grievance →
          </button>
        </div>
      </div>
    </div>
  );
}


// ==========================================================================
// 3. PIPELINE VIEW (6-Step Lifecycle with Ward Action triggers)
// ==========================================================================
function PipelineView({ reports, currentRole, onProgressStatus, onVerifyClick }) {
  const steps = [
    { num: 1, label: 'Reported' },
    { num: 2, label: 'Clustered' },
    { num: 3, label: 'Prioritized' },
    { num: 4, label: 'Assigned' },
    { num: 5, label: 'Resolved' },
    { num: 6, label: 'Verified' }
  ];

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
          const p = calculatePriorityScore(r);
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
                  <div style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} />
                    <span>{r.address}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: p.finalScore >= 80 ? '#DC2626' : p.finalScore >= 50 ? '#D97706' : '#2563EB'
                    }}
                  >
                    {p.finalScore}
                    <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                    {r.duplicateCount} Resident Endorsements
                  </div>
                </div>
              </div>

              {/* 6-Stage Visual Stepper */}
              <div style={{ margin: '24px 0 16px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '20px',
                    right: '20px',
                    height: '3px',
                    background: '#E2E8F0',
                    zIndex: 1
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  {steps.map(s => {
                    const isDone = s.num < r.statusStep;
                    const isCurrent = s.num === r.statusStep;
                    return (
                      <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: isDone ? '#059669' : isCurrent ? '#1D4ED8' : '#F1F5F9',
                            color: isDone || isCurrent ? '#FFFFFF' : '#94A3B8',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isCurrent ? '0 0 0 4px #DBEAFE' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isDone ? '✓' : s.num}
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: isCurrent ? '#1D4ED8' : isDone ? '#059669' : '#64748B',
                            fontWeight: isCurrent ? 800 : 600
                          }}
                        >
                          {s.label}
                        </span>
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
                  <strong>Assigned Officer:</strong> {r.resolution.assignedTo} •{' '}
                  <span style={{ color: '#64748B' }}>{r.resolution.note}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* Ward Engineer progression button */}
                  {currentRole === 'ward_engineer' && r.statusStep < 5 && (
                    <button
                      onClick={() => onProgressStatus(r.id)}
                      style={{
                        background: '#1D4ED8',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {r.statusStep === 4 ? 'Upload Post-Repair Photo & Complete' : 'Advance Next Stage →'}
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
  const p = calculatePriorityScore({ ...report, elapsedHours: elapsed });

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
            Executive accountability view for <strong>Shri K. Venkatesh (MLA, Shantinagar / Indiranagar)</strong>.
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
          Ward 142 Performance Grade: <strong>A+ (94.2% On-Time)</strong>
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

      {/* MLA Hotspot Intervention Queue */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px 0' }}>
          Urgent Attention Hotspots (High Impact near Schools & Hospitals)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports
            .filter(r => r.status !== 'verified')
            .map(r => {
              const p = calculatePriorityScore(r);
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
                    border: p.isOverdue ? '1px solid #FED7D7' : '1px solid #E2E8F0'
                  }}
                >
                  <div>
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
