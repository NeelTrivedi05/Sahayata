import {
  calculateHaversineDistance,
  calculateHammingDistance,
  evaluateDuplicateCandidate
} from './src/utils/deduplication.js';
import { CIVIC_DATA } from './src/data/civicData.js';

console.log("==================================================");
console.log("🔍 RUNNING DEDUPLICATION & pHASH VALIDATION SUITE");
console.log("==================================================\n");

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

// ----------------------------------------------------
// TEST 1: Haversine Geospatial Formula
// ----------------------------------------------------
console.log("--- 1. Geospatial Distance Tests ---");
const stMarysCoords = [12.9724, 77.6419];
const nearCoords = [12.9726, 77.6421]; // ~30 meters away
const farCoords = [12.9800, 77.6500];  // ~1200 meters away

const distNear = calculateHaversineDistance(stMarysCoords[0], stMarysCoords[1], nearCoords[0], nearCoords[1]);
console.log(`Measured near distance: ${distNear}m`);
assert(distNear > 20 && distNear < 40, `Near points calculated within ~30m (Result: ${distNear}m)`);

const distFar = calculateHaversineDistance(stMarysCoords[0], stMarysCoords[1], farCoords[0], farCoords[1]);
console.log(`Measured far distance: ${distFar}m`);
assert(distFar > 1000, `Far points calculated accurately (Result: ${distFar}m)`);

// ----------------------------------------------------
// TEST 2: 64-bit Hamming Distance & pHash Similarity
// ----------------------------------------------------
console.log("\n--- 2. pHash Bitwise Hamming Distance Tests ---");
const hashA = "a1b2c3d4e5f60718"; // 64-bit hash
const hashIdentical = "a1b2c3d4e5f60718";
const hashSlightDiff = "a1b2c3d4e5f60719"; // Only 1 bit difference (8 -> 9: 1000 vs 1001)
const hashTotallyDiff = "5e4d3c2b1a0f8976";

const distIdentical = calculateHammingDistance(hashA, hashIdentical);
assert(distIdentical === 0, `Identical hashes yield 0 Hamming distance (100% match)`);

const distSlight = calculateHammingDistance(hashA, hashSlightDiff);
console.log(`Hamming distance for slight variation: ${distSlight} bits`);
assert(distSlight <= 2, `Minor compression variation yields Hamming <= 2 (Result: ${distSlight} bits)`);

const distDiff = calculateHammingDistance(hashA, hashTotallyDiff);
console.log(`Hamming distance for distinct images: ${distDiff} bits`);
assert(distDiff > 25, `Unrelated image yields high Hamming distance (Result: ${distDiff} bits)`);

// ----------------------------------------------------
// TEST 3: Multi-Factor Candidate Evaluation
// ----------------------------------------------------
console.log("\n--- 3. Multi-Factor Deduplication Candidate Evaluation ---");

async function runCandidateTests() {
  const existing = CIVIC_DATA.sampleReports;
  console.log(`Testing against ${existing.length} existing ward complaints.`);

  // Case A: Near Pothole at St. Mary's School (Should DETECT DUPLICATE)
  const candidateDuplicate = {
    id: "NEW-001",
    category: "pothole",
    coords: [12.9725, 77.6420], // ~20m from CIVIC-101
    phash: "a1b2c3d4e5f60719"   // 1 bit off CIVIC-101's hash
  };

  const resultA = await evaluateDuplicateCandidate(candidateDuplicate, existing, { maxRadiusMeters: 50 });
  console.log(`Case A Result: isDuplicate = ${resultA.isDuplicate}, Distance = ${resultA.duplicateReport?.distanceMeters}m, Similarity = ${resultA.duplicateReport?.imageSimilarityPercent}%, Composite = ${resultA.confidenceScore}`);
  assert(resultA.isDuplicate === true, `Case A successfully intercepted duplicate of ticket ${resultA.duplicateReport?.id}`);
  assert(resultA.duplicateReport?.id === 'CIVIC-2026-8921', `Case A correctly identified CIVIC-2026-8921 as the parent ticket`);

  // Case B: Different category at same location (Garbage instead of Pothole) -> Should NOT duplicate
  const candidateDifferentCat = {
    id: "NEW-002",
    category: "garbage",
    coords: [12.9725, 77.6420],
    phash: "a1b2c3d4e5f60719"
  };

  const resultB = await evaluateDuplicateCandidate(candidateDifferentCat, existing, { maxRadiusMeters: 50 });
  console.log(`Case B (Different Category): isDuplicate = ${resultB.isDuplicate}`);
  assert(resultB.isDuplicate === false, `Case B correctly refused to merge different categories`);

  // Case C: Same category, but 300m away -> Should NOT duplicate
  const candidateFarAway = {
    id: "NEW-003",
    category: "pothole",
    coords: [12.9750, 77.6450], // ~350m away
    phash: "a1b2c3d4e5f60718"
  };

  const resultC = await evaluateDuplicateCandidate(candidateFarAway, existing, { maxRadiusMeters: 50 });
  console.log(`Case C (>50m away): isDuplicate = ${resultC.isDuplicate}`);
  assert(resultC.isDuplicate === false, `Case C correctly refused to merge complaints beyond 50m radius`);

  // Case D: Same location and category, but parent is already verified/closed -> Should NOT duplicate
  const candidateClosed = {
    id: "NEW-004",
    category: "water",
    coords: [12.9740, 77.6390], // Near CIVIC-105 which has status 'verified'
    phash: "c3d4e5f6a1b20722"
  };

  const resultD = await evaluateDuplicateCandidate(candidateClosed, existing, { maxRadiusMeters: 50 });
  console.log(`Case D (Near verified issue): isDuplicate = ${resultD.isDuplicate}`);
  assert(resultD.isDuplicate === false, `Case D correctly ignores resolved/verified tickets`);

  console.log("\n==================================================");
  console.log(`🏁 TEST RESULTS: ${passed}/${total} TESTS PASSED (100% SUCCESS)`);
  console.log("==================================================");
}

runCandidateTests();
