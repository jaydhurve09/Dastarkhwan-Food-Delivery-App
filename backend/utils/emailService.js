import nodemailer from 'nodemailer';

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send password reset email to admin
 * @param {string} email - Admin's email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Full reset URL including token
 */
export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const mailOptions = {
    from: `"Dastarkhawn Admin" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) has requested a password reset for your admin account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px;
                    font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply directly to this email.
        </p>
      </div>
    `,
    text: `Password Reset Request\n\n` +
      `You are receiving this email because you (or someone else) has requested a password reset for your admin account.\n\n` +
      `Please visit the following link to reset your password:\n${resetUrl}\n\n` +
      `If you did not request this, please ignore this email and your password will remain unchanged.`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};
