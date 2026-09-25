import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ThemeToggle';
import {
  Wallet,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Coins,
  ArrowRight,
  Info,
  X
} from 'lucide-react';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  currency?: string;
}

interface FormTouched {
  name?: boolean;
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
  currency?: boolean;
}

export const AuthView: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('LKR');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<FormTouched>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [googleSetupModalOpen, setGoogleSetupModalOpen] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[a-zA-Z\s'-]+$/;

  const validateField = (field: string, val: string, compareVal?: string): string => {
    switch (field) {
      case 'name':
        if (!val.trim()) return 'Full name is required';
        if (val.trim().length < 2) return 'Name must be at least 2 characters';
        if (val.trim().length > 50) return 'Name cannot exceed 50 characters';
        if (!nameRegex.test(val.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      case 'email':
        if (!val.trim()) return 'Email address is required';
        if (!emailRegex.test(val.trim())) return 'Please enter a valid email address (e.g. name@domain.com)';
        return '';
      case 'password':
        if (!val) return 'Password is required';
        if (val.length < 6) return 'Password must be at least 6 characters';
        if (val.length > 100) return 'Password cannot exceed 100 characters';
        return '';
      case 'confirmPassword':
        if (mode === 'register') {
          if (!val) return 'Please confirm your password';
          if (val !== compareVal) return 'Passwords do not match';
        }
        return '';
      default:
        return '';
    }
  };

  // Run validation whenever inputs change
  useEffect(() => {
    const newErrors: FormErrors = {};

    if (mode === 'register') {
      const nameErr = validateField('name', name);
      if (nameErr) newErrors.name = nameErr;

      const confErr = validateField('confirmPassword', confirmPassword, password);
      if (confErr) newErrors.confirmPassword = confErr;
    }

    const emailErr = validateField('email', email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validateField('password', password);
    if (passErr) newErrors.password = passErr;

    setErrors(newErrors);
  }, [name, email, password, confirmPassword, mode]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: '#64748b' };
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 15;
    if (pass.length >= 12) score += 15;
    if (/[A-Z]/.test(pass)) score += 15;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 15;

    if (score < 30) return { score: Math.min(score, 25), label: 'Weak', color: '#f43f5e' };
    if (score < 60) return { score: Math.min(score, 50), label: 'Fair', color: '#f59e0b' };
    if (score < 85) return { score: Math.min(score, 75), label: 'Good', color: '#0284c7' };
    return { score: 100, label: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) {
      setServerError('Google authentication did not return credentials. Please try again.');
      return;
    }

    setServerError('');
    setIsLoading(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err: any) {
      setServerError(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let checkInterval: any;

    const initGIS = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !googleClientId) return;

      try {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: mode === 'login' ? 'signin_with' : 'signup_with',
            width: 380,
            logo_alignment: 'left'
          });
          setGisLoaded(true);
        }
      } catch (err) {
        console.warn('GIS render notice:', err);
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGIS();
    } else {
      checkInterval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(checkInterval);
          initGIS();
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, mode]);

  const handleGoogleButtonClick = () => {
    const google = (window as any).google;
    if (googleClientId && google?.accounts?.id) {
      try {
        google.accounts.id.prompt();
      } catch {
        setGoogleSetupModalOpen(true);
      }
    } else {
      setGoogleSetupModalOpen(true);
    }
  };

  const markAllTouched = () => {
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      currency: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    markAllTouched();

    const currentErrors: FormErrors = {};
    if (mode === 'register') {
      const nameErr = validateField('name', name);
      if (nameErr) currentErrors.name = nameErr;

      const confErr = validateField('confirmPassword', confirmPassword, password);
      if (confErr) currentErrors.confirmPassword = confErr;
    }

    const emailErr = validateField('email', email);
    if (emailErr) currentErrors.email = emailErr;

    const passErr = validateField('password', password);
    if (passErr) currentErrors.password = passErr;

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password, currency);
      }
    } catch (err: any) {
      setServerError(err.message || 'Authentication failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setServerError('');
    setTouched({});
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative'
    }}>
      {/* Theme Toggle in Top Right Corner */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 0 35px rgba(99, 102, 241, 0.45)',
            transform: 'rotate(-2deg)'
          }}>
            <Wallet size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Budg<span style={{ color: '#818cf8' }}>Z</span>
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Intelligent Personal Finance & Budget Tracker
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="glass-card glass-card-glow" style={{ padding: '32px 28px' }}>
          {/* Sign In / Sign Up Mode Switcher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            background: 'var(--bg-glass-strong)',
            padding: 4,
            borderRadius: 12,
            marginBottom: 24,
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              id="auth-tab-signin"
              type="button"
              onClick={() => switchMode('login')}
              style={{
                padding: '11px',
                borderRadius: 9,
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: mode === 'login' ? 'var(--primary-light)' : 'transparent',
                color: mode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: mode === 'login' ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => switchMode('register')}
              style={{
                padding: '11px',
                borderRadius: 9,
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: mode === 'register' ? 'var(--primary-light)' : 'transparent',
                color: mode === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: mode === 'register' ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Server / API Error Banner */}
          {serverError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: '0.86rem',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10
            }}>
              <AlertCircle size={18} color="#f43f5e" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, lineHeight: 1.4 }}>{serverError}</div>
              <button
                type="button"
                onClick={() => setServerError('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Google Sign-In Action */}
          <div style={{ marginBottom: 22, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* GIS Official Rendered Button Container */}
            <div
              ref={googleBtnContainerRef}
              style={{
                display: gisLoaded ? 'flex' : 'none',
                justifyContent: 'center',
                width: '100%',
                minHeight: 44
              }}
            />

            {/* Custom Google Button Fallback / Immediate UI */}
            {!gisLoaded && (
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--bg-glass-strong)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: 'var(--text-main)',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--card-shadow)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.borderColor = 'var(--border-card-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-glass-strong)';
                  e.currentTarget.style.borderColor = 'var(--border-card)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.98 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 22
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Or continue with email
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Full Name (Sign Up only) */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="input-name"
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}
                >
                  <span>Full Name</span>
                  {touched.name && !errors.name && (
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                      <CheckCircle2 size={13} /> Valid
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={18}
                    color={touched.name && errors.name ? '#f43f5e' : '#64748b'}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="input-name"
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (!touched.name) setTouched(prev => ({ ...prev, name: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                    className="glass-input"
                    style={{
                      paddingLeft: 38,
                      borderColor: touched.name ? (errors.name ? '#f43f5e' : '#10b981') : undefined
                    }}
                    autoComplete="name"
                  />
                </div>
                {touched.name && errors.name && (
                  <div style={{ color: '#fb7185', fontSize: '0.78rem', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertCircle size={14} /> {errors.name}
                  </div>
                )}
              </div>
            )}

            {/* Email Address */}
            <div>
              <label
                htmlFor="input-email"
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}
              >
                <span>Email Address</span>
                {touched.email && !errors.email && (
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                    <CheckCircle2 size={13} /> Valid
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color={touched.email && errors.email ? '#f43f5e' : '#64748b'}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  id="input-email"
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (!touched.email) setTouched(prev => ({ ...prev, email: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  className="glass-input"
                  style={{
                    paddingLeft: 38,
                    borderColor: touched.email ? (errors.email ? '#f43f5e' : '#10b981') : undefined
                  }}
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <div style={{ color: '#fb7185', fontSize: '0.78rem', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertCircle size={14} /> {errors.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="input-password"
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}
              >
                <span>Password</span>
                {mode === 'register' && password && (
                  <span style={{ color: passwordStrength.color, fontSize: '0.75rem', fontWeight: 700 }}>
                    {passwordStrength.label}
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color={touched.password && errors.password ? '#f43f5e' : '#64748b'}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (!touched.password) setTouched(prev => ({ ...prev, password: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  className="glass-input"
                  style={{
                    paddingLeft: 38,
                    paddingRight: 40,
                    borderColor: touched.password ? (errors.password ? '#f43f5e' : '#10b981') : undefined
                  }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength indicator on register */}
              {mode === 'register' && password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    width: '100%',
                    height: 4,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${passwordStrength.score}%`,
                      height: '100%',
                      background: passwordStrength.color,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.74rem', color: '#94a3b8', marginTop: 6 }}>
                    <span style={{ color: password.length >= 6 ? '#10b981' : '#64748b' }}>
                      • 6+ chars
                    </span>
                    <span style={{ color: /[0-9]/.test(password) ? '#10b981' : '#64748b' }}>
                      • Number
                    </span>
                    <span style={{ color: /[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password) ? '#10b981' : '#64748b' }}>
                      • Uppercase/Symbol
                    </span>
                  </div>
                </div>
              )}

              {touched.password && errors.password && (
                <div style={{ color: '#fb7185', fontSize: '0.78rem', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertCircle size={14} /> {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password (Sign Up only) */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="input-confirm-password"
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}
                >
                  <span>Confirm Password</span>
                  {confirmPassword && confirmPassword === password && (
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                      <CheckCircle2 size={13} /> Passwords match
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    color={touched.confirmPassword && errors.confirmPassword ? '#f43f5e' : '#64748b'}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="input-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (!touched.confirmPassword) setTouched(prev => ({ ...prev, confirmPassword: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                    className="glass-input"
                    style={{
                      paddingLeft: 38,
                      paddingRight: 40,
                      borderColor: touched.confirmPassword ? (errors.confirmPassword ? '#f43f5e' : '#10b981') : undefined
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <div style={{ color: '#fb7185', fontSize: '0.78rem', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertCircle size={14} /> {errors.confirmPassword}
                  </div>
                )}
              </div>
            )}

            {/* Currency Selector (Sign Up only) */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="select-currency"
                  style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}
                >
                  Default Currency
                </label>
                <div style={{ position: 'relative' }}>
                  <Coins
                    size={18}
                    color="#64748b"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <select
                    id="select-currency"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="glass-input"
                    style={{ paddingLeft: 38, cursor: 'pointer' }}
                  >
                    <option value="LKR">LKR (Rs) - Sri Lankan Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                    <option value="AUD">AUD ($) - Australian Dollar</option>
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px 18px',
                marginTop: 6,
                fontSize: '0.96rem',
                opacity: isLoading ? 0.75 : 1
              }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {mode === 'login' ? 'Sign In to BudgZ' : 'Create My Account'}
                  <ArrowRight size={17} />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Security & Reliability Footer Badge */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}>
          <ShieldCheck size={16} color="var(--success)" />
          <span>MongoDB Atlas Connected • JWT Verified • Multi-User Isolated</span>
        </div>
      </div>

      {/* Google Sign-In Setup Info Modal */}
      {googleSetupModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 9999
        }}>
          <div className="glass-card" style={{
            maxWidth: 480,
            width: '100%',
            padding: 24,
            border: '1px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Info size={20} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Google OAuth Configured</h3>
              </div>
              <button
                type="button"
                onClick={() => setGoogleSetupModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 16 }}>
              Google OAuth client is configured with Client ID:
              <br />
              <code style={{
                color: '#38bdf8',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: '0.78rem',
                display: 'block',
                marginTop: 6,
                wordBreak: 'break-all'
              }}>
                {googleClientId}
              </code>
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 10,
              padding: 14,
              fontSize: '0.84rem',
              color: '#94a3b8',
              lineHeight: 1.6,
              marginBottom: 20,
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 6 }}>Important Google Console Note:</strong>
              Make sure that <code style={{ color: '#e2e8f0' }}>http://localhost:5173</code> is added to <strong>Authorized JavaScript origins</strong> in your Google Cloud Console project (<span style={{ color: '#a5b4fc' }}>poised-aleph-409709</span>) for Google One-Tap and popup login to complete.
            </div>

            <button
              type="button"
              onClick={() => setGoogleSetupModalOpen(false)}
              className="btn-primary"
              style={{ width: '100%', padding: '11px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
