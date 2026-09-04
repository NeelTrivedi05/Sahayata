import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  X,
  Check,
  UserCheck,
  LogIn,
  ArrowLeft,
  Wrench,
  Landmark
} from 'lucide-react';
import { validateField, getPasswordCriteria } from '../../utils/validators';

export default function AuthCard({
  initialMode = 'login',
  selectedRole = 'citizen', // 'citizen' | 'ward_engineer' | 'mla'
  onBackToRoleSelect,
  onLoginSuccess,
  onSignupSuccess,
  onError,
  prefilledUsername = '',
  prefilledEmail = ''
}) {
  const isCitizen = selectedRole === 'citizen';
  const [activeMode, setActiveMode] = useState(isCitizen ? initialMode : 'login');

  // Enforce login mode if Ward Engineer or MLA is selected
  useEffect(() => {
    if (!isCitizen) {
      setActiveMode('login');
    }
  }, [selectedRole, isCitizen]);

  // --- LOGIN FORM STATE (Clean, no demo preset credentials) ---
  const [loginData, setLoginData] = useState({
    username: prefilledUsername || prefilledEmail || '',
    password: '',
    rememberMe: true
  });
  const [loginTouched, setLoginTouched] = useState({
    username: !!(prefilledUsername || prefilledEmail),
    password: false
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Update prefilled username if prop updates
  useEffect(() => {
    if (prefilledUsername || prefilledEmail) {
      setLoginData(prev => ({
        ...prev,
        username: prefilledUsername || prefilledEmail || prev.username
      }));
      setLoginTouched(prev => ({ ...prev, username: true }));
    }
  }, [prefilledUsername, prefilledEmail]);

  // --- SIGNUP FORM STATE (Citizens Only) ---
  const [signupData, setSignupData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'citizen',
    password: '',
    confirmPassword: ''
  });
  const [signupTouched, setSignupTouched] = useState({
    username: false,
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // --- FORGOT PASSWORD MODAL STATE ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Validation for Login
  const loginErrors = {
    username: validateField('username', loginData.username, loginData, true),
    password: validateField('password', loginData.password, loginData, true)
  };
  const isLoginFormValid =
    loginErrors.username === null &&
    loginErrors.password === null &&
    loginData.username.trim() !== '' &&
    loginData.password !== '';

  // Validation for Signup
  const signupErrors = {
    username: validateField('username', signupData.username, signupData, false),
    fullName: validateField('fullName', signupData.fullName, signupData, false),
    email: validateField('email', signupData.email, signupData, false),
    phone: validateField('phone', signupData.phone, signupData, false),
    password: validateField('password', signupData.password, signupData, false),
    confirmPassword: validateField('confirmPassword', signupData.confirmPassword, signupData, false)
  };
  const isSignupFormValid =
    Object.values(signupErrors).every(err => err === null) &&
    signupData.username.trim() !== '' &&
    signupData.fullName.trim() !== '' &&
    signupData.email.trim() !== '' &&
    signupData.phone.trim() !== '' &&
    signupData.password !== '' &&
    signupData.confirmPassword !== '';

  const passwordCriteria = getPasswordCriteria(signupData.password);

  // Handlers for Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginTouched({ username: true, password: true });
    if (!isLoginFormValid) return;

    setIsLoggingIn(true);
    try {
      if (onLoginSuccess) {
        await onLoginSuccess({
          username: loginData.username,
          password: loginData.password,
          rememberMe: loginData.rememberMe
        });
      }
    } catch (err) {
      if (onError) onError(err.message || 'Invalid username or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handlers for Signup
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupTouched({
      username: true,
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    });
    if (!isSignupFormValid) return;

    setIsSigningUp(true);
    try {
      if (onSignupSuccess) {
        await onSignupSuccess(signupData);
      }
      setLoginData(prev => ({ ...prev, username: signupData.username, password: '' }));
      setLoginTouched({ username: true, password: false });
      setActiveMode('login');
    } catch (err) {
      if (onError) onError(err.message || 'Registration failed');
    } finally {
      setIsSigningUp(false);
    }
  };

  const getLoginInputClass = (field) => {
    const isTouched = loginTouched[field];
    const hasError = loginErrors[field];
    const hasVal = loginData[field] && loginData[field].length > 0;
    if (isTouched && !hasError && hasVal) return 'auth-input is-valid';
    if (isTouched && hasError) return 'auth-input is-invalid';
    return 'auth-input';
  };

  const getSignupInputClass = (field) => {
    const isTouched = signupTouched[field];
    const hasError = signupErrors[field];
    const hasVal = signupData[field] && signupData[field].length > 0;
    if (isTouched && !hasError && hasVal) return 'auth-input is-valid';
    if (isTouched && hasError) return 'auth-input is-invalid';
    return 'auth-input';
  };

  // Role details mapping
  const roleConfig = {
    citizen: {
      badge: 'Citizen Portal',
      headerTitle: activeMode === 'login' ? 'Citizen Sign In' : 'Create Citizen Account',
      headerSubtitle: activeMode === 'login'
        ? 'Sign in to file grievances, endorse duplicates & earn Karma'
        : 'Register to become an active community auditor in Bandra West',
      badgeColor: '#10B981',
      badgeBg: '#ECFDF5',
      icon: <User size={18} color="#1E3A5F" />
    },
    ward_engineer: {
      badge: 'Ward Department (BMC)',
      headerTitle: 'Ward Officer Sign In',
      headerSubtitle: 'Ward H/West Engineering & Operations Desk login',
      badgeColor: '#D97706',
      badgeBg: '#FFFBEB',
      icon: <Wrench size={18} color="#D97706" />
    },
    mla: {
      badge: 'MLA Oversight Desk',
      headerTitle: 'Legislative Radar Sign In',
      headerSubtitle: 'Bandra West / Mumbai Suburban constituency oversight login',
      badgeColor: '#7C3AED',
      badgeBg: '#F5F3FF',
      icon: <Landmark size={18} color="#7C3AED" />
    }
  };

  const currentConfig = roleConfig[selectedRole] || roleConfig.citizen;

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

      {/* Main Unified Card */}
      <div className="auth-card-container auth-card-unified" style={{ maxWidth: '520px' }}>
        {/* Card Header Banner */}
        <div className="auth-card-header" style={{ position: 'relative' }}>
          {onBackToRoleSelect && (
            <button
              type="button"
              onClick={onBackToRoleSelect}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Change user role"
            >
              <ArrowLeft size={13} />
              <span>Change Role</span>
            </button>
          )}

          <div className="auth-card-header-text" style={{ paddingRight: onBackToRoleSelect ? '90px' : '0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: currentConfig.badgeBg, color: currentConfig.badgeColor, padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '6px' }}>
              {currentConfig.icon}
              <span>{currentConfig.badge}</span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 4px' }}>
              {currentConfig.headerTitle}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', margin: 0 }}>
              {currentConfig.headerSubtitle}
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="auth-card-body">
          {/* Mode Switcher Tab Bar - Exclusively for Citizen role */}
          {isCitizen && (
            <div className="auth-tab-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'login'}
                className={`auth-tab-btn ${activeMode === 'login' ? 'active' : ''}`}
                onClick={() => setActiveMode('login')}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'signup'}
                className={`auth-tab-btn ${activeMode === 'signup' ? 'active' : ''}`}
                onClick={() => setActiveMode('signup')}
              >
                <UserCheck size={16} />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* ================= MODE 1: LOGIN FORM ================= */}
          {activeMode === 'login' && (
            <div className="auth-tab-pane" key="login-form">
              <form onSubmit={handleLoginSubmit} noValidate>
                {/* Username or Email Address */}
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
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      onBlur={() => setLoginTouched(prev => ({ ...prev, username: true }))}
                      placeholder="Enter your username or email"
                      className={getLoginInputClass('username')}
                      disabled={isLoggingIn}
                      autoComplete="username"
                    />
                    <span className="auth-input-status-icon">
                      {loginTouched.username && !loginErrors.username && (
                        <CheckCircle2 size={18} color="#10B981" />
                      )}
                      {loginTouched.username && loginErrors.username && (
                        <AlertCircle size={18} color="#EF4444" />
                      )}
                    </span>
                  </div>
                  {loginTouched.username && loginErrors.username && (
                    <div className="auth-error-msg">
                      <AlertCircle size={14} />
                      <span>{loginErrors.username}</span>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="auth-form-group">
                  <div className="auth-label-row">
                    <label className="auth-label" htmlFor="login-password">
                      Password <span className="required-star">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(loginData.username);
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
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      onBlur={() => setLoginTouched(prev => ({ ...prev, password: true }))}
                      placeholder="Enter your password"
                      className={getLoginInputClass('password')}
                      disabled={isLoggingIn}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="auth-input-toggle-btn"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginTouched.password && loginErrors.password && (
                    <div className="auth-error-msg">
                      <AlertCircle size={14} />
                      <span>{loginErrors.password}</span>
                    </div>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="auth-remember-row">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={loginData.rememberMe}
                    onChange={(e) => setLoginData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  />
                  <label htmlFor="remember-me">
                    Remember me on this device
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={!isLoginFormValid || isLoggingIn}
                  className="auth-submit-btn"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedRole === 'ward_engineer'
                          ? 'Sign In to Ward Desk'
                          : selectedRole === 'mla'
                          ? 'Sign In to MLA Radar'
                          : 'Sign In to Sahayata'}
                      </span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Footer */}
              {isCitizen ? (
                <div className="auth-card-footer">
                  <p>
                    Don't have an account?
                    <button type="button" onClick={() => setActiveMode('signup')}>
                      Create Account
                    </button>
                  </p>
                </div>
              ) : (
                <div className="auth-card-footer" style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748B' }}>
                  🔒 Official {selectedRole === 'mla' ? 'MLA' : 'Ward Official'} portal. Public registration is restricted.
                </div>
              )}
            </div>
          )}

          {/* ================= MODE 2: SIGNUP FORM (Citizen Only) ================= */}
          {activeMode === 'signup' && isCitizen && (
            <div className="auth-tab-pane" key="signup-form">
              <form onSubmit={handleSignupSubmit} noValidate>
                {/* 1. Username */}
                <div className="auth-form-group">
                  <div className="auth-label-row">
                    <label className="auth-label" htmlFor="signup-username">
                      Username <span className="required-star">*</span>
                    </label>
                  </div>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <User size={19} />
                    </span>
                    <input
                      id="signup-username"
                      type="text"
                      value={signupData.username}
                      onChange={(e) => setSignupData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                      onBlur={() => setSignupTouched(prev => ({ ...prev, username: true }))}
                      placeholder="e.g. rahul_mumbai"
                      className={getSignupInputClass('username')}
                      disabled={isSigningUp}
                      autoComplete="username"
                    />
                    <span className="auth-input-status-icon">
                      {signupTouched.username && !signupErrors.username && (
                        <CheckCircle2 size={18} color="#10B981" />
                      )}
                      {signupTouched.username && signupErrors.username && (
                        <AlertCircle size={18} color="#EF4444" />
                      )}
                    </span>
                  </div>
                  {signupTouched.username && signupErrors.username && (
                    <div className="auth-error-msg">
                      <AlertCircle size={14} />
                      <span>{signupErrors.username}</span>
                    </div>
                  )}
                  {!signupTouched.username && (
                    <div className="auth-help-hint">
                      3-30 characters (letters, numbers, dot, dash, underscore)
                    </div>
                  )}
                </div>

                {/* 2. Full Name */}
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
                      value={signupData.fullName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                      onBlur={() => setSignupTouched(prev => ({ ...prev, fullName: true }))}
                      placeholder="Enter your full name"
                      className={getSignupInputClass('fullName')}
                      disabled={isSigningUp}
                      autoComplete="name"
                    />
                    <span className="auth-input-status-icon">
                      {signupTouched.fullName && !signupErrors.fullName && (
                        <CheckCircle2 size={18} color="#10B981" />
                      )}
                      {signupTouched.fullName && signupErrors.fullName && (
                        <AlertCircle size={18} color="#EF4444" />
                      )}
                    </span>
                  </div>
                  {signupTouched.fullName && signupErrors.fullName && (
                    <div className="auth-error-msg">
                      <AlertCircle size={14} />
                      <span>{signupErrors.fullName}</span>
                    </div>
                  )}
                </div>

                {/* 3. Email Address */}
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
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      onBlur={() => setSignupTouched(prev => ({ ...prev, email: true }))}
                      placeholder="you@example.com"
                      className={getSignupInputClass('email')}
                      disabled={isSigningUp}
                      autoComplete="email"
                    />
                    <span className="auth-input-status-icon">
                      {signupTouched.email && !signupErrors.email && (
                        <CheckCircle2 size={18} color="#10B981" />
                      )}
                      {signupTouched.email && signupErrors.email && (
                        <AlertCircle size={18} color="#EF4444" />
                      )}
                    </span>
                  </div>
                  {signupTouched.email && signupErrors.email && (
                    <div className="auth-error-msg">
                      <AlertCircle size={14} />
                      <span>{signupErrors.email}</span>
                    </div>
                  )}
                </div>

                {/* 5. Phone Number */}
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
                      value={signupData.phone}
                      onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                      onBlur={() => setSignupTouched(prev => ({ ...prev, phone: true }))}
                      placeholder="+91 98765 43210"
                      className={getSignupInputClass('phone')}
                      disabled={isSigningUp}
                      autoComplete="tel"
                    />
                    <span className="auth-input-status-icon">
                      {signupTouched.phone && !signupErrors.phone && (
                        <CheckCircle2 size={18} color="#10B981" />
                      )}
                      {signupTouched.phone && signupErrors.phone && (
                        <AlertCircle size={18} color="#EF4444" />
                      )}
                    </span>
                  </div>
                  {signupTouched.phone && signupErrors.phone && (
                    <div className="auth-error-msg">
                      <AlertCircle size={14} />
                      <span>{signupErrors.phone}</span>
                    </div>
                  )}
                </div>

                {/* 6. Password */}
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
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      onBlur={() => setSignupTouched(prev => ({ ...prev, password: true }))}
                      placeholder="Create a strong password"
                      className={getSignupInputClass('password')}
                      disabled={isSigningUp}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="auth-input-toggle-btn"
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {signupTouched.password && signupErrors.password && (
                    <div className="auth-error-msg">
                      <AlertCircle size={14} />
                      <span>{signupErrors.password}</span>
                    </div>
                  )}

                  {/* Password Checklist */}
                  <div className="auth-password-criteria-box">
                    <div className="auth-password-criteria-title">
                      Password Security:
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

                {/* 7. Confirm Password */}
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
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      onBlur={() => setSignupTouched(prev => ({ ...prev, confirmPassword: true }))}
                      placeholder="Confirm your password"
                      className={getSignupInputClass('confirmPassword')}
                      disabled={isSigningUp}
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
                  {signupTouched.confirmPassword && signupErrors.confirmPassword && (
                    <div className="auth-error-msg">
                      <AlertCircle size={14} />
                      <span>{signupErrors.confirmPassword}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={!isSignupFormValid || isSigningUp}
                  className="auth-submit-btn"
                  style={{ marginTop: '24px' }}
                >
                  {isSigningUp ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Citizen Account</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Footer */}
              <div className="auth-card-footer">
                <p>
                  Already have an account?
                  <button type="button" onClick={() => setActiveMode('login')}>
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
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
                    <Mail size={18} />
                  </span>
                  <input
                    type="text"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
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
