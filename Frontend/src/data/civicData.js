export const CIVIC_DATA = {
  jurisdiction: {
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
      resolvedThisMonth: 212,
      hotspotsIdentified: 3
    },
    engineer: "Er. Rajesh Sawant (Executive Engineer, Ward H/West)",
    helpline: "1916"
  },

  criticalZones: [
    {
      id: "cz_1",
      name: "St. Andrew's High School (Bandra)",
      type: "school",
      coords: [19.0558, 72.8290],
      bufferRadius: 180,
      multiplier: 2.2,
      tag: "School Zone (Child Safety Corridor)"
    },
    {
      id: "cz_2",
      name: "Lilavati Hospital & Research Centre",
      type: "hospital",
      coords: [19.0514, 72.8296],
      bufferRadius: 250,
      multiplier: 2.5,
      tag: "Hospital Ambulance Corridor"
    },
    {
      id: "cz_3",
      name: "Bandra Railway & Bus Transit Hub",
      type: "transit",
      coords: [19.0595, 72.8405],
      bufferRadius: 150,
      multiplier: 1.8,
      tag: "High Pedestrian Transit Zone"
    }
  ],

  sampleReports: [
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
      phash: "a1b2c3d4e5f60718",
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
      phash: "f0e1d2c3b4a59687",
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
      phash: "123456789abcdef0",
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
    }
  ],

  reportingPresets: [
    {
      id: "preset_pothole",
      name: "Deep Crater Pothole near St. Andrew's School",
      category: "pothole",
      categoryLabel: "Road Hazard & Pothole",
      baseSeverity: 35,
      slaHours: 48,
      phash: "a1b2c3d4e5f60719",
      image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      coords: [19.0558, 72.8295],
      address: "Hill Road, Near St. Andrew's Church, Bandra West, Mumbai",
      aiClarification: {
        question: "Is this pothole affecting the active school bus drop-off zone or pedestrian crosswalk?",
        options: [
          "Yes, directly at school bus gate (High Hazard)",
          "Within 50m of busy pedestrian crosswalk",
          "On regular roadside shoulder / curb side"
        ]
      }
    },
    {
      id: "preset_light",
      name: "Broken Streetlight & Exposed Wire on Hospital Corridor",
      category: "electricity",
      categoryLabel: "Electrical & Lighting",
      baseSeverity: 42,
      slaHours: 12,
      image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80",
      coords: [19.0514, 72.8296],
      address: "Lilavati Hospital Emergency Access Lane, Bandra West, Mumbai",
      aiClarification: {
        question: "Are live sparks or exposed cables accessible to pedestrians or water pooling?",
        options: [
          "Yes, exposed live wire hanging low (Critical Hazard)",
          "Pole leaning towards roadway / vehicle lane",
          "Dark lamp bulb only, wiring enclosed"
        ]
      }
    },
    {
      id: "preset_water",
      name: "Burst Water Main Flooding Street",
      category: "water",
      categoryLabel: "Water Supply & Pipe Leakage",
      baseSeverity: 30,
      slaHours: 24,
      image: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
      coords: [19.0610, 72.8350],
      address: "Turner Road Junction, Near Bandra Station, Mumbai",
      aiClarification: {
        question: "Is the water leakage clean drinking water pipe or contaminated sewage overflow?",
        options: [
          "High pressure drinking water pipe burst",
          "Contaminated sewage / Open drain overflow",
          "Slow seepage without road submergence"
        ]
      }
    },
    {
      id: "preset_garbage",
      name: "Overflowing Garbage Dump blocking Footpath",
      category: "garbage",
      categoryLabel: "Solid Waste & Sanitation",
      baseSeverity: 28,
      slaHours: 24,
      image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
      coords: [12.9765, 77.6385],
      address: "12th Main Corner, Near BDA Complex, Ward 142",
      aiClarification: {
        question: "Does the garbage dump contain bio-medical waste or block public access completely?",
        options: [
          "Bio-hazard / Medical waste mixed (Urgent Action)",
          "Completely blocking pedestrian walkway",
          "Overfilled bin, walkway partially clear"
        ]
      }
    },
    {
      id: "preset_drainage",
      name: "Clogged Stormwater Drain & Street Inundation",
      category: "drainage",
      categoryLabel: "Stormwater Drain & Flooding",
      baseSeverity: 36,
      slaHours: 18,
      image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80",
      coords: [12.9750, 77.6410],
      address: "8th Main Road, Ward 142 Low-lying Area",
      aiClarification: {
        question: "Is floodwater entering residential basements or commercial shops?",
        options: [
          "Water actively entering residential basements (Severe Flooding)",
          "Waterlogging on main traffic lane",
          "Slow drainage runoff along gutter"
        ]
      }
    },
    {
      id: "preset_traffic",
      name: "Fallen Tree Branch & Damaged Signal",
      category: "traffic",
      categoryLabel: "Traffic Hazard & Obstruction",
      baseSeverity: 32,
      slaHours: 24,
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      coords: [12.9730, 77.6430],
      address: "Double Road Intersection, Ward 142",
      aiClarification: {
        question: "Is the obstruction completely blocking traffic flow or emergency vehicles?",
        options: [
          "Entire lane blocked on major transit artery (High Congestion)",
          "Blind spot created near turning radius",
          "Partial shoulder obstruction"
        ]
      }
    }
  ]
};

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

  // Dynamic AI Clarification Priority Bonus
  let clarificationBonus = 0;
  const clar = report.resolution?.note || report.clarificationAnswer || "";
  if (clar.includes("High Hazard") || clar.includes("Critical") || clar.includes("Urgent") || clar.includes("Severe Flooding") || clar.includes("High Congestion")) {
    clarificationBonus = 18;
  } else if (clar.includes("crosswalk") || clar.includes("submerged") || clar.includes("blocking")) {
    clarificationBonus = 10;
  }

  // Anti-Deadlock Aging Engine
  let agingBonus = 0;
  const elapsed = report.elapsedHours || 0;
  const sla = report.slaHours || 48;
  if (elapsed > sla) {
    agingBonus = Math.min(18 + (elapsed - sla) * 2.2, 45); // Surges priority when neglected
  } else {
    agingBonus = (elapsed / sla) * 12;
  }

  const rawScore = base + dupBonus + criticalBonus + trafficBonus + clarificationBonus + agingBonus;
  const finalScore = Math.min(Math.round(rawScore), 100);

  return {
    finalScore,
    isOverdue: elapsed > sla,
    overdueHours: Math.max(0, elapsed - sla),
    breakdown: {
      base: Math.round(base),
      dup: Math.round(dupBonus),
      critical: Math.round(criticalBonus),
      traffic: Math.round(trafficBonus),
      clarification: Math.round(clarificationBonus),
      aging: Math.round(agingBonus)
    }
  };
}
