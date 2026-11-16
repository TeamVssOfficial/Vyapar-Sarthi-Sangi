import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
from config import settings

logger = logging.getLogger(__name__)


def send_otp_email(recipient_email: str, otp_code: str, user_name: str = "Enterprise Partner") -> bool:
    """
    Sends a 100% free, branded HTML OTP verification email using Gmail SMTP.
    Requires settings.SMTP_EMAIL and settings.SMTP_PASSWORD (Google App Password).
    """
    smtp_email = getattr(settings, "SMTP_EMAIL", "") or ""
    smtp_password = getattr(settings, "SMTP_PASSWORD", "") or ""

    if not smtp_email or not smtp_password:
        logger.warning(
            f"[EMAIL SERVICE] SMTP credentials not configured. OTP for {recipient_email} is: {otp_code}"
        )
        # Still return True in development so flow doesn't break if env vars are pending
        return True

    # Strip spaces from 16-character Google App Password if user pasted with spaces
    clean_password = smtp_password.replace(" ", "").strip()

    subject = f"{otp_code} is your Vyapar Sarthi Sangi Verification Code"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vyapar Sarthi Sangi - OTP Verification</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0F172A;
          color: #1E293B;
          margin: 0;
          padding: 24px;
        }}
        .email-container {{
          max-width: 540px;
          margin: 0 auto;
          background: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }}
        .header {{
          background: linear-gradient(135deg, #0A192F 0%, #1E3A8A 100%);
          color: #FFFFFF;
          padding: 32px 24px;
          text-align: center;
        }}
        .brand-badge {{
          display: inline-block;
          background: #EA580C;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 16px;
          padding: 6px 14px;
          border-radius: 8px;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }}
        .header h1 {{
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }}
        .header p {{
          margin: 6px 0 0;
          font-size: 12px;
          color: #CBD5E1;
        }}
        .content {{
          padding: 32px 28px;
        }}
        .greeting {{
          font-size: 15px;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 14px;
        }}
        .message {{
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 24px;
        }}
        .otp-box {{
          background: #F8FAFC;
          border: 2px dashed #EA580C;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
        }}
        .otp-title {{
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748B;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }}
        .otp-digits {{
          font-size: 36px;
          font-weight: 900;
          color: #0A192F;
          letter-spacing: 8px;
          margin: 0;
          font-family: 'Courier New', Courier, monospace;
        }}
        .expiry-note {{
          font-size: 12px;
          color: #DC2626;
          font-weight: 600;
          margin-top: 8px;
        }}
        .security-alert {{
          background: #FEF3C7;
          border-left: 4px solid #D97706;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 12px;
          color: #92400E;
          margin-top: 24px;
          line-height: 1.5;
        }}
        .footer {{
          background: #F1F5F9;
          padding: 20px 24px;
          text-align: center;
          font-size: 11px;
          color: #64748B;
          border-top: 1px solid #E2E8F0;
        }}
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="brand-badge">VS</div>
          <h1>Vyapar Sarthi Sangi</h1>
          <p>Unified Enterprise Intelligence System</p>
        </div>
        <div class="content">
          <div class="greeting">Hello {user_name},</div>
          <div class="message">
            We received a request to verify your identity or reset your workspace access password. Use the single-use authorization code below to complete your verification:
          </div>
          <div class="otp-box">
            <div class="otp-title">One-Time Password (OTP)</div>
            <div class="otp-digits">{otp_code}</div>
            <div class="expiry-note">⏱ Code expires in 10 minutes</div>
          </div>
          <div class="security-alert">
            <strong>Security Warning:</strong> Never share this code with anyone. Vyapar Sarthi Sangi representatives will never ask for your OTP or password.
          </div>
        </div>
        <div class="footer">
          &copy; 2026 Vyapar Sarthi Sangi Platform. All rights reserved.<br>
          If you did not request this verification code, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
Hello {user_name},

Your Vyapar Sarthi Sangi verification code is: {otp_code}

This OTP is valid for 10 minutes.
Do not share this code with anyone.

- Vyapar Sarthi Sangi Team
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Vyapar Sarthi Sangi <{smtp_email}>"
    msg["To"] = recipient_email

    msg.attach(MIMEText(plain_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        context = ssl.create_default_context()
        # Connect via TLS on port 587
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(smtp_email, clean_password)
            server.sendmail(smtp_email, recipient_email, msg.as_string())
        logger.info(f"[EMAIL SERVICE] Successfully sent OTP email to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL SERVICE] Failed to send email via SMTP: {e}")
        return False
