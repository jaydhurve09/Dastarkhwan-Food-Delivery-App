import React, { useState } from 'react';

const ResetPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: email, 2: code verification, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    // Password reset logic would go here
    alert('Password reset successfully!');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Reset Password</h1>
          <div style={styles.stepIndicator}>
            <div style={{...styles.step, ...(step >= 1 ? styles.stepActive : {})}}>1</div>
            <div style={styles.stepLine}></div>
            <div style={{...styles.step, ...(step >= 2 ? styles.stepActive : {})}}>2</div>
            <div style={styles.stepLine}></div>
            <div style={{...styles.step, ...(step >= 3 ? styles.stepActive : {})}}>3</div>
          </div>
        </div>

        {step === 1 && (
          <div style={styles.form}>
            <h2 style={styles.stepTitle}>Enter Your Email</h2>
            <p style={styles.description}>
              We'll send you a verification code to reset your password.
            </p>
            <div style={styles.inputGroup}>
              <div style={styles.label}>Email Address</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                style={styles.input}
              />
            </div>
            <button onClick={handleEmailSubmit} style={styles.primaryButton}>
              Send Verification Code
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={styles.form}>
            <h2 style={styles.stepTitle}>Enter Verification Code</h2>
            <p style={styles.description}>
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>
            <div style={styles.inputGroup}>
              <div style={styles.label}>Verification Code</div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                style={styles.input}
                maxLength="6"
              />
            </div>
            <button onClick={handleCodeSubmit} style={styles.primaryButton}>
              Verify Code
            </button>
            <button 
              onClick={() => setStep(1)} 
              style={styles.secondaryButton}
            >
              Back to Email
            </button>
            <p style={styles.resendText}>
              Didn't receive the code? <a href="#" style={styles.link}>Resend</a>
            </p>
          </div>
        )}

        {step === 3 && (
          <div style={styles.form}>
            <h2 style={styles.stepTitle}>Create New Password</h2>
            <p style={styles.description}>
              Your new password must be at least 8 characters long.
            </p>
            <div style={styles.inputGroup}>
              <div style={styles.label}>New Password</div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <div style={styles.label}>Confirm Password</div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={styles.input}
              />
            </div>
            <button onClick={handlePasswordReset} style={styles.primaryButton}>
              Reset Password
            </button>
            <button 
              onClick={() => setStep(2)} 
              style={styles.secondaryButton}
            >
              Back to Verification
            </button>
          </div>
        )}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Remember your password? <a href="#" style={styles.link}>Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#800020', // Maroon background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  card: {
    backgroundColor: '#FDF6E3', // Off-white/cream color
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    position: 'relative'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#800020',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 20px 0'
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  step: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#E5E5E5',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600'
  },
  stepActive: {
    backgroundColor: '#800020',
    color: 'white'
  },
  stepLine: {
    width: '40px',
    height: '2px',
    backgroundColor: '#E5E5E5'
  },
  form: {
    width: '100%'
  },
  stepTitle: {
    color: '#333',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    textAlign: 'center'
  },
  description: {
    color: '#666',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '25px',
    lineHeight: '1.5'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    color: '#333',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E1E1E1',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#800020',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'background-color 0.2s ease'
  },
  secondaryButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#800020',
    border: '2px solid #800020',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'all 0.2s ease'
  },
  resendText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    margin: '16px 0 0 0'
  },
  link: {
    color: '#800020',
    textDecoration: 'none',
    fontWeight: '500'
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #E1E1E1',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '14px',
    color: '#666',
    margin: '0'
  }
};

export default ResetPasswordPage;