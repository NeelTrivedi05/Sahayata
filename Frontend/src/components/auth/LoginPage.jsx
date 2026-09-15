import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  ArrowRight,
  HelpCircle,
  X,
  UserCheck
} from 'lucide-react';
import { validateField } from '../../utils/validators';

export default function LoginPage({
  onNavigateToSignup,
  onLoginSuccess,
  onError,
  prefilledUsername = ''
}) {
  const [formData, setFormData] = useState({
    username: prefilledUsername,
    password: '',
    rememberMe: true
  });

  const [touched, setTouched] = useState({
    username: !!prefilledUsername,
    password: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Validate fields in real-time
  const errors = {
    username: validateField('username', formData.username, formData, true),
    password: validateField('password', formData.password, formData, true)
  };

  const isFormValid =
    errors.username === null &&
    errors.password === null &&
    formData.username.trim() !== '' &&
    formData.password !== '';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ username: true, password: true });
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      if (onLoginSuccess) {
        await onLoginSuccess({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe
        });
      }
    } catch (err) {
      if (onError) {
        onError(err.message || 'Invalid username or password');
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
      <div className="auth-card-container auth-card-login">
        {/* Card Header Banner */}
        <div className="auth-card-header">
          <div className="auth-card-header-text">
            <h2>Welcome Back</h2>
            <p>Sign in to your civic portal to report and track issues</p>
          </div>
          <span className="auth-card-badge">Citizen Login</span>
        </div>

        {/* Card Body */}
        <div className="auth-card-body">
          {/* Segmented Mode Switcher */}
          <div className="auth-tab-bar">
            <button type="button" className="auth-tab-btn active">
              <Lock size={15} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className="auth-tab-btn"
              onClick={onNavigateToSignup}
            >
              <UserCheck size={15} />
              <span>Create Account</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Username / Email Field */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-username">
                  Username or Email <span className="required-star">*</span>
                </label>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <User size={19} />
                </span>
                <input
                  id="login-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  placeholder="Enter your username or email"
                  className={getInputClass('username')}
                  disabled={isSubmitting}
                  autoComplete="username"
                />
                <span className="auth-input-status-icon">
                  {touched.username && !errors.username && (
                    <CheckCircle2 size={18} color="#10B981" />
                  )}
                  {touched.username && errors.username && (
                    <AlertCircle size={18} color="#EF4444" />
                  )}
                </span>
              </div>
              {touched.username && errors.username && (
                <div className="auth-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.username}</span>
                </div>
              )}
            </div>

            {/* 2. Password Field */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-password">
                  Password <span className="required-star">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(formData.username);
                    setShowForgotModal(true);
                  }}
                  className="auth-link-btn"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={19} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  className={getInputClass('password')}
                  disabled={isSubmitting}
                  autoComplete="current-password"
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
            </div>

            {/* Remember Me Checkbox */}
            <div className="auth-remember-row">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
              />
              <label htmlFor="remember-me">
                Remember me on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="auth-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login to Sahayata</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Bottom Card Footer */}
          <div className="auth-card-footer">
            <p>
              Don't have an account?
              <button type="button" onClick={onNavigateToSignup}>
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="#F59E0B" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E3A5F' }}>
                  Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetSent(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {resetSent ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '16px', borderRadius: '12px', color: '#166534', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                  <CheckCircle2 size={18} color="#16A34A" />
                  <span>Reset Instructions Sent!</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                  If <strong>{resetEmail}</strong> is registered with Sahayata, a recovery link has been dispatched to your inbox.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 14px' }}>
                  Enter your registered username or email address to receive secure instructions to recover your Sahayata account.
                </p>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter username or email"
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetSent(false);
                }}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              {!resetSent && (
                <button
                  type="button"
                  onClick={() => {
                    if (resetEmail) setResetSent(true);
                  }}
                  disabled={!resetEmail}
                  style={{
                    background: resetEmail ? '#1E3A5F' : '#E2E8F0',
                    color: resetEmail ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: resetEmail ? 'pointer' : 'not-allowed'
                  }}
                >
                  Send Reset Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="auth-page-footer">
        Govt. of Maharashtra & BMC • Official Civic Grievance Resolution Network
      </div>
    </div>
  );
}
