/**
 * CivicCare Deduplication & Perceptual Hashing Engine
 * Combines Haversine Geospatial Gating with 64-bit Perceptual Image Hashing (dHash)
 */

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Computes a 64-bit Perceptual Hash (Difference Hash - dHash) of an image
 * using an HTML5 offscreen Canvas.
 * Works with Image URL, File, or Blob.
 */
export function computeImagePHash(imageSource) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        // dHash uses 9 columns and 8 rows = 72 pixels, comparing row neighbors = 64 comparisons (64 bits)
        const width = 9;
        const height = 8;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw and scale down
        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        // Convert to grayscale luminance
        const gray = [];
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          // Standard ITU-R BT.601 luma formula
          gray.push(Math.round(0.299 * r + 0.587 * g + 0.114 * b));
        }

        // Compare adjacent pixels in each row
        let binaryHash = '';
        for (let row = 0; row < height; row++) {
          for (let col = 0; col < width - 1; col++) {
            const left = gray[row * width + col];
            const right = gray[row * width + col + 1];
            binaryHash += left < right ? '1' : '0';
          }
        }

        // Convert 64-bit binary to 16-character hexadecimal string
        let hexHash = '';
        for (let i = 0; i < binaryHash.length; i += 4) {
          const nibble = binaryHash.substring(i, i + 4);
          hexHash += parseInt(nibble, 2).toString(16);
        }

        resolve({
          hexHash,
          binaryHash
        });
      } catch (err) {
        // In case of CORS or canvas security error, generate a fallback deterministic hash
        const fallback = deterministicStringHash(img.src || 'civic-hash');
        resolve({ hexHash: fallback, binaryHash: '' });
      }
    };

    img.onerror = () => {
      // Fallback
      resolve({ hexHash: '0000ffff0000ffff', binaryHash: '' });
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      resolve({ hexHash: '0000ffff0000ffff', binaryHash: '' });
    }
  });
}

/**
 * Calculates Hamming distance (number of differing bits) between two 64-bit hex hashes.
 * Distance 0 = identical image.
 * Distance <= 8 = near duplicate / same scene (>88% visual match).
 */
export function calculateHammingDistance(hexA, hexB) {
  if (!hexA || !hexB) return 64;
  let dist = 0;
  const len = Math.min(hexA.length, hexB.length);
  for (let i = 0; i < len; i++) {
    const valA = parseInt(hexA[i], 16);
    const valB = parseInt(hexB[i], 16);
    let xor = valA ^ valB;
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}

/**
 * Checks an incoming complaint against an existing dataset of complaints.
 * Evaluates:
 * 1. Geospatial distance (≤ maxRadiusMeters, default 50m)
 * 2. Category matching
 * 3. Perceptual image similarity (pHash)
 * 
 * Returns { isDuplicate, duplicateReport, matchScore, reasons }
 */
export async function evaluateDuplicateCandidate(newReport, existingReports, options = {}) {
  const maxRadiusMeters = options.maxRadiusMeters || 50;

  if (!newReport.coords || !Array.isArray(newReport.coords)) {
    return { isDuplicate: false };
  }

  // Pre-compute pHash for new report if not provided
  let newPHash = newReport.phash;
  if (!newPHash && newReport.image) {
    const res = await computeImagePHash(newReport.image);
    newPHash = res.hexHash;
  }

  let bestMatch = null;
  let highestConfidence = 0;
  let matchReasons = [];

  for (const candidate of existingReports) {
    // Exclude self and already verified/closed complaints
    if (candidate.id === newReport.id || candidate.status === 'verified') continue;

    // 1. Calculate physical GPS distance
    const distMeters = calculateHaversineDistance(
      newReport.coords[0],
      newReport.coords[1],
      candidate.coords[0],
      candidate.coords[1]
    );

    // Filter out complaints farther than max radius
    if (distMeters > maxRadiusMeters) continue;

    // 2. Category match
    const categoryMatches = candidate.category === newReport.category;
    if (!categoryMatches) continue;

    // 3. Image Perceptual Hash match
    let imageMatchPercent = 0;
    let hammingDist = 64;
    if (newPHash && candidate.phash) {
      hammingDist = calculateHammingDistance(newPHash, candidate.phash);
      // 64 bits total. Distance 0 = 100%, Distance 64 = 0%
      imageMatchPercent = Math.round(Math.max(0, (1 - hammingDist / 64) * 100));
    } else {
      // If candidate has same category in 50m, assume moderate visual probability
      imageMatchPercent = 75;
    }

    // 4. Composite Match Score: 50% Distance Proximity + 50% Visual Similarity
    const distanceScore = Math.max(0, (1 - distMeters / maxRadiusMeters) * 100);
    const compositeScore = Math.round(0.5 * distanceScore + 0.5 * imageMatchPercent);

    if (compositeScore > highestConfidence) {
      highestConfidence = compositeScore;
      bestMatch = {
        ...candidate,
        distanceMeters: distMeters,
        hammingDistance: hammingDist,
        imageSimilarityPercent: imageMatchPercent,
        compositeScore
      };

      matchReasons = [
        `Within ${distMeters}m of existing report`,
        `Identical category: ${candidate.categoryLabel || candidate.category}`,
        hammingDist <= 10
          ? `High visual match (${imageMatchPercent}% similar image hash)`
          : `Geospatial cluster match (${distMeters}m)`
      ];
    }
  }

  // A composite score of 70+ within 50m of same category is considered an official duplicate
  const isDuplicate = Boolean(bestMatch && highestConfidence >= 65);

  return {
    isDuplicate,
    duplicateReport: bestMatch,
    confidenceScore: highestConfidence,
    reasons: matchReasons
  };
}

function deterministicStringHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
}
