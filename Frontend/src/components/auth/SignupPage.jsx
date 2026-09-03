import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  ArrowRight,
  Check,
  UserCheck
} from 'lucide-react';
import { validateField, getPasswordCriteria } from '../../utils/validators';

export default function SignupPage({ onNavigateToLogin, onSignupSuccess, onError }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute validation errors dynamically
  const errors = {
    fullName: validateField('fullName', formData.fullName, formData, false),
    email: validateField('email', formData.email, formData, false),
    phone: validateField('phone', formData.phone, formData, false),
    password: validateField('password', formData.password, formData, false),
    confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData, false)
  };

  // All fields must be non-empty and error-free to be valid
  const isFormValid =
    Object.values(errors).every(err => err === null) &&
    formData.fullName.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.phone.trim() !== '' &&
    formData.password !== '' &&
    formData.confirmPassword !== '';

  const passwordCriteria = getPasswordCriteria(formData.password);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    });

    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      if (onSignupSuccess) {
        await onSignupSuccess(formData);
      }
    } catch (err) {
      if (onError) {
        onError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClass = (field) => {
    const isTouched = touched[field];
    const hasError = errors[field];
    const hasVal = formData[field] && formData[field].length > 0;

    if (isTouched && !hasError && hasVal) {
      return 'auth-input is-valid';
    }
    if (isTouched && hasError) {
      return 'auth-input is-invalid';
    }
    return 'auth-input';
  };

  return (
    <div className="auth-main-content">
      {/* Brand Header */}
      <div className="auth-brand-header">
        <div className="auth-logo-icon">
          <Shield size={32} color="#F59E0B" />
        </div>
        <h1 className="auth-brand-title">Sahayata</h1>
        <p className="auth-brand-tagline">
          Help at Hand — <strong>Your Problem, Our Responsibility</strong>
        </p>
      </div>

      {/* Main Clean Card */}
      <div className="auth-card-container auth-card-signup">
        {/* Card Header Banner */}
        <div className="auth-card-header">
          <div className="auth-card-header-text">
            <h2>Create Citizen Account</h2>
            <p>Register to file grievances, track resolutions, and earn Civic Karma</p>
          </div>
          <span className="auth-card-badge">Citizen Portal</span>
        </div>

        {/* Card Body */}
        <div className="auth-card-body">
          {/* Segmented Mode Switcher */}
          <div className="auth-tab-bar">
            <button
              type="button"
              className="auth-tab-btn"
              onClick={onNavigateToLogin}
            >
              <Lock size={15} />
              <span>Sign In</span>
            </button>
            <button type="button" className="auth-tab-btn active">
              <UserCheck size={15} />
              <span>Create Account</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Full Name */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="signup-fullname">
                  Full Name <span className="required-star">*</span>
                </label>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <User size={19} />
                </span>
                <input
                  id="signup-fullname"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="Enter your full name"
                  className={getInputClass('fullName')}
                  disabled={isSubmitting}
                  autoComplete="name"
                />
                <span className="auth-input-status-icon">
                  {touched.fullName && !errors.fullName && (
                    <CheckCircle2 size={18} color="#10B981" />
                  )}
                  {touched.fullName && errors.fullName && (
                    <AlertCircle size={18} color="#EF4444" />
                  )}
                </span>
              </div>
              {touched.fullName && errors.fullName && (
                <div className="auth-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.fullName}</span>
                </div>
              )}
              {!touched.fullName && (
                <div className="auth-help-hint">
                  Alphabets and spaces only (2-50 characters)
                </div>
              )}
            </div>

            {/* 2. Email Address */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="signup-email">
                  Email Address <span className="required-star">*</span>
                </label>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={19} />
                </span>
                <input
                  id="signup-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  className={getInputClass('email')}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                <span className="auth-input-status-icon">
                  {touched.email && !errors.email && (
                    <CheckCircle2 size={18} color="#10B981" />
                  )}
                  {touched.email && errors.email && (
                    <AlertCircle size={18} color="#EF4444" />
                  )}
                </span>
              </div>
              {touched.email && errors.email && (
                <div className="auth-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* 3. Phone Number */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="signup-phone">
                  Phone Number <span className="required-star">*</span>
                </label>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Phone size={19} />
                </span>
                <input
                  id="signup-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  placeholder="+91 98765 43210"
                  className={getInputClass('phone')}
                  disabled={isSubmitting}
                  autoComplete="tel"
                />
                <span className="auth-input-status-icon">
                  {touched.phone && !errors.phone && (
                    <CheckCircle2 size={18} color="#10B981" />
                  )}
                  {touched.phone && errors.phone && (
                    <AlertCircle size={18} color="#EF4444" />
                  )}
                </span>
              </div>
              {touched.phone && errors.phone && (
                <div className="auth-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.phone}</span>
                </div>
              )}
              {!touched.phone && (
                <div className="auth-help-hint">
                  10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210)
                </div>
              )}
            </div>

            {/* 4. Password */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="signup-password">
                  Password <span className="required-star">*</span>
                </label>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={19} />
                </span>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Create a strong password"
                  className={getInputClass('password')}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <div className="auth-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </div>
              )}

              {/* Real-Time Password Checklist Box */}
              <div className="auth-password-criteria-box">
                <div className="auth-password-criteria-title">
                  Password Security Criteria:
                </div>
                <div className="auth-password-criteria-grid">
                  {passwordCriteria.map((item, idx) => (
                    <div
                      key={idx}
                      className={`auth-criteria-item ${item.met ? 'met' : ''}`}
                    >
                      <span className="auth-criteria-dot">
                        {item.met ? <Check size={10} strokeWidth={3} /> : '•'}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Confirm Password */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="signup-confirmpassword">
                  Confirm Password <span className="required-star">*</span>
                </label>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={19} />
                </span>
                <input
                  id="signup-confirmpassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Confirm your password"
                  className={getInputClass('confirmPassword')}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="auth-input-toggle-btn"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <div className="auth-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="auth-submit-btn"
              style={{ marginTop: '28px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Sahayata Account</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Bottom Card Footer */}
          <div className="auth-card-footer">
            <p>
              Already have an account?
              <button type="button" onClick={onNavigateToLogin}>
                Login
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-page-footer">
        Govt. of Maharashtra & BMC • Official Civic Grievance Resolution Network
      </div>
    </div>
  );
}
