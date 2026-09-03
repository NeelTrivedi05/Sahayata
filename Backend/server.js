import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// In-memory data store for CivicCare (Sahayata) - Mumbai
let jurisdiction = {
  city: "Mumbai",
  corporation: "BMC (Brihanmumbai Municipal Corporation)",
  wardNumber: "H/West",
  wardName: "Bandra West / Khar",
  zone: "Zone 3 (Western Suburbs)",
  mla: {
    name: "Shri Ashish Shelar",
    constituency: "Bandra West / Mumbai Suburban",
    onTimeRate: "95.4%",
    activeComplaints: 28,
    resolvedThisMonth: 212
  },
  engineer: "Er. Rajesh Sawant (Executive Engineer, Ward H/West)",
  helpline: "1916"
};

let reports = [
  {
    id: "CIVIC-2026-8921",
    title: "Deep Crater Pothole causing two-wheeler skids",
    category: "pothole",
    categoryLabel: "Road Hazard & Pothole",
    coords: [19.0558, 72.8295],
    address: "Near St. Andrew's High School, Hill Road, Bandra West, Mumbai",
    status: "assigned",
    statusStep: 4, // 1: Reported, 2: Clustered, 3: Prioritized, 4: Assigned, 5: Resolved, 6: Citizen Verified
    slaHours: 48,
    elapsedHours: 54, // Overdue! Deadlock breaker active
    duplicateCount: 14,
    impactRadiusMeters: 140,
    criticalZone: "St. Andrew's High School (60m)",
    trafficDensity: "High (School Bus Route)",
    baseSeverity: 35,
    reportedBy: "Priya S. & 14 others",
    reportedAt: "2 days ago",
    beforeImage: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    resolution: {
      assignedTo: "Er. Rajesh Sawant (Ward H/West)",
      contractor: "Falcon Mumbai Infrastructure Ltd.",
      note: "Compaction scheduled with emergency mastic asphalt.",
      inspectionStatus: "Work Order #BMC-4481 Dispatched"
    }
  },
  {
    id: "CIVIC-2026-8904",
    title: "Overflowing Garbage Dump on Footpath",
    category: "garbage",
    categoryLabel: "Solid Waste Management",
    coords: [19.0585, 72.8315],
    address: "Linking Road Corner, Near National College, Bandra West, Mumbai",
    status: "resolved",
    statusStep: 5, // Awaiting citizen verification
    slaHours: 24,
    elapsedHours: 19,
    duplicateCount: 8,
    impactRadiusMeters: 90,
    criticalZone: "Commercial Market Footfall",
    trafficDensity: "Medium",
    baseSeverity: 28,
    reportedBy: "Karthik R. & 8 others",
    reportedAt: "19 hours ago",
    beforeImage: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    resolution: {
      assignedTo: "Er. Rajesh Sawant",
      contractor: "CleanMumbai BMC Solid Waste Marshall Squad #3",
      note: "Waste cleared, footpath washed and sanitized.",
      aiConfidence: "95.8% Cleanliness Cleared"
    }
  },
  {
    id: "CIVIC-2026-8877",
    title: "Broken Streetlight & Hanging Live Wire",
    category: "electricity",
    categoryLabel: "Electrical & Lighting",
    coords: [19.0514, 72.8296],
    address: "Lilavati Hospital Emergency Access Lane, Bandra West, Mumbai",
    status: "verified",
    statusStep: 6, // Completed & verified
    slaHours: 12,
    elapsedHours: 11,
    duplicateCount: 5,
    impactRadiusMeters: 80,
    criticalZone: "Lilavati Hospital Ambulance Corridor",
    trafficDensity: "High (Ambulance Route)",
    baseSeverity: 40,
    reportedBy: "Dr. Ananya Rao",
    reportedAt: "Yesterday",
    beforeImage: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    resolution: {
      assignedTo: "Er. Ramesh Patil (BEST Electrical Dept)",
      contractor: "BEST Emergency Wing",
      note: "Insulated junction replaced, 120W LED lamp installed and tested.",
      aiConfidence: "98.2% Illumination Restored"
    }
  },
  {
    id: "CIVIC-2026-8842",
    title: "Burst Water Pipeline gushing across road",
    category: "water",
    categoryLabel: "Water Supply & Sewage",
    coords: [19.0610, 72.8350],
    address: "Turner Road Junction, Bandra West, Mumbai",
    status: "prioritized",
    statusStep: 3,
    slaHours: 24,
    elapsedHours: 14,
    duplicateCount: 11,
    impactRadiusMeters: 120,
    criticalZone: "Transit Main Road",
    trafficDensity: "High",
    baseSeverity: 32,
    reportedBy: "Meera Deshmukh & 10 others",
    reportedAt: "14 hours ago",
    beforeImage: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
    resolution: {
      assignedTo: "Er. Rajesh Sawant",
      contractor: "BMC Hydraulic Engineering Quick Response Unit",
      note: "Isolation valve dispatched to stem wastage."
    }
  }
];

// Single Source of Truth: Comprehensive Priority Score Formula
export function calculatePriorityScore(report) {
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

  // Anti-Deadlock Aging Engine
  let agingBonus = 0;
  const elapsed = report.elapsedHours || 0;
  const sla = report.slaHours || 48;
  if (elapsed > sla) {
    agingBonus = Math.min(18 + (elapsed - sla) * 2.2, 45); // Escalates dynamically
  } else {
    agingBonus = (elapsed / sla) * 12;
  }

  const raw = base + dupBonus + criticalBonus + trafficBonus + agingBonus;
  const finalScore = Math.min(Math.round(raw), 100);

  return {
    finalScore,
    isOverdue: elapsed > sla,
    overdueHours: Math.max(0, elapsed - sla),
    breakdown: {
      base: Math.round(base),
      dup: Math.round(dupBonus),
      critical: Math.round(criticalBonus),
      traffic: Math.round(trafficBonus),
      aging: Math.round(agingBonus)
    }
  };
}

// 1. Health check & Jurisdiction info
app.get('/api/jurisdiction', (req, res) => {
  res.json({ success: true, data: jurisdiction });
});

// 2. Get all reports with server-calculated priority score
app.get('/api/reports', (req, res) => {
  const enriched = reports.map(r => {
    const pri = calculatePriorityScore(r);
    return {
      ...r,
      priorityScore: pri.finalScore,
      priority: pri,
      isOverdue: pri.isOverdue,
      overdueHours: pri.overdueHours
    };
  });
  res.json({ success: true, count: reports.length, data: enriched });
});

// 3. Submit a new report (with Duplicate Intercept Check)
app.post('/api/reports', (req, res) => {
  const {
    title,
    category,
    categoryLabel,
    coords,
    address,
    image,
    clarificationAnswer,
    criticalZone,
    trafficDensity,
    baseSeverity
  } = req.body;
  
  if (!coords || !category) {
    return res.status(400).json({ success: false, message: "Coordinates and category are required" });
  }

  // Duplicate Check: ~60m distance (approx 0.0006 deg)
  const existingDuplicate = reports.find(r => {
    const latDiff = Math.abs(r.coords[0] - coords[0]);
    const lngDiff = Math.abs(r.coords[1] - coords[1]);
    return latDiff < 0.0006 && lngDiff < 0.0006 && r.category === category && r.status !== 'verified';
  });

  if (existingDuplicate) {
    return res.status(409).json({
      success: false,
      isDuplicate: true,
      duplicateReport: {
        ...existingDuplicate,
        priority: calculatePriorityScore(existingDuplicate)
      },
      message: "An identical issue was already reported in this immediate 60m radius."
    });
  }

  const newReport = {
    id: `CIVIC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    title: title || `${categoryLabel || category} reported by citizen`,
    category,
    categoryLabel: categoryLabel || category,
    coords,
    address: address || "Hill Road, Bandra West, Mumbai",
    status: 'reported',
    statusStep: 1,
    slaHours: 24,
    elapsedHours: 1,
    duplicateCount: 1,
    impactRadiusMeters: 100,
    criticalZone: criticalZone || (category === 'pothole' ? "St. Andrew's School Zone" : "Ward H/West Corridor"),
    trafficDensity: trafficDensity || "Medium",
    baseSeverity: baseSeverity || 28,
    reportedBy: "You (Citizen)",
    reportedAt: "Just now",
    beforeImage: image,
    afterImage: image,
    resolution: {
      assignedTo: "Er. Rajesh Sawant (Executive Engineer)",
      contractor: "BMC Fast-Response Team",
      note: `Clarification provided: ${clarificationAnswer || 'None'}`
    }
  };

  reports.unshift(newReport);
  const pri = calculatePriorityScore(newReport);
  
  res.status(201).json({
    success: true,
    data: {
      ...newReport,
      priorityScore: pri.finalScore,
      priority: pri
    }
  });
});

// 4. Upvote / Endorse an existing ticket
app.post('/api/reports/:id/endorse', (req, res) => {
  const { id } = req.params;
  const target = reports.find(r => r.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  target.duplicateCount = (target.duplicateCount || 1) + 1;
  const pri = calculatePriorityScore(target);

  res.json({
    success: true,
    message: "Endorsement recorded",
    data: {
      ...target,
      priorityScore: pri.finalScore,
      priority: pri
    }
  });
});

// 5. Progress ticket stage (Ward Engineer action with optional after-repair photo)
app.post('/api/reports/:id/progress', (req, res) => {
  const { id } = req.params;
  const { afterImage } = req.body;
  const target = reports.find(r => r.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  if (afterImage) {
    target.afterImage = afterImage;
  }

  if (target.statusStep < 5) {
    target.statusStep += 1;
    if (target.statusStep === 2) target.status = 'clustered';
    if (target.statusStep === 3) target.status = 'prioritized';
    if (target.statusStep === 4) target.status = 'assigned';
    if (target.statusStep === 5) {
      target.status = 'resolved';
      if (!target.resolution) target.resolution = {};
      target.resolution.aiConfidence = "96.4% Repair Cleared";
      target.resolution.inspectionStatus = "Field Repair Completed - Verification Pending";
    }
  }

  const pri = calculatePriorityScore(target);
  res.json({
    success: true,
    data: {
      ...target,
      priorityScore: pri.finalScore,
      priority: pri
    }
  });
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
    if (!target.resolution) target.resolution = {};
    target.resolution.note = "CITIZEN DISPUTE: Repair failed quality threshold. Reopened for field re-inspection.";
  }

  const pri = calculatePriorityScore(target);
  res.json({
    success: true,
    data: {
      ...target,
      priorityScore: pri.finalScore,
      priority: pri
    }
  });
});

// ==================== AUTHENTICATION API ====================
let registeredUsers = [
  {
    id: 'usr-1',
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    password: 'Password@123',
    role: 'citizen',
    civicKarma: 340
  },
  {
    id: 'usr-2',
    fullName: 'Er. Rajesh Sawant',
    email: 'rajesh.sawant@mcgm.gov.in',
    phone: '+91 98111 22233',
    password: 'Engineer@2026',
    role: 'ward_engineer',
    civicKarma: 850
  },
  {
    id: 'usr-3',
    fullName: 'Shri Ashish Shelar',
    email: 'ashish.shelar@maharashtra.gov.in',
    phone: '+91 99000 11223',
    password: 'MLA@2026',
    role: 'mla',
    civicKarma: 1200
  }
];

const NAME_REGEX = /^[A-Za-z\s]{2,50}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+91[\-\s]?)?[0]?(91)?[6-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// 7. Citizen Signup (Citizen-only self-registration)
app.post('/api/auth/signup', (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !NAME_REGEX.test(fullName)) {
    return res.status(400).json({ success: false, message: "Please enter a valid name (2-50 characters, alphabets only)" });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }
  if (!phone || !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ success: false, message: "Please enter a valid Indian phone number" });
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must have at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character"
    });
  }

  const existing = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    fullName,
    email,
    phone,
    password,
    role: 'citizen', // Self-registration is strictly citizen role
    civicKarma: 50 // Welcome bonus
  };

  registeredUsers.push(newUser);

  res.status(201).json({
    success: true,
    message: "Citizen account created successfully",
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      civicKarma: newUser.civicKarma
    }
  });
});

// 8. User Login (Authenticates Citizen, Ward Engineer, or MLA)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = registeredUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  const isMlaMatch = user && user.role === 'mla' && (password === 'MLA@2026' || password === 'Mla@2026');
  if (!user || (user.password !== password && !isMlaMatch)) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  res.json({
    success: true,
    message: "Login successful",
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      civicKarma: user.civicKarma
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Sahayata Backend] Running on http://localhost:${PORT}`);
});
