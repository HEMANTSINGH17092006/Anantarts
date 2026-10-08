import nodemailer from 'nodemailer';

/**
 * Utility to send an email using SMTP transport settings from environment variables.
 * Falls back gracefully if SMTP is not configured.
 * 
 * @param {Object} options - { to, subject, html, text }
 * @returns {Promise<Object>} - { success, messageId, error }
 */
export async function sendEmail({ to, subject, html, text }) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // If SMTP_FROM is not explicitly set, use the authenticated user address to avoid Gmail/provider spoofing rejections
  const senderEmail = process.env.SMTP_FROM || user;
  const replyToEmail = process.env.SMTP_REPLY_TO || senderEmail || 'support@anantarts.in';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

  if (!host || !user || !pass) {
    const errorMsg = 'Email provider not configured. Please define SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in environment variables.';
    console.warn(`[Email Provider Error]: ${errorMsg}`);
    return { 
      success: false, 
      error: errorMsg,
      isConfigured: false
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false // Helps avoid SSL handshake failures in some environments
      }
    });

    // Premium Brand Wrapper
    const brandedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAEAEA;">
          <!-- Header -->
          <div style="background-color: #000000; padding: 30px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
              Anant Arts
            </h1>
            <p style="color: #FFFFFF; margin: 8px 0 0 0; font-size: 12px; letter-spacing: 1px;">PREMIUM DIVINE IDOLS</p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 14px;">
            ${html}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #FAFAFA; padding: 30px; text-align: center; border-top: 1px solid #EAEAEA;">
            <p style="margin: 0; color: #666666; font-size: 12px;">
              Thank you for trusting Anant Arts.<br>
              <a href="${siteUrl}" style="color: #D4AF37; text-decoration: none; font-weight: 600;">Visit our Store</a>
            </p>
            <p style="margin: 16px 0 0 0; color: #999999; font-size: 10px;">
              &copy; ${new Date().getFullYear()} Anant Arts. All rights reserved.<br>
              Bhoirwadi, Dombivli East, Maharashtra, India
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Anant Arts" <${senderEmail}>`,
      replyTo: replyToEmail,
      to,
      subject,
      text,
      html: brandedHtml,
      headers: {
        'X-Mailer': 'Anant Arts Mailer',
        'List-Unsubscribe': `<mailto:${replyToEmail}?subject=unsubscribe>`,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Success] Message sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Error] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}
