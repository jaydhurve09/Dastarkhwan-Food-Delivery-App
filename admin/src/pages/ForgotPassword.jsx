import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.requestPasswordReset(email);
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
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
      transition: 'opacity 0.2s ease',
      '&:hover': {
        opacity: 0.8
      }
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
      
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.iconContainer}>
              <svg style={styles.shieldIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h1 style={styles.title}>Reset Password</h1>
            <p style={styles.subtitle}>Enter your email to receive a reset link</p>
          </div>

          {/* Messages */}
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

          {!message && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="email" style={styles.label}>Email</label>
                <div style={styles.inputContainer}>
                  <svg style={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              
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
                    Sending...
                  </>
                ) : 'Send Reset Link'}
              </button>
            </form>
          )}
          
          <a 
            href="/login" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            style={styles.backLink}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            ← Back to Login
          </a>

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
