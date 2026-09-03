export const CIVIC_DATA = {
  jurisdiction: {
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
      resolvedThisMonth: 184,
      hotspotsIdentified: 3
    },
    engineer: "Er. Ravi Kumar (Executive Engineer, Ward 142)",
    helpline: "1533"
  },

  criticalZones: [
    {
      id: "cz_1",
      name: "St. Mary's Girls High School",
      type: "school",
      coords: [12.9719, 77.6412],
      bufferRadius: 180,
      multiplier: 2.2,
      tag: "School Zone (Child Safety Corridor)"
    },
    {
      id: "cz_2",
      name: "Apollo Lifeline Emergency Hospital",
      type: "hospital",
      coords: [12.9785, 77.6440],
      bufferRadius: 250,
      multiplier: 2.5,
      tag: "Hospital Ambulance Corridor"
    },
    {
      id: "cz_3",
      name: "Indiranagar Metro Station Transit Hub",
      type: "transit",
      coords: [12.9783, 77.6387],
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
      coords: [12.9723, 77.6418],
      address: "Opposite Gate 2, St. Mary's High School Road, Indiranagar",
      status: "assigned",
      statusStep: 4, // 1: Reported, 2: Clustered, 3: Prioritized, 4: Assigned, 5: Resolved, 6: Citizen Verified
      slaHours: 48,
      elapsedHours: 54, // Overdue! Deadlock breaker active
      duplicateCount: 14,
      impactRadiusMeters: 140,
      criticalZone: "St. Mary's Girls High School (60m)",
      trafficDensity: "High (School Bus Route)",
      baseSeverity: 35,
      reportedBy: "Priya S. & 14 others",
      reportedAt: "2 days ago",
      beforeImage: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      afterImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
      resolution: {
        assignedTo: "Er. Ravi Kumar (Ward 142)",
        contractor: "Falcon Road Infrastructure Ltd.",
        note: "Compaction scheduled with emergency cold-mix bitumen.",
        inspectionStatus: "Work Order #BBMP-4481 Dispatched"
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
        assignedTo: "Er. Ravi Kumar",
        contractor: "CleanCity BBMP Waste Marshall Squad #4",
        note: "Waste cleared, footpath washed and sanitized.",
        aiConfidence: "95.8% Cleanliness Cleared"
      }
    },
    {
      id: "CIVIC-2026-8877",
      title: "Broken Streetlight & Hanging Live Wire",
      category: "electricity",
      categoryLabel: "Electrical & Lighting",
      coords: [12.9785, 77.6440],
      address: "Ambulance Access Lane, Near Apollo Hospital",
      status: "verified",
      statusStep: 6, // Completed & verified
      slaHours: 12,
      elapsedHours: 11,
      duplicateCount: 5,
      impactRadiusMeters: 80,
      criticalZone: "Apollo Hospital Ambulance Corridor",
      trafficDensity: "High (Ambulance Route)",
      baseSeverity: 40,
      reportedBy: "Dr. Ananya Rao",
      reportedAt: "Yesterday",
      beforeImage: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80",
      afterImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      resolution: {
        assignedTo: "Er. Ramesh Gowda (BESCOM Lineman)",
        contractor: "BESCOM Emergency Wing",
        note: "Insulated junction replaced, 120W LED lamp installed and tested.",
        aiConfidence: "98.2% Illumination Restored"
      }
    }
  ],

  reportingPresets: [
    {
      id: "preset_pothole",
      name: "Pothole near St. Mary's School (Triggers Duplicate Clustering)",
      category: "pothole",
      categoryLabel: "Road Hazard & Pothole",
      image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      coords: [12.9723, 77.6418],
      address: "St. Mary's High School Road, Indiranagar",
      aiClarification: {
        question: "Is this pothole affecting the active school bus drop-off zone or pedestrian crosswalk?",
        options: [
          "Yes, directly at school bus gate (High Hazard)",
          "Within 50m of crosswalk",
          "On regular roadside shoulder"
        ]
      }
    },
    {
      id: "preset_light",
      name: "Broken Streetlight on Ambulance Corridor",
      category: "electricity",
      categoryLabel: "Electrical & Lighting",
      image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80",
      coords: [12.9785, 77.6440],
      address: "Ambulance Access Lane, Near Apollo Hospital",
      aiClarification: {
        question: "Are live sparks or exposed cables accessible to pedestrians?",
        options: [
          "Yes, exposed wire hanging dangerously low",
          "Pole leaning towards roadway",
          "Dark bulb only, no exposed wire"
        ]
      }
    },
    {
      id: "preset_water",
      name: "Burst Water Main Flooding Street",
      category: "water",
      categoryLabel: "Water Supply & Sewage",
      image: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
      coords: [12.9740, 77.6390],
      address: "100 Feet Road, Junction 4, Indiranagar",
      aiClarification: {
        question: "Is the water leakage clean potable water or contaminated sewage?",
        options: [
          "Potable clean drinking water (High Pressure)",
          "Contaminated sewage / Drain overflow",
          "Minor slow leak without pooling"
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

  // Anti-Deadlock Aging Engine
  let agingBonus = 0;
  const elapsed = report.elapsedHours || 0;
  const sla = report.slaHours || 48;
  if (elapsed > sla) {
    agingBonus = Math.min(18 + (elapsed - sla) * 2.2, 45); // Surges priority when neglected
  } else {
    agingBonus = (elapsed / sla) * 12;
  }

  const rawScore = base + dupBonus + criticalBonus + trafficBonus + agingBonus;
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
      aging: Math.round(agingBonus)
    }
  };
}
