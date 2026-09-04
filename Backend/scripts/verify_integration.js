#!/usr/bin/env node
/**
 * End-to-End Automated Verification Script for Sahayata BMC Integration
 */

async function runVerification() {
  console.log('='.repeat(70));
  console.log('SAHAYATA & BMC HISTORICAL DATASET - AUTOMATED VERIFICATION');
  console.log('='.repeat(70));

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  // 1. Check Frontend dev server
  try {
    const feRes = await fetch('http://localhost:5173');
    assert(feRes.status === 200, 'Frontend Dev Server responds with HTTP 200 at http://localhost:5173');
    const feHtml = await feRes.text();
    assert(feHtml.includes('id="root"'), 'Frontend serves HTML with React mount point #root');
  } catch (err) {
    assert(false, `Frontend Dev Server connection failed: ${err.message}`);
  }

  // 2. Check Backend Jurisdiction (Mumbai / BMC)
  try {
    const jurRes = await fetch('http://localhost:5000/api/jurisdiction').then(r => r.json());
    assert(jurRes.success === true, 'Backend /api/jurisdiction is online');
    assert(jurRes.data.corporation.includes('BMC'), `Corporation is BMC (${jurRes.data.corporation})`);
    assert(jurRes.data.city === 'Mumbai', `City is Mumbai (${jurRes.data.city})`);
  } catch (err) {
    assert(false, `Jurisdiction check failed: ${err.message}`);
  }

  // 3. Check Live Reports & Source Separation
  try {
    const repRes = await fetch('http://localhost:5000/api/reports').then(r => r.json());
    assert(repRes.success === true, 'Backend /api/reports responds successfully');
    assert(Array.isArray(repRes.data) && repRes.data.length > 0, `Returns ${repRes.data?.length} live reports`);
    const allSeparated = repRes.data.every(r => r.source === 'DEMO' || r.source === 'SAHAYATA_LIVE');
    assert(allSeparated, `Live reports strictly labeled source='DEMO' or 'SAHAYATA_LIVE' (found: ${repRes.data[0]?.source})`);
  } catch (err) {
    assert(false, `Live reports check failed: ${err.message}`);
  }

  // 4. Check BMC Historical Stats API
  let statsData = null;
  try {
    const statsRes = await fetch('http://localhost:5000/api/historical/bmc/stats').then(r => r.json());
    statsData = statsRes;
    assert(statsRes.success === true, 'GET /api/historical/bmc/stats returns HTTP 200');
    assert(statsRes.totalComplaints === 960000, `Total historical complaints is exactly 960,000 (${statsRes.totalComplaints.toLocaleString()})`);
    assert(statsRes.resolvedCount === 556014, `Resolved count is 556,014 (${statsRes.resolvedRate}% resolution rate)`);
    assert(Number(statsRes.avgResolutionDays) > 10, `Avg resolution days is ${statsRes.avgResolutionDays} days`);
    assert(Number(statsRes.citizenSatisfactionRate) > 70, `Citizen satisfaction rate is ${statsRes.citizenSatisfactionRate}%`);
    assert(statsRes.categories.length === 13, `Reports 13 civic categories`);
    assert(statsRes.wards.length === 24, `Reports 24 municipal wards`);
  } catch (err) {
    assert(false, `BMC stats check failed: ${err.message}`);
  }

  // 5. Check BMC 24 Wards API
  try {
    const wardsRes = await fetch('http://localhost:5000/api/historical/bmc/wards').then(r => r.json());
    assert(wardsRes.success === true && wardsRes.wards.length === 24, `GET /api/historical/bmc/wards returns all 24 wards`);
    const kw = wardsRes.wards.find(w => w.wardCode === 'K/W');
    assert(Boolean(kw), `Ward K/W (Andheri West) exists with ${kw?.totalComplaints} complaints and ${kw?.slumPercentage}% slum density`);
    assert(Array.isArray(kw.coords) && kw.coords.length === 2, `Ward centroid coordinates available for map (${kw?.coords})`);
  } catch (err) {
    assert(false, `BMC wards check failed: ${err.message}`);
  }

  // 6. Check BMC 13 Categories API
  try {
    const catsRes = await fetch('http://localhost:5000/api/historical/bmc/categories').then(r => r.json());
    assert(catsRes.success === true && catsRes.categories.length === 13, `GET /api/historical/bmc/categories returns 13 categories`);
    const pothole = catsRes.categories.find(c => c.category.includes('Pothole'));
    assert(Boolean(pothole), `Potholes/Roads category present (${pothole?.totalComplaints} complaints, avg SLA ${pothole?.avgResolutionDays}d)`);
  } catch (err) {
    assert(false, `BMC categories check failed: ${err.message}`);
  }

  // 7. Check BMC Department Efficiency API
  try {
    const deptsRes = await fetch('http://localhost:5000/api/historical/bmc/departments').then(r => r.json());
    assert(deptsRes.success === true && deptsRes.departments.length > 0, `GET /api/historical/bmc/departments returns ${deptsRes.departments.length} departments`);
    assert(deptsRes.departments[0].avgWorkQuality > 0, `Work quality ratings tracked (★ ${deptsRes.departments[0].avgWorkQuality} / 5.0)`);
  } catch (err) {
    assert(false, `BMC departments check failed: ${err.message}`);
  }

  // 8. Check BMC Longitudinal Trends API
  try {
    const trendsRes = await fetch('http://localhost:5000/api/historical/bmc/trends').then(r => r.json());
    assert(trendsRes.success === true, 'GET /api/historical/bmc/trends returns successfully');
    assert(trendsRes.yearly.length === 7, `Yearly trends span 7 years (2018–2024)`);
    assert(trendsRes.monthly.length === 12, `Monthly trends span 12 months`);
    assert(Boolean(trendsRes.monsoonComparison.monsoon), `Monsoon comparison calculated (${trendsRes.monsoonComparison.monsoon?.totalComplaints.toLocaleString()} monsoon complaints)`);
  } catch (err) {
    assert(false, `BMC trends check failed: ${err.message}`);
  }

  // 9. Check BMC Paginated Complaints & 35-Field Normalization
  try {
    const t0 = Date.now();
    const compRes = await fetch('http://localhost:5000/api/historical/bmc/complaints?page=1&pageSize=10&ward_code=K/W').then(r => r.json());
    const latency = Date.now() - t0;
    assert(compRes.success === true, 'GET /api/historical/bmc/complaints returns HTTP 200');
    assert(latency < 50, `Indexed pagination query executed in ${latency}ms (target < 50ms)`);
    assert(compRes.data.length === 10, `Returned 10 paginated records (total in ward: ${compRes.total.toLocaleString()})`);

    const first = compRes.data[0];
    assert(first.source === 'BMC_HISTORICAL', `Record explicitly tagged source="BMC_HISTORICAL"`);
    assert(Boolean(first.historicalData) && Boolean(first.sahayata), `Contains both 'historicalData' (original) and 'sahayata' (normalized) models`);
    
    const fieldCount = Object.keys(first.historicalData).length;
    assert(fieldCount === 35, `Preserved all 35 BMC original fields (found: ${fieldCount})`);

    // Verify single complaint detail endpoint
    const singleRes = await fetch(`http://localhost:5000/api/historical/bmc/complaints/${first.historicalData.complaint_id}`).then(r => r.json());
    assert(singleRes.success === true && singleRes.data.historicalData.complaint_id === first.historicalData.complaint_id, `Single record fetch by ID verified`);
  } catch (err) {
    assert(false, `BMC complaints check failed: ${err.message}`);
  }

  // 10. Check Map Ward Aggregates API
  try {
    const mapRes = await fetch('http://localhost:5000/api/historical/bmc/map').then(r => r.json());
    assert(mapRes.success === true && mapRes.mapData.length === 24, `GET /api/historical/bmc/map returns 24 ward aggregates for Leaflet`);
    assert(Array.isArray(mapRes.mapData[0].coords), `Ward centroid coordinates present without fabricating fake point GPS`);
  } catch (err) {
    assert(false, `BMC map check failed: ${err.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`VERIFICATION SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('='.repeat(70));

  if (passed === total) {
    console.log('🎉 ALL INTEGRATION AND REGRESSION CHECKS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} checks failed.`);
    process.exit(1);
  }
}

runVerification();
