import { REGEX_PATTERNS, validateField, getPasswordCriteria } from './validators.js';

console.log('=== RUNNING REGEX & VALIDATION SUITE ===\n');

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Full Name Tests
console.log('--- 1. Full Name Tests ---');
assert(validateField('fullName', 'Aarav Sharma') === null, 'Valid name: Aarav Sharma');
assert(validateField('fullName', 'Niral Hingu') === null, 'Valid name: Niral Hingu');
assert(validateField('fullName', 'Al') === null, 'Valid name min length (2 chars): Al');
assert(validateField('fullName', 'A') !== null, 'Invalid name too short: A');
assert(validateField('fullName', 'John123') !== null, 'Invalid name with numbers: John123');
assert(validateField('fullName', 'Niral@Hingu') !== null, 'Invalid name with symbols: Niral@Hingu');
assert(validateField('fullName', '') !== null, 'Invalid empty name');
assert(validateField('fullName', 'A'.repeat(51)) !== null, 'Invalid name > 50 chars');

// 2. Email Address Tests
console.log('\n--- 2. Email Address Tests ---');
assert(validateField('email', 'you@example.com') === null, 'Valid email: you@example.com');
assert(validateField('email', 'citizen.one@sahayata.gov.in') === null, 'Valid email: citizen.one@sahayata.gov.in');
assert(validateField('email', 'invalid-email') !== null, 'Invalid email: invalid-email');
assert(validateField('email', 'user@domain') !== null, 'Invalid email missing TLD: user@domain');
assert(validateField('email', '@domain.com') !== null, 'Invalid email missing user: @domain.com');
assert(validateField('email', '') !== null, 'Invalid empty email');

// 3. Phone Number Tests
console.log('\n--- 3. Phone Number Tests ---');
assert(validateField('phone', '9876543210') === null, 'Valid 10-digit phone: 9876543210');
assert(validateField('phone', '+91 9876543210') === null, 'Valid phone with +91: +91 9876543210');
assert(validateField('phone', '+91-9876543210') === null, 'Valid phone with +91-: +91-9876543210');
assert(validateField('phone', '09876543210') === null, 'Valid phone with leading 0: 09876543210');
assert(validateField('phone', '8123456789') === null, 'Valid phone starting with 8: 8123456789');
assert(validateField('phone', '7123456789') === null, 'Valid phone starting with 7: 7123456789');
assert(validateField('phone', '6123456789') === null, 'Valid phone starting with 6: 6123456789');
assert(validateField('phone', '5123456789') !== null, 'Invalid phone starting with 5');
assert(validateField('phone', '12345') !== null, 'Invalid phone too short: 12345');
assert(validateField('phone', '9876543210999') !== null, 'Invalid phone too long');

// 4. Password Tests
console.log('\n--- 4. Password Tests ---');
assert(validateField('password', 'Password@123') === null, 'Valid password: Password@123');
assert(validateField('password', 'Sahayata#2026') === null || validateField('password', 'Sahayata@2026') === null, 'Valid password: Sahayata@2026');
assert(validateField('password', 'Pass@1') !== null, 'Invalid password under 8 chars: Pass@1');
assert(validateField('password', 'password@123') !== null, 'Invalid password missing uppercase: password@123');
assert(validateField('password', 'PASSWORD@123') !== null, 'Invalid password missing lowercase: PASSWORD@123');
assert(validateField('password', 'Password@@@@') !== null, 'Invalid password missing digit: Password@@@@');
assert(validateField('password', 'Password1234') !== null, 'Invalid password missing special char: Password1234');

// 5. Confirm Password Tests
console.log('\n--- 5. Confirm Password Tests ---');
assert(validateField('confirmPassword', 'Password@123', { password: 'Password@123' }) === null, 'Matching confirm password');
assert(validateField('confirmPassword', 'Different@123', { password: 'Password@123' }) !== null, 'Mismatched confirm password');

console.log(`\n================================`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) process.exit(1);
