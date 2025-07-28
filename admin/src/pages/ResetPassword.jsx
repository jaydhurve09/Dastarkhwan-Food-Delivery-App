import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !passwordConfirm) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.resetPassword(token, password, passwordConfirm);
      setMessage('Password reset successful! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      minHeight: '100vh',
      width: '100%',
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
    button: {
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
    message: {
      backgroundColor: 'rgba(72, 187, 120, 0.1)',
      color: '#166534',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    error: {
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      color: '#B91C1C',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    backLink: {
      display: 'block',
      textAlign: 'center',
      marginTop: '1.5rem',
      color: '#8B4513',
      textDecoration: 'none',
      fontSize: '0.875rem',
      transition: 'opacity 0.2s ease'
    }
  };

  if (!isValidToken) {
    return (
      <div style={styles.container}>
        <div style={styles.overlay}></div>
        <div style={styles.pattern}></div>
        
        <div style={styles.loginContainer}>
          <div style={styles.loginCard}>
            <div style={styles.header}>
              <div style={styles.iconContainer}>
                <svg style={styles.shieldIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h1 style={styles.title}>Invalid Token</h1>
              <p style={styles.subtitle}>The password reset link is invalid or has expired.</p>
            </div>
            
            <div style={styles.error}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
            
            <a 
              href="/forgot-password" 
              style={styles.backLink}
            >
              ← Request a new password reset link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <div style={styles.pattern}></div>
      
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.header}>
            <div style={styles.iconContainer}>
              <svg style={styles.shieldIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h1 style={styles.title}>Reset Password</h1>
            <p style={styles.subtitle}>Enter your new password below</p>
          </div>

          {message && (
            <div style={styles.message}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {message}
            </div>
          )}
          
          {error && (
            <div style={styles.error}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>New Password</label>
              <div style={styles.inputContainer}>
                <svg style={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{...styles.input, ...styles.passwordInput}}
                  placeholder="Enter new password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l4.242 4.242M9.88 9.88l-1.5-1.5m-2.12-2.12l-1.5-1.5m12.728 5.656l-1.5-1.5M15.536 8.464l-1.5-1.5m-12.99 9.9l1.5 1.5M21 12c0 1.6-.472 3.092-1.29 4.342"></path>
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="passwordConfirm" style={styles.label}>Confirm New Password</label>
              <div style={styles.inputContainer}>
                <svg style={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="passwordConfirm"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  style={{...styles.input, ...styles.passwordInput}}
                  placeholder="Confirm new password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                >
                  <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l4.242 4.242M9.88 9.88l-1.5-1.5m-2.12-2.12l-1.5-1.5m12.728 5.656l-1.5-1.5M15.536 8.464l-1.5-1.5m-12.99 9.9l1.5 1.5M21 12c0 1.6-.472 3.092-1.29 4.342"></path>
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              style={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          
          <a 
            href="/login" 
            style={styles.backLink}
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}