"""
Email Service with Gmail SMTP / Resend
======================================
Provides email notification functionality with HTML templates.

Setup Gmail:
1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to .env:
   EMAIL_PROVIDER=gmail
   GMAIL_ADDRESS=your-email@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

Setup Resend (alternative):
1. Get API key from https://resend.com/api-keys
2. Add to .env:
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxxxx
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any
from datetime import datetime


class EmailService:
    """Email service supporting Gmail SMTP and Resend API"""
    
    def __init__(self):
        self.provider = os.getenv('EMAIL_PROVIDER', 'gmail').lower()
        self.company_name = os.getenv('COMPANY_NAME', 'ERP System')
        self.app_url = os.getenv('APP_URL', 'http://localhost:3000')
        
        # Gmail config
        self.gmail_address = os.getenv('GMAIL_ADDRESS')
        self.gmail_password = os.getenv('GMAIL_APP_PASSWORD')
        
        # Resend config
        self.resend_api_key = os.getenv('RESEND_API_KEY')
        self.resend_from = os.getenv('EMAIL_FROM', 'onboarding@resend.dev')
        
        if self.provider == 'resend' and self.resend_api_key:
            import resend
            resend.api_key = self.resend_api_key
    
    @property
    def from_email(self) -> str:
        if self.provider == 'gmail':
            return self.gmail_address or ''
        return self.resend_from
    
    def is_configured(self) -> bool:
        """Check if email service is properly configured"""
        if self.provider == 'gmail':
            return bool(self.gmail_address and self.gmail_password)
        elif self.provider == 'resend':
            return bool(self.resend_api_key)
        return False
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get current provider configuration info"""
        return {
            'provider': self.provider,
            'configured': self.is_configured(),
            'from_email': self.from_email
        }
    
    def send_email(
        self,
        to: str | List[str],
        subject: str,
        html: str,
        text: Optional[str] = None,
        reply_to: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Send an email using configured provider
        
        Args:
            to: Recipient email(s)
            subject: Email subject
            html: HTML content
            text: Plain text content (optional)
            reply_to: Reply-to email (optional)
            cc: CC recipients (optional)
            bcc: BCC recipients (optional)
            
        Returns:
            Response dict with success/error
        """
        if not self.is_configured():
            return {'error': f'Email service not configured. Set {self.provider.upper()} credentials in .env'}
        
        if self.provider == 'gmail':
            return self._send_gmail(to, subject, html, text, cc, bcc)
        elif self.provider == 'resend':
            return self._send_resend(to, subject, html, text, reply_to, cc, bcc)
        else:
            return {'error': f'Unknown email provider: {self.provider}'}
    
    def _send_gmail(
        self,
        to: str | List[str],
        subject: str,
        html: str,
        text: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Send email via Gmail SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f'{self.company_name} <{self.gmail_address}>'
            
            # Handle recipients
            recipients = [to] if isinstance(to, str) else to
            msg['To'] = ', '.join(recipients)
            
            all_recipients = list(recipients)
            
            if cc:
                msg['Cc'] = ', '.join(cc)
                all_recipients.extend(cc)
            
            if bcc:
                all_recipients.extend(bcc)
            
            # Attach text and HTML
            if text:
                msg.attach(MIMEText(text, 'plain'))
            msg.attach(MIMEText(html, 'html'))
            
            # Send via Gmail SMTP
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                server.login(self.gmail_address, self.gmail_password)
                server.sendmail(self.gmail_address, all_recipients, msg.as_string())
            
            return {'success': True, 'provider': 'gmail'}
            
        except smtplib.SMTPAuthenticationError:
            return {'error': 'Gmail authentication failed. Check your App Password.'}
        except Exception as e:
            return {'error': str(e)}
    
    def _send_resend(
        self,
        to: str | List[str],
        subject: str,
        html: str,
        text: Optional[str] = None,
        reply_to: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Send email via Resend API"""
        try:
            import resend
            
            params = {
                'from': f'{self.company_name} <{self.resend_from}>',
                'to': [to] if isinstance(to, str) else to,
                'subject': subject,
                'html': html
            }
            
            if text:
                params['text'] = text
            if reply_to:
                params['reply_to'] = reply_to
            if cc:
                params['cc'] = cc
            if bcc:
                params['bcc'] = bcc
            
            response = resend.Emails.send(params)
            return {'success': True, 'id': response.get('id'), 'provider': 'resend'}
            
        except Exception as e:
            return {'error': str(e)}
    
    # ==================== EMAIL TEMPLATES ====================
    
    def _base_template(self, content: str, title: str = '') -> str:
        """Base HTML email template"""
        return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .card {{
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 30px;
            margin: 20px 0;
        }}
        .header {{
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
            margin-bottom: 20px;
        }}
        .header h1 {{
            color: #3b82f6;
            margin: 0;
            font-size: 24px;
        }}
        .content {{
            padding: 20px 0;
        }}
        .button {{
            display: inline-block;
            background: #3b82f6;
            color: #ffffff !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
        }}
        .button:hover {{
            background: #2563eb;
        }}
        .button-success {{
            background: #10b981;
        }}
        .button-warning {{
            background: #f59e0b;
        }}
        .button-danger {{
            background: #ef4444;
        }}
        .info-box {{
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 6px 6px 0;
        }}
        .warning-box {{
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 6px 6px 0;
        }}
        .success-box {{
            background: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 6px 6px 0;
        }}
        .footer {{
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
            color: #6b7280;
            font-size: 12px;
        }}
        .data-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }}
        .data-table th, .data-table td {{
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }}
        .data-table th {{
            background: #f9fafb;
            font-weight: 600;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }}
        .badge-success {{ background: #d1fae5; color: #065f46; }}
        .badge-warning {{ background: #fef3c7; color: #92400e; }}
        .badge-danger {{ background: #fee2e2; color: #991b1b; }}
        .badge-info {{ background: #dbeafe; color: #1e40af; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <h1>{self.company_name}</h1>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p>&copy; {datetime.now().year} {self.company_name}. All rights reserved.</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
'''
    
    # ==================== NOTIFICATION METHODS ====================
    
    def send_welcome_email(self, to: str, username: str, full_name: str) -> Dict[str, Any]:
        """Send welcome email to new user"""
        content = f'''
<h2>Welcome, {full_name}! 🎉</h2>
<p>Your account has been successfully created.</p>

<div class="info-box">
    <strong>Account Details:</strong><br>
    Username: <code>{username}</code><br>
    Email: <code>{to}</code>
</div>

<p>You can now log in to access the ERP system:</p>

<p style="text-align: center;">
    <a href="{self.app_url}/login" class="button">Login to ERP</a>
</p>

<p>If you have any questions, please contact your system administrator.</p>
'''
        return self.send_email(
            to=to,
            subject=f'Welcome to {self.company_name}!',
            html=self._base_template(content, 'Welcome')
        )
    
    def send_password_reset(self, to: str, reset_token: str, full_name: str) -> Dict[str, Any]:
        """Send password reset email"""
        reset_url = f"{self.app_url}/reset-password?token={reset_token}"
        content = f'''
<h2>Password Reset Request</h2>
<p>Hi {full_name},</p>
<p>We received a request to reset your password. Click the button below to create a new password:</p>

<p style="text-align: center;">
    <a href="{reset_url}" class="button">Reset Password</a>
</p>

<div class="warning-box">
    <strong>⚠️ Important:</strong><br>
    This link will expire in 1 hour. If you didn't request this, please ignore this email.
</div>

<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #6b7280; font-size: 12px;">{reset_url}</p>
'''
        return self.send_email(
            to=to,
            subject=f'Password Reset - {self.company_name}',
            html=self._base_template(content, 'Password Reset')
        )
    
    def send_password_changed(self, to: str, full_name: str) -> Dict[str, Any]:
        """Send password changed confirmation"""
        content = f'''
<h2>Password Changed Successfully</h2>
<p>Hi {full_name},</p>

<div class="success-box">
    ✅ Your password has been successfully changed.
</div>

<p>If you did not make this change, please contact your administrator immediately.</p>

<p style="text-align: center;">
    <a href="{self.app_url}/login" class="button">Login to ERP</a>
</p>
'''
        return self.send_email(
            to=to,
            subject=f'Password Changed - {self.company_name}',
            html=self._base_template(content, 'Password Changed')
        )
    
    def send_low_stock_alert(
        self, 
        to: str | List[str], 
        items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send low stock alert email"""
        items_html = ''
        for item in items:
            items_html += f'''
<tr>
    <td>{item.get('name', 'N/A')}</td>
    <td>{item.get('sku', 'N/A')}</td>
    <td style="color: #ef4444; font-weight: bold;">{item.get('current_stock', 0)}</td>
    <td>{item.get('min_stock', 0)}</td>
</tr>
'''
        
        content = f'''
<h2>⚠️ Low Stock Alert</h2>
<p>The following items are running low on stock and need attention:</p>

<table class="data-table">
    <thead>
        <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Current Stock</th>
            <th>Min Stock</th>
        </tr>
    </thead>
    <tbody>
        {items_html}
    </tbody>
</table>

<p style="text-align: center;">
    <a href="{self.app_url}/app/warehouse" class="button button-warning">View Inventory</a>
</p>
'''
        return self.send_email(
            to=to,
            subject=f'⚠️ Low Stock Alert - {self.company_name}',
            html=self._base_template(content, 'Low Stock Alert')
        )
    
    def send_order_confirmation(
        self,
        to: str,
        order_number: str,
        customer_name: str,
        items: List[Dict[str, Any]],
        total: float
    ) -> Dict[str, Any]:
        """Send order confirmation email"""
        items_html = ''
        for item in items:
            items_html += f'''
<tr>
    <td>{item.get('name', 'N/A')}</td>
    <td style="text-align: center;">{item.get('quantity', 0)}</td>
    <td style="text-align: right;">Rp {item.get('price', 0):,.0f}</td>
    <td style="text-align: right;">Rp {item.get('subtotal', 0):,.0f}</td>
</tr>
'''
        
        content = f'''
<h2>Order Confirmation</h2>
<p>Dear {customer_name},</p>
<p>Thank you for your order! Here are the details:</p>

<div class="info-box">
    <strong>Order Number:</strong> {order_number}<br>
    <strong>Date:</strong> {datetime.now().strftime('%d %B %Y, %H:%M')}
</div>

<table class="data-table">
    <thead>
        <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Subtotal</th>
        </tr>
    </thead>
    <tbody>
        {items_html}
        <tr style="font-weight: bold; background: #f9fafb;">
            <td colspan="3" style="text-align: right;">Total:</td>
            <td style="text-align: right;">Rp {total:,.0f}</td>
        </tr>
    </tbody>
</table>

<p style="text-align: center;">
    <a href="{self.app_url}/app/sales/orders/{order_number}" class="button button-success">View Order</a>
</p>
'''
        return self.send_email(
            to=to,
            subject=f'Order Confirmation #{order_number} - {self.company_name}',
            html=self._base_template(content, 'Order Confirmation')
        )
    
    def send_production_complete(
        self,
        to: str | List[str],
        work_order: str,
        product_name: str,
        quantity: int,
        completed_by: str
    ) -> Dict[str, Any]:
        """Send production completion notification"""
        content = f'''
<h2>✅ Production Completed</h2>

<div class="success-box">
    Work Order <strong>{work_order}</strong> has been completed successfully!
</div>

<table class="data-table">
    <tr>
        <th>Product</th>
        <td>{product_name}</td>
    </tr>
    <tr>
        <th>Quantity</th>
        <td>{quantity:,} units</td>
    </tr>
    <tr>
        <th>Completed By</th>
        <td>{completed_by}</td>
    </tr>
    <tr>
        <th>Completed At</th>
        <td>{datetime.now().strftime('%d %B %Y, %H:%M')}</td>
    </tr>
</table>

<p style="text-align: center;">
    <a href="{self.app_url}/app/production/work-orders/{work_order}" class="button button-success">View Details</a>
</p>
'''
        return self.send_email(
            to=to,
            subject=f'✅ Production Complete: {work_order} - {self.company_name}',
            html=self._base_template(content, 'Production Complete')
        )
    
    def send_approval_request(
        self,
        to: str,
        approver_name: str,
        request_type: str,
        request_number: str,
        requester: str,
        description: str,
        amount: Optional[float] = None
    ) -> Dict[str, Any]:
        """Send approval request notification"""
        amount_html = f'<tr><th>Amount</th><td>Rp {amount:,.0f}</td></tr>' if amount else ''
        
        content = f'''
<h2>🔔 Approval Required</h2>
<p>Hi {approver_name},</p>
<p>A new {request_type} requires your approval:</p>

<table class="data-table">
    <tr>
        <th>Request Number</th>
        <td><strong>{request_number}</strong></td>
    </tr>
    <tr>
        <th>Type</th>
        <td><span class="badge badge-info">{request_type}</span></td>
    </tr>
    <tr>
        <th>Requested By</th>
        <td>{requester}</td>
    </tr>
    <tr>
        <th>Description</th>
        <td>{description}</td>
    </tr>
    {amount_html}
</table>

<p style="text-align: center;">
    <a href="{self.app_url}/app/approvals" class="button">Review & Approve</a>
</p>
'''
        return self.send_email(
            to=to,
            subject=f'🔔 Approval Required: {request_type} #{request_number}',
            html=self._base_template(content, 'Approval Request')
        )
    
    def send_custom_notification(
        self,
        to: str | List[str],
        subject: str,
        title: str,
        message: str,
        button_text: Optional[str] = None,
        button_url: Optional[str] = None,
        box_type: str = 'info'  # info, warning, success
    ) -> Dict[str, Any]:
        """Send custom notification email"""
        box_class = f'{box_type}-box'
        
        button_html = ''
        if button_text and button_url:
            button_html = f'''
<p style="text-align: center;">
    <a href="{button_url}" class="button">{ button_text}</a>
</p>
'''
        
        content = f'''
<h2>{title}</h2>

<div class="{box_class}">
    {message}
</div>

{button_html}
'''
        return self.send_email(
            to=to,
            subject=subject,
            html=self._base_template(content, title)
        )


# Singleton instance
_email_service: Optional[EmailService] = None

def get_email_service() -> EmailService:
    """Get or create email service instance"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
