import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

logger = logging.getLogger("surveysnap.email")

PRIMARY_NOTIFICATION_EMAIL = "kunal.madhavai24@sanjivani.edu.in"

def send_contact_notification_email(contact_data: Dict[str, Any]) -> bool:
    """
    Sends an email notification when an end user submits the contact form.
    Target recipient: kunal.madhavai24@sanjivani.edu.in
    """
    recipient = PRIMARY_NOTIFICATION_EMAIL
    name = contact_data.get("name", "Unknown User")
    sender_email = contact_data.get("email", "No Email Provided")
    subject = contact_data.get("subject", "General Inquiry")
    message_text = contact_data.get("message", "")

    # SMTP Configuration from Environment Variables or defaults
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USERNAME", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")

    email_subject = f"[SurveySnap AI Inquiry] {subject} - From: {name}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #070611; color: #f8fafc; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #121026; border: 1px solid #a855f7; border-radius: 12px; padding: 30px; box-shadow: 0 10px 30px rgba(168,85,247,0.3); }}
            .header {{ font-size: 1.4rem; font-weight: 800; color: #a855f7; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 20px; }}
            .field-row {{ margin-bottom: 15px; }}
            .label {{ font-size: 0.85rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }}
            .value {{ font-size: 1.05rem; color: #ffffff; font-weight: 500; margin-top: 4px; }}
            .message-box {{ background: rgba(255,255,255,0.05); border-left: 4px solid #38bdf8; padding: 15px; border-radius: 6px; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; color: #e2e8f0; margin-top: 10px; }}
            .footer {{ margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; color: #64748b; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ✉️ New Contact Message Received
            </div>
            
            <div class="field-row">
                <div class="label">User Full Name</div>
                <div class="value">{name}</div>
            </div>

            <div class="field-row">
                <div class="label">User Email Address</div>
                <div class="value"><a href="mailto:{sender_email}" style="color: #38bdf8; text-decoration: none;">{sender_email}</a></div>
            </div>

            <div class="field-row">
                <div class="label">Inquiry Subject</div>
                <div class="value">{subject}</div>
            </div>

            <div class="field-row">
                <div class="label">User Message Content</div>
                <div class="message-box">{message_text}</div>
            </div>

            <div class="footer">
                SurveySnap AI Enterprise Platform &bull; Automated Contact Dispatcher<br>
                Notification sent directly to: <strong>{recipient}</strong>
            </div>
        </div>
    </body>
    </html>
    """

    if smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = email_subject
            msg["From"] = smtp_user
            msg["To"] = recipient
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, recipient, msg.as_string())
            
            logger.info(f"Email successfully dispatched to {recipient}")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch email via SMTP: {str(e)}")
            return False
    else:
        logger.info(f"[DEV NOTIFICATION] Contact form submission stored. Target recipient: {recipient}. Sender: {sender_email}")
        return True
