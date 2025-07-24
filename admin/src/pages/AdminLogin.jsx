import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.login(formData.email, formData.password);
      // Redirect to dashboard on successful login
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 35%, #92400e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative'
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      zIndex: 0
    },
    pattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
      backgroundSize: '40px 40px',
      opacity: 0.1,
      zIndex: 1
    },
    loginContainer: {
      width: '100%',
      maxWidth: '400px',
      position: 'relative',
      zIndex: 10
    },
    loginCard: {
      backgroundColor: '#F5F5DC',
      border: '1px solid rgba(139, 69, 19, 0.2)',
      borderRadius: '1rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '2rem',
      backdropFilter: 'blur(16px)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    iconContainer: {
      width: '4rem',
      height: '4rem',
      backgroundColor: 'rgba(139, 69, 19, 0.1)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1rem'
    },
    shieldIcon: {
      width: '2rem',
      height: '2rem',
      color: '#8B4513'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#8B4513',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: '0.875rem',
      color: 'rgba(139, 69, 19, 0.7)'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#8B4513',
      marginBottom: '0.5rem'
    },
    inputContainer: {
      position: 'relative'
    },
    inputIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '1.25rem',
      height: '1.25rem',
      color: 'rgba(139, 69, 19, 0.6)',
      pointerEvents: 'none'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 2.5rem',
      backgroundColor: '#FFFFFF',
      border: '1px solid rgba(139, 69, 19, 0.3)',
      borderRadius: '0.5rem',
      color: '#8B4513',
      fontSize: '1rem',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    passwordInput: {
      paddingRight: '3rem'
    },
    passwordToggle: {
      position: 'absolute',
      right: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: 'rgba(139, 69, 19, 0.6)',
      cursor: 'pointer',
      padding: '0.25rem',
      borderRadius: '0.25rem',
      transition: 'opacity 0.2s ease'
    },
    eyeIcon: {
      width: '1.25rem',
      height: '1.25rem'
    },
    submitButton: {
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: '#8B4513',
      color: '#F5F5DC',
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: '500',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    demoCredentials: {
      marginTop: '1.5rem',
      padding: '0.75rem',
      backgroundColor: 'rgba(139, 69, 19, 0.05)',
      border: '1px solid rgba(139, 69, 19, 0.2)',
      borderRadius: '0.5rem',
      textAlign: 'center'
    },
    demoTitle: {
      fontSize: '0.75rem',
      color: '#8B4513',
      marginBottom: '0.25rem'
    },
    demoText: {
      fontSize: '0.75rem',
      color: 'rgba(139, 69, 19, 0.8)'
    },
    mono: {
      fontFamily: '"Courier New", monospace'
    },
    footer: {
      marginTop: '1.5rem',
      textAlign: 'center'
    },
    footerText: {
      fontSize: '0.75rem',
      color: 'rgba(139, 69, 19, 0.6)'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <div style={styles.pattern}></div>
      <div style={styles.demoCredentials}>
        Email: <span style={styles.mono}>admin@example.com</span> | Password: <span style={styles.mono}>admin123</span>
      </div>
      {/* Header */}
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.iconContainer}>
              <svg style={styles.shieldIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <h1 style={styles.title}>Admin Portal</h1>
            <p style={styles.subtitle}>Sign in to access the dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email Field */}
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>Email</label>
              <div style={styles.inputContainer}>
                <svg style={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter your email"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.inputContainer}>
                <svg style={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{...styles.input, ...styles.passwordInput}}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  {showPassword ? (
                    <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    </svg>
                  ) : (
                    <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.submitButton,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <>
                  <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="42" strokeDashoffset="16" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                  Signing In...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Secure admin access • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}