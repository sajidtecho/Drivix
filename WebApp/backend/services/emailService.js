import nodemailer from 'nodemailer';

/**
 * Creates the Nodemailer transporter using Gmail SMTP.
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn(
      '⚠️ WARNING: EMAIL_USER and EMAIL_APP_PASSWORD are not configured in the backend environment variables. Gmail OTP emails will fail to send.'
    );
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
};

/**
 * Sends a premium-styled verification OTP email.
 * @param {string} email - Destination email address
 * @param {string} name - User's name
 * @param {string} otp - The 6-digit OTP
 */
export const sendOtpEmail = async (email, name, otp) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email service transporter is not configured. Please define EMAIL_USER and EMAIL_APP_PASSWORD in your environment.');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Drivix Account</title>
      <style>
        body {
          background-color: #0c0e17;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 580px;
          margin: 40px auto;
          background: #121526;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #0c0e17;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
          color: #b0b3c6;
        }
        .greeting {
          font-size: 18px;
          color: #ffffff;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .otp-card {
          margin: 30px 0;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(0, 242, 254, 0.3);
          border-radius: 12px;
          text-align: center;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #00f2fe;
          margin: 0;
          text-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
        }
        .disclaimer {
          font-size: 13px;
          color: #6a6e8c;
          margin-top: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 20px;
        }
        .footer {
          background: #090a12;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #4c4f69;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DRIVIX</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name},</div>
          <p>Thank you for choosing Drivix Smart Parking. To complete your registration and secure your account, please verify your email address using the One-Time Password (OTP) below:</p>
          
          <div class="otp-card">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p>This code is valid for <strong>10 minutes</strong>. For security purposes, please do not share this OTP with anyone.</p>
          
          <div class="disclaimer">
            If you did not initiate this request, you can safely ignore this email. Someone may have entered your email address by mistake.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Drivix Mobility. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Drivix Smart Parking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔑 Drivix Email Verification Code: ${otp}`,
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
};
