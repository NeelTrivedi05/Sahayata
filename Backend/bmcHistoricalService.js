import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'bmc_historical.db');
const SUMMARY_PATH = path.join(DATA_DIR, 'bmc_summary.json');

// Official Mumbai 24 Ward Centroids & Descriptions
export const MUMBAI_WARD_COORDS = {
  'A':   { name: 'Colaba, Fort, Nariman Point', coords: [18.927, 72.833], zone: 'South Mumbai' },
  'B':   { name: 'Sandhurst Road, Dongri, Masjid', coords: [18.950, 72.838], zone: 'South Mumbai' },
  'C':   { name: 'Marine Lines, Bhuleshwar, Kalbadevi', coords: [18.951, 72.825], zone: 'South Mumbai' },
  'D':   { name: 'Malabar Hill, Grant Road, Walkeshwar', coords: [18.963, 72.812], zone: 'South Mumbai' },
  'E':   { name: 'Byculla, Mazgaon, Mumbai Central', coords: [18.973, 72.830], zone: 'South Mumbai' },
  'F/N': { name: 'Matunga, Wadala, Sion, Hindu Colony', coords: [19.030, 72.858], zone: 'South Central' },
  'F/S': { name: 'Parel, Sewri, Naigaon', coords: [18.998, 72.842], zone: 'South Central' },
  'G/N': { name: 'Dadar, Mahim, Dharavi', coords: [19.025, 72.841], zone: 'Western Suburbs' },
  'G/S': { name: 'Worli, Lower Parel, Prabhadevi', coords: [18.995, 72.818], zone: 'South Central' },
  'H/E': { name: 'Santacruz East, Khar East, Vakola', coords: [19.075, 72.850], zone: 'Western Suburbs' },
  'H/W': { name: 'Bandra West, Khar West, Bandstand', coords: [19.060, 72.835], zone: 'Western Suburbs' },
  'K/E': { name: 'Andheri East, Jogeshwari East, MIDC', coords: [19.115, 72.860], zone: 'Western Suburbs' },
  'K/W': { name: 'Andheri West, Juhu, Versova, Lokhandwala', coords: [19.125, 72.835], zone: 'Western Suburbs' },
  'L':   { name: 'Kurla, Chunabhatti, Sakinaka', coords: [19.070, 72.885], zone: 'Eastern Suburbs' },
  'M/E': { name: 'Govandi, Mankhurd, Shivaji Nagar', coords: [19.055, 72.915], zone: 'Eastern Suburbs' },
  'M/W': { name: 'Chembur, Tilak Nagar, Pestom Sagar', coords: [19.055, 72.895], zone: 'Eastern Suburbs' },
  'N':   { name: 'Ghatkopar, Vikhroli West, Pant Nagar', coords: [19.080, 72.910], zone: 'Eastern Suburbs' },
  'P/N': { name: 'Malad, Marve, Madh Island, Dindoshi', coords: [19.185, 72.845], zone: 'Western Suburbs' },
  'P/S': { name: 'Goregaon, Aarey Colony, Bangur Nagar', coords: [19.165, 72.845], zone: 'Western Suburbs' },
  'R/C': { name: 'Borivali, Gorai, Eksar', coords: [19.225, 72.855], zone: 'Western Suburbs' },
  'R/N': { name: 'Dahisar, Mandapeshwar', coords: [19.250, 72.860], zone: 'Western Suburbs' },
  'R/S': { name: 'Kandivali, Charkop, Poisar', coords: [19.205, 72.850], zone: 'Western Suburbs' },
  'S':   { name: 'Bhandup, Powai, Kanjurmarg, IIT', coords: [19.130, 72.930], zone: 'Eastern Suburbs' },
  'T':   { name: 'Mulund, Nahur', coords: [19.175, 72.950], zone: 'Eastern Suburbs' }
};

let db = null;
let summaryCache = null;

function loadSummaryCache() {
  if (!summaryCache && fs.existsSync(SUMMARY_PATH)) {
    try {
      const raw = fs.readFileSync(SUMMARY_PATH, 'utf-8');
      summaryCache = JSON.parse(raw);
    } catch (err) {
      console.warn('[BMC Historical] Error reading bmc_summary.json:', err.message);
    }
  }
  return summaryCache;
}

export function getBmcDb() {
  if (!db) {
    if (!fs.existsSync(DB_PATH)) {
      console.warn(`[BMC Historical] Database file not found at ${DB_PATH}. Please run python scripts/import_bmc_data.py`);
      return null;
    }
    try {
      db = new DatabaseSync(DB_PATH);
      console.log(`[BMC Historical] Connected to SQLite database at ${DB_PATH}`);
    } catch (err) {
      console.error(`[BMC Historical] Failed to open SQLite database:`, err.message);
      return null;
    }
  }
  return db;
}

// Map BMC categories to Sahayata's standard internal category tokens
function mapCategoryToSahayata(cat) {
  if (!cat) return 'other';
  const lower = cat.toLowerCase();
  if (lower.includes('pothole') || lower.includes('road')) return 'pothole';
  if (lower.includes('garbage') || lower.includes('waste')) return 'garbage';
  if (lower.includes('drainage') || lower.includes('sewage')) return 'drainage';
  if (lower.includes('water')) return 'water';
  if (lower.includes('street') || lower.includes('light')) return 'electricity';
  if (lower.includes('tree') || lower.includes('horticulture')) return 'tree';
  if (lower.includes('footpath') || lower.includes('sidewalk')) return 'footpath';
  if (lower.includes('encroachment')) return 'encroachment';
  if (lower.includes('noise')) return 'noise';
  if (lower.includes('toilet')) return 'sanitation';
  if (lower.includes('animal')) return 'animal';
  if (lower.includes('mosquito') || lower.includes('pest')) return 'health';
  return 'civic';
}

function mapStatusToSahayata(status) {
  if (!status) return 'reported';
  const lower = status.toLowerCase();
  if (lower.includes('resolved')) return 'resolved';
  if (lower.includes('in progress')) return 'in_progress';
  if (lower.includes('escalated')) return 'escalated';
  if (lower.includes('reopened')) return 'reopened';
  if (lower.includes('closed')) return 'closed';
  return 'reported';
}

function mapStatusToStep(status) {
  const lower = (status || '').toLowerCase();
  if (lower.includes('resolved')) return 5;
  if (lower.includes('in progress')) return 4;
  if (lower.includes('escalated')) return 4;
  if (lower.includes('reopened')) return 2;
  if (lower.includes('closed')) return 6;
  return 1;
}

/**
 * Normalization layer function:
 * Converts a raw BMC database row into a standardized Sahayata-compatible format
 * preserving all 35 original fields without data loss.
 */
export function normalizeBmcComplaint(row) {
  if (!row) return null;

  const wardInfo = MUMBAI_WARD_COORDS[row.ward_code] || {
    name: row.ward_area || `Ward ${row.ward_code}`,
    coords: [19.0760, 72.8777],
    zone: row.zone || 'Mumbai'
  };

  return {
    source: "BMC_HISTORICAL",
    
    // Complete 35-field original historical record
    historicalData: {
      complaint_id: row.complaint_id,
      complaint_date: row.complaint_date,
      year: Number(row.year),
      month: Number(row.month),
      is_monsoon_season: Boolean(row.is_monsoon_season),
      complaint_time_of_day: row.complaint_time_of_day,
      ward_code: row.ward_code,
      ward_area: row.ward_area,
      zone: row.zone,
      ward_type: row.ward_type,
      population_density: row.population_density,
      ward_slum_percentage: Number(row.ward_slum_percentage),
      complaint_category: row.complaint_category,
      department_assigned: row.department_assigned,
      complaint_channel: row.complaint_channel,
      severity: row.severity,
      has_photo_evidence: Boolean(row.has_photo_evidence),
      has_gps_location: Boolean(row.has_gps_location),
      media_attention: Boolean(row.media_attention),
      politically_sensitive: Boolean(row.politically_sensitive),
      complainant_type: row.complainant_type,
      property_type: row.property_type,
      repeat_complainant: Boolean(row.repeat_complainant),
      prior_complaints_count: Number(row.prior_complaints_count),
      resolution_days: Number(row.resolution_days),
      num_reassignments: Number(row.num_reassignments),
      complaint_status: row.complaint_status,
      contractor_category: row.contractor_category,
      work_quality_rating: row.work_quality_rating,
      site_inspected: Boolean(row.site_inspected),
      defect_liability_claim: Boolean(row.defect_liability_claim),
      estimated_cost_inr: Number(row.estimated_cost_inr),
      infrastructure_age_years: Number(row.infrastructure_age_years),
      months_since_last_maintained: Number(row.months_since_last_maintained),
      citizen_satisfied: Boolean(row.citizen_satisfied)
    },

    // Sahayata-compatible view for standard UI components
    sahayata: {
      id: row.complaint_id,
      title: `${row.complaint_category} grievance in Ward ${row.ward_code}`,
      category: mapCategoryToSahayata(row.complaint_category),
      categoryLabel: row.complaint_category,
      status: mapStatusToSahayata(row.complaint_status),
      statusLabel: row.complaint_status,
      statusStep: mapStatusToStep(row.complaint_status),
      address: `${row.ward_area || 'Ward ' + row.ward_code}, Ward ${row.ward_code}, Mumbai`,
      ward: row.ward_code,
      wardArea: row.ward_area,
      zone: row.zone,
      coords: wardInfo.coords, // Display at ward center; coordinates are never fabricated as point GPS!
      hasGpsLocation: Boolean(row.has_gps_location),
      hasPhotoEvidence: Boolean(row.has_photo_evidence),
      reportedAt: row.complaint_date,
      severity: row.severity,
      slaDays: row.resolution_days,
      estimatedCostInr: row.estimated_cost_inr,
      departmentAssigned: row.department_assigned,
      citizenSatisfied: Boolean(row.citizen_satisfied),
      isHistorical: true
    }
  };
}

/**
 * Fetch global or filtered high-level BMC statistics.
 */
export function getBmcStats(filters = {}) {
  const hasFilters = filters.ward_code || filters.year || filters.month || filters.category || filters.department || filters.severity;

  // Use pre-computed summary when no specific filters are applied
  if (!hasFilters) {
    const summary = loadSummaryCache();
    if (summary && summary.stats) {
      return summary.stats;
    }
  }

  const database = getBmcDb();
  if (!database) return null;

  const conditions = [];
  const params = [];

  if (filters.ward_code) {
    conditions.push("ward_code = ?");
    params.push(filters.ward_code);
  }
  if (filters.year) {
    conditions.push("year = ?");
    params.push(Number(filters.year));
  }
  if (filters.month) {
    conditions.push("month = ?");
    params.push(Number(filters.month));
  }
  if (filters.category) {
    conditions.push("complaint_category = ?");
    params.push(filters.category);
  }
  if (filters.department) {
    conditions.push("department_assigned = ?");
    params.push(filters.department);
  }
  if (filters.severity) {
    conditions.push("severity = ?");
    params.push(filters.severity);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      COUNT(*) AS totalComplaints,
      SUM(CASE WHEN complaint_status = 'Resolved' THEN 1 ELSE 0 END) AS resolvedCount,
      SUM(CASE WHEN complaint_status = 'In Progress' THEN 1 ELSE 0 END) AS inProgressCount,
      SUM(CASE WHEN complaint_status = 'Closed Without Resolution' THEN 1 ELSE 0 END) AS closedCount,
      SUM(CASE WHEN complaint_status = 'Escalated' THEN 1 ELSE 0 END) AS escalatedCount,
      SUM(CASE WHEN complaint_status = 'Reopened' THEN 1 ELSE 0 END) AS reopenedCount,
      ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
      ROUND(AVG(work_quality_rating), 2) AS avgWorkQualityRating,
      ROUND(AVG(site_inspected) * 100, 2) AS siteInspectionRate,
      ROUND(AVG(citizen_satisfied) * 100, 2) AS citizenSatisfactionRate,
      ROUND(AVG(estimated_cost_inr), 2) AS avgEstimatedCost,
      ROUND(AVG(infrastructure_age_years), 1) AS avgInfrastructureAge,
      ROUND(AVG(months_since_last_maintained), 1) AS avgMaintenanceGapMonths,
      SUM(CASE WHEN is_monsoon_season = 1 THEN 1 ELSE 0 END) AS monsoonComplaints,
      SUM(CASE WHEN repeat_complainant = 1 THEN 1 ELSE 0 END) AS repeatComplaints,
      SUM(CASE WHEN has_photo_evidence = 1 THEN 1 ELSE 0 END) AS photoEvidenceCount,
      SUM(CASE WHEN has_gps_location = 1 THEN 1 ELSE 0 END) AS gpsLocationCount
    FROM bmc_historical_complaints
    ${whereClause};
  `;

  const stats = database.prepare(query).get(...params);

  // Category Distribution
  const catQuery = `
    SELECT complaint_category AS category, COUNT(*) AS count,
           ROUND(AVG(citizen_satisfied) * 100, 1) AS satisfactionRate,
           ROUND(AVG(resolution_days), 1) AS avgResolutionDays
    FROM bmc_historical_complaints
    ${whereClause}
    GROUP BY complaint_category
    ORDER BY count DESC;
  `;
  const categories = database.prepare(catQuery).all(...params);

  // Ward Top Distribution
  const wardQuery = `
    SELECT ward_code AS wardCode, ward_area AS wardArea, COUNT(*) AS count,
           ROUND(AVG(citizen_satisfied) * 100, 1) AS satisfactionRate,
           ROUND(AVG(resolution_days), 1) AS avgResolutionDays
    FROM bmc_historical_complaints
    ${whereClause}
    GROUP BY ward_code
    ORDER BY count DESC;
  `;
  const wards = database.prepare(wardQuery).all(...params);

  // Severity Distribution
  const sevQuery = `
    SELECT severity, COUNT(*) AS count,
           ROUND(AVG(citizen_satisfied) * 100, 1) AS satisfactionRate
    FROM bmc_historical_complaints
    ${whereClause}
    GROUP BY severity
    ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END;
  `;
  const severities = database.prepare(sevQuery).all(...params);

  const total = stats.totalComplaints || 0;
  return {
    ...stats,
    categories,
    wards,
    severities,
    monsoonRate: total > 0 ? ((stats.monsoonComplaints / total) * 100).toFixed(1) : 0,
    resolvedRate: total > 0 ? ((stats.resolvedCount / total) * 100).toFixed(1) : 0,
    repeatRate: total > 0 ? ((stats.repeatComplaints / total) * 100).toFixed(1) : 0
  };
}

/**
 * Paginated query for complaints with multi-field filtering.
 */
export function getBmcComplaints(options = {}) {
  const database = getBmcDb();
  if (!database) return { total: 0, data: [], page: 1, pageSize: 20, totalPages: 0 };

  const page = Math.max(1, Number(options.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  const params = [];

  if (options.ward_code) {
    conditions.push("ward_code = ?");
    params.push(options.ward_code);
  }
  if (options.year) {
    conditions.push("year = ?");
    params.push(Number(options.year));
  }
  if (options.month) {
    conditions.push("month = ?");
    params.push(Number(options.month));
  }
  if (options.category) {
    conditions.push("complaint_category = ?");
    params.push(options.category);
  }
  if (options.department) {
    conditions.push("department_assigned = ?");
    params.push(options.department);
  }
  if (options.severity) {
    conditions.push("severity = ?");
    params.push(options.severity);
  }
  if (options.status) {
    conditions.push("complaint_status = ?");
    params.push(options.status);
  }
  if (options.citizen_satisfied !== undefined && options.citizen_satisfied !== '') {
    conditions.push("citizen_satisfied = ?");
    params.push(Number(options.citizen_satisfied));
  }
  if (options.search) {
    conditions.push("(complaint_id LIKE ? OR ward_area LIKE ?)");
    params.push(`%${options.search}%`, `%${options.search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total matching
  const countSql = `SELECT COUNT(*) as total FROM bmc_historical_complaints ${whereClause};`;
  const countResult = database.prepare(countSql).get(...params);
  const total = countResult ? countResult.total : 0;
  const totalPages = Math.ceil(total / pageSize);

  // Fetch paginated records using indexed primary key
  const querySql = `
    SELECT * FROM bmc_historical_complaints
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?;
  `;
  const rows = database.prepare(querySql).all(...params, pageSize, offset);

  return {
    total,
    page,
    pageSize,
    totalPages,
    data: rows.map(normalizeBmcComplaint)
  };
}

/**
 * Fetch a single complaint by complaint_id.
 */
export function getBmcComplaintById(complaintId) {
  const database = getBmcDb();
  if (!database) return null;

  const row = database.prepare("SELECT * FROM bmc_historical_complaints WHERE complaint_id = ?").get(complaintId);
  return normalizeBmcComplaint(row);
}

/**
 * Category breakdown analytics.
 */
export function getBmcCategories() {
  const summary = loadSummaryCache();
  if (summary && summary.categories) return summary.categories;

  const database = getBmcDb();
  if (!database) return [];

  const query = `
    SELECT 
      complaint_category AS category,
      department_assigned AS primaryDepartment,
      COUNT(*) AS totalComplaints,
      ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
      ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
      ROUND(AVG(work_quality_rating), 2) AS avgWorkQuality,
      ROUND(AVG(estimated_cost_inr), 0) AS avgCost,
      SUM(CASE WHEN severity IN ('High', 'Critical') THEN 1 ELSE 0 END) AS highSeverityCount,
      SUM(CASE WHEN is_monsoon_season = 1 THEN 1 ELSE 0 END) AS monsoonComplaints
    FROM bmc_historical_complaints
    GROUP BY complaint_category
    ORDER BY totalComplaints DESC;
  `;
  return database.prepare(query).all();
}

/**
 * 24-Ward civic breakdown with population density, slum %, and performance.
 */
export function getBmcWards() {
  const summary = loadSummaryCache();
  if (summary && summary.wards) return summary.wards;

  const database = getBmcDb();
  if (!database) return [];

  const query = `
    SELECT 
      ward_code AS wardCode,
      ward_area AS wardArea,
      zone,
      ward_type AS wardType,
      MAX(population_density) AS populationDensity,
      MAX(ward_slum_percentage) AS slumPercentage,
      COUNT(*) AS totalComplaints,
      ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
      ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
      ROUND(AVG(site_inspected) * 100, 2) AS siteInspectionRate,
      SUM(CASE WHEN complaint_status = 'Resolved' THEN 1 ELSE 0 END) AS resolvedCount,
      SUM(CASE WHEN is_monsoon_season = 1 THEN 1 ELSE 0 END) AS monsoonComplaints
    FROM bmc_historical_complaints
    GROUP BY ward_code
    ORDER BY totalComplaints DESC;
  `;
  const wards = database.prepare(query).all();

  return wards.map(w => ({
    ...w,
    coords: MUMBAI_WARD_COORDS[w.wardCode]?.coords || [19.0760, 72.8777],
    wardFullName: MUMBAI_WARD_COORDS[w.wardCode]?.name || w.wardArea
  }));
}

/**
 * Department performance analytics.
 */
export function getBmcDepartments() {
  const summary = loadSummaryCache();
  if (summary && summary.departments) return summary.departments;

  const database = getBmcDb();
  if (!database) return [];

  const query = `
    SELECT 
      department_assigned AS department,
      COUNT(*) AS totalComplaints,
      ROUND(AVG(num_reassignments), 2) AS avgReassignments,
      ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
      ROUND(AVG(work_quality_rating), 2) AS avgWorkQuality,
      ROUND(AVG(site_inspected) * 100, 2) AS siteInspectionRate,
      ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
      ROUND(AVG(estimated_cost_inr), 0) AS avgCost
    FROM bmc_historical_complaints
    GROUP BY department_assigned
    ORDER BY totalComplaints DESC;
  `;
  return database.prepare(query).all();
}

/**
 * Temporal trends: yearly, monthly, and monsoon impact.
 */
export function getBmcTrends() {
  const summary = loadSummaryCache();
  if (summary && summary.trends) return summary.trends;

  const database = getBmcDb();
  if (!database) return { yearly: [], monthly: [], monsoonComparison: {} };

  const yearlyQuery = `
    SELECT 
      year,
      COUNT(*) AS totalComplaints,
      ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
      ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
      SUM(CASE WHEN complaint_status = 'Resolved' THEN 1 ELSE 0 END) AS resolvedCount,
      SUM(CASE WHEN is_monsoon_season = 1 THEN 1 ELSE 0 END) AS monsoonComplaints
    FROM bmc_historical_complaints
    GROUP BY year
    ORDER BY year ASC;
  `;
  const yearly = database.prepare(yearlyQuery).all();

  const monthlyQuery = `
    SELECT 
      month,
      COUNT(*) AS totalComplaints,
      ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
      ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate
    FROM bmc_historical_complaints
    GROUP BY month
    ORDER BY month ASC;
  `;
  const monthly = database.prepare(monthlyQuery).all();

  const monsoonQuery = `
    SELECT 
      is_monsoon_season AS isMonsoon,
      COUNT(*) AS totalComplaints,
      ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
      ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
      ROUND(AVG(estimated_cost_inr), 0) AS avgCost
    FROM bmc_historical_complaints
    GROUP BY is_monsoon_season;
  `;
  const monsoonRows = database.prepare(monsoonQuery).all();

  return {
    yearly,
    monthly,
    monsoonComparison: {
      monsoon: monsoonRows.find(r => r.isMonsoon === 1) || null,
      nonMonsoon: monsoonRows.find(r => r.isMonsoon === 0) || null
    }
  };
}

/**
 * Geographic ward map aggregations for Mumbai.
 */
export function getBmcMapData() {
  const summary = loadSummaryCache();
  if (summary && summary.mapData) return summary.mapData;

  const wards = getBmcWards();
  return wards.map(w => ({
    wardCode: w.wardCode,
    wardName: w.wardFullName,
    zone: w.zone,
    coords: w.coords,
    totalComplaints: w.totalComplaints,
    satisfactionRate: w.satisfactionRate,
    avgResolutionDays: w.avgResolutionDays,
    slumPercentage: w.slumPercentage,
    populationDensity: w.populationDensity,
    siteInspectionRate: w.siteInspectionRate,
    monsoonComplaints: w.monsoonComplaints
  }));
}
