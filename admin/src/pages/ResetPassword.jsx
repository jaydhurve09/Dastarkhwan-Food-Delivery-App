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
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    // Check if token exists in the URL
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
      
      // Redirect to login after 3 seconds
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
      transition: 'opacity 0.2s ease',
      '&:hover': {
        opacity: 0.8
      }
    }
  };

  if (!isValidToken) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Invalid Reset Link</h1>
          <p style={styles.error}>{error}</p>
          <a 
            href="/forgot-password" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/forgot-password');
            }}
            style={styles.backLink}
          >
            Request a new reset link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Your Password</h1>
        {message && <p style={styles.message}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
        
        {!message && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>New Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
                minLength="8"
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label htmlFor="passwordConfirm" style={styles.label}>Confirm New Password</label>
              <input
                id="passwordConfirm"
                type="password"
                placeholder="Confirm your new password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                style={styles.input}
                required
                minLength="8"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonDisabled : {}),
              }}
              onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor)}
              onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = styles.button.backgroundColor)}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
