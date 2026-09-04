/**
 * Validation patterns and helpers for the Sahayata Authentication System
 */

export const REGEX_PATTERNS = {
  // Full Name: 2-50 chars, alphabets and spaces only
  fullName: /^[A-Za-z\s]{2,50}$/,

  // Username: 3-30 chars, letters, numbers, dot, dash, underscore
  username: /^[a-zA-Z0-9._-]{3,30}$/,

  // Email Address: standard email format RFC compliant
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Phone Number: Valid Indian phone number starting with 6, 7, 8, 9 with optional +91, 91 or 0 prefix
  phone: /^(\+91[\-\s]?)?[0]?(91)?[6-9]\d{9}$/,

  // Password: min 6 chars, with at least 1 uppercase or number
  password: /^[A-Za-z\d@$!%*?&#^()_.-]{6,}$/
};

export const VALIDATION_MESSAGES = {
  fullName: "Please enter a valid name (2-50 characters, alphabets only)",
  username: "Username must be 3-30 characters (letters, numbers, dots, dashes, underscores)",
  usernameLogin: "Please enter your username or email",
  email: "Please enter a valid email address",
  phone: "Please enter a valid Indian phone number",
  passwordSignup: "Password must be at least 6 characters",
  passwordLogin: "Please enter your password",
  confirmPassword: "Passwords do not match"
};

/**
 * Validate a specific field by name and value
 * @param {string} field - 'fullName' | 'username' | 'email' | 'phone' | 'password' | 'confirmPassword'
 * @param {string} value - Current value of the field
 * @param {object} allValues - Object containing all form values (for cross-field validation e.g. confirmPassword)
 * @param {boolean} isLogin - True if validating for Login page
 * @returns {string|null} - Error message if invalid, null if valid
 */
export function validateField(field, value, allValues = {}, isLogin = false) {
  const trimmed = typeof value === 'string' ? value.trim() : '';

  if (!trimmed && trimmed === '') {
    return 'This field is required';
  }

  switch (field) {
    case 'fullName':
      return REGEX_PATTERNS.fullName.test(value)
        ? null
        : VALIDATION_MESSAGES.fullName;

    case 'username':
      if (isLogin) {
        return trimmed.length >= 3
          ? null
          : VALIDATION_MESSAGES.usernameLogin;
      }
      return REGEX_PATTERNS.username.test(trimmed)
        ? null
        : VALIDATION_MESSAGES.username;

    case 'email':
      return REGEX_PATTERNS.email.test(trimmed)
        ? null
        : VALIDATION_MESSAGES.email;

    case 'phone':
      return REGEX_PATTERNS.phone.test(trimmed)
        ? null
        : VALIDATION_MESSAGES.phone;

    case 'password':
      if (isLogin) {
        return value && value.length > 0
          ? null
          : VALIDATION_MESSAGES.passwordLogin;
      }
      return REGEX_PATTERNS.password.test(value)
        ? null
        : VALIDATION_MESSAGES.passwordSignup;

    case 'confirmPassword':
      if (!value) return 'Please confirm your password';
      return value === allValues.password
        ? null
        : VALIDATION_MESSAGES.confirmPassword;

    default:
      return null;
  }
}

/**
 * Helper to inspect detailed password criteria for real-time checklist UI
 */
export function getPasswordCriteria(password = '') {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least 1 uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'At least 1 lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'At least 1 numeric digit (0-9)', met: /\d/.test(password) },
    { label: 'At least 1 special character (@$!%*?&)', met: /[@$!%*?&]/.test(password) }
  ];
}
