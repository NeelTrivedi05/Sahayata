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
      name: "Pothole near St. Andrew's School (Triggers Duplicate Clustering)",
      category: "pothole",
      categoryLabel: "Road Hazard & Pothole",
      phash: "a1b2c3d4e5f60719", // Hamming distance 1 with CIVIC-2026-8921 (Near identical)
      image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      coords: [19.0558, 72.8295],
      address: "Hill Road, Near St. Andrew's Church, Bandra West, Mumbai",
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
      name: "Broken Streetlight on Lilavati Hospital Corridor",
      category: "electricity",
      categoryLabel: "Electrical & Lighting",
      image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80",
      coords: [19.0514, 72.8296],
      address: "Lilavati Hospital Emergency Access Lane, Bandra West, Mumbai",
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
      coords: [19.0610, 72.8350],
      address: "Turner Road Junction, Near Bandra Station, Mumbai",
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

