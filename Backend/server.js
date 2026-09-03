import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory data store for CivicCare (Sahayata)
let jurisdiction = {
  city: "Bengaluru",
  corporation: "BBMP (Bruhat Bengaluru Mahanagara Palike)",
  wardNumber: 142,
  wardName: "Indiranagar Central",
  zone: "East Zone",
  mla: {
    name: "Shri K. Venkatesh",
    constituency: "Shantinagar / Indiranagar",
    onTimeRate: "94.2%",
    activeComplaints: 24,
    resolvedThisMonth: 184
  },
  engineer: "Er. Ravi Kumar (Executive Engineer, Ward 142)",
  helpline: "1533"
};

let reports = [
  {
    id: "CIVIC-2026-8921",
    title: "Deep Crater Pothole causing two-wheeler skids",
    category: "pothole",
    categoryLabel: "Road Hazard & Pothole",
    coords: [12.9723, 77.6418],
    address: "Opposite Gate 2, St. Mary's High School Road, Indiranagar",
    status: "assigned",
    statusStep: 4,
    slaHours: 48,
    elapsedHours: 54, // Overdue
    duplicateCount: 14,
    impactRadiusMeters: 140,
    criticalZone: "St. Mary's Girls High School (60m)",
    trafficDensity: "High (School Bus Route)",
    baseSeverity: 35,
    beforeImage: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    resolution: {
      assignedTo: "Er. Ravi Kumar (Ward 142)",
      contractor: "Falcon Road Infrastructure Ltd.",
      note: "Compaction scheduled with emergency cold-mix bitumen."
    }
  },
  {
    id: "CIVIC-2026-8904",
    title: "Overflowing Garbage Dump on Footpath",
    category: "garbage",
    categoryLabel: "Solid Waste Management",
    coords: [12.9765, 77.6385],
    address: "12th Main Corner, Near BDA Complex, Ward 142",
    status: "resolved",
    statusStep: 5,
    slaHours: 24,
    elapsedHours: 19,
    duplicateCount: 8,
    impactRadiusMeters: 90,
    criticalZone: "Commercial Market Footfall",
    trafficDensity: "Medium",
    baseSeverity: 28,
    beforeImage: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    resolution: {
      assignedTo: "Er. Ravi Kumar",
      contractor: "CleanCity BBMP Waste Marshall Squad #4",
      note: "Waste cleared, footpath washed and sanitized.",
      aiConfidence: "95.8% Cleanliness Cleared"
    }
  }
];

// Helper: Calculate Priority Score & Anti-Deadlock Aging
function calculatePriority(report) {
  const base = report.baseSeverity || 25;
  const dupBonus = Math.min((report.duplicateCount || 1) * 3.5, 35);
  
  let criticalBonus = 0;
  if (report.criticalZone && (report.criticalZone.includes("School") || report.criticalZone.includes("Hospital"))) {
    criticalBonus = 24;
  }

  let trafficBonus = 0;
  if (report.trafficDensity && (report.trafficDensity.includes("High") || report.trafficDensity.includes("Ambulance"))) {
    trafficBonus = 14;
  }

  let agingBonus = 0;
  const elapsed = report.elapsedHours || 0;
  const sla = report.slaHours || 48;
  if (elapsed > sla) {
    agingBonus = Math.min(18 + (elapsed - sla) * 2.2, 45);
  } else {
    agingBonus = (elapsed / sla) * 12;
  }

  const raw = base + dupBonus + criticalBonus + trafficBonus + agingBonus;
  return {
    finalScore: Math.min(Math.round(raw), 100),
    isOverdue: elapsed > sla,
    overdueHours: Math.max(0, elapsed - sla)
  };
}

// 1. Health check & Jurisdiction info
app.get('/api/jurisdiction', (req, res) => {
  res.json({ success: true, data: jurisdiction });
});

// 2. Get all reports with dynamic priority score
app.get('/api/reports', (req, res) => {
  const enriched = reports.map(r => ({
    ...r,
    priority: calculatePriority(r)
  }));
  res.json({ success: true, count: reports.length, data: enriched });
});

// 3. Submit a new report (with Duplicate Intercept Check)
app.post('/api/reports', (req, res) => {
  const { title, category, categoryLabel, coords, address, image, clarificationAnswer } = req.body;
  
  if (!coords || !category) {
    return res.status(400).json({ success: false, message: "Coordinates and category are required" });
  }

  // Duplicate Check: ~50m distance (approx 0.0005 deg)
  const existingDuplicate = reports.find(r => {
    const latDiff = Math.abs(r.coords[0] - coords[0]);
    const lngDiff = Math.abs(r.coords[1] - coords[1]);
    return latDiff < 0.0005 && lngDiff < 0.0005 && r.category === category && r.status !== 'verified';
  });

  if (existingDuplicate) {
    return res.status(409).json({
      success: false,
      isDuplicate: true,
      duplicateReport: existingDuplicate,
      message: "An identical issue was already reported in this immediate 50m radius."
    });
  }

  const newReport = {
    id: `CIVIC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    title: title || `${categoryLabel} reported by citizen`,
    category,
    categoryLabel: categoryLabel || category,
    coords,
    address: address || "Ward 142, Bengaluru",
    status: 'reported',
    statusStep: 1,
    slaHours: 24,
    elapsedHours: 1,
    duplicateCount: 1,
    impactRadiusMeters: 100,
    criticalZone: "Ward Road",
    trafficDensity: "Medium",
    baseSeverity: 28,
    beforeImage: image,
    afterImage: image,
    resolution: {
      assignedTo: "Er. Ravi Kumar (Executive Engineer)",
      contractor: "BBMP Fast-Response Team",
      note: `Clarification provided: ${clarificationAnswer || 'None'}`
    }
  };

  reports.unshift(newReport);
  res.status(201).json({ success: true, data: newReport });
});

// 4. Upvote / Endorse an existing ticket
app.post('/api/reports/:id/endorse', (req, res) => {
  const { id } = req.params;
  const target = reports.find(r => r.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  target.duplicateCount = (target.duplicateCount || 1) + 1;
  res.json({ success: true, message: "Endorsement recorded", data: target });
});

// 5. Progress ticket stage (Ward Engineer action)
app.post('/api/reports/:id/progress', (req, res) => {
  const { id } = req.params;
  const target = reports.find(r => r.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  if (target.statusStep < 5) {
    target.statusStep += 1;
    if (target.statusStep === 2) target.status = 'clustered';
    if (target.statusStep === 3) target.status = 'prioritized';
    if (target.statusStep === 4) target.status = 'assigned';
    if (target.statusStep === 5) {
      target.status = 'resolved';
      target.resolution.aiConfidence = "94.8% Cleared";
    }
  }

  res.json({ success: true, data: target });
});

// 6. Citizen verification (Confirm / Dispute)
app.post('/api/reports/:id/verify', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'confirm' or 'dispute'
  const target = reports.find(r => r.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  if (action === 'confirm') {
    target.status = 'verified';
    target.statusStep = 6;
  } else if (action === 'dispute') {
    target.status = 'assigned';
    target.statusStep = 4;
    target.elapsedHours = target.slaHours + 8; // escalate
    target.resolution.note = "CITIZEN DISPUTE: Repair failed quality threshold. Reopened for field re-inspection.";
  }

  res.json({ success: true, data: target });
});

app.listen(PORT, () => {
  console.log(`CivicCare Backend API running on http://localhost:${PORT}`);
});
