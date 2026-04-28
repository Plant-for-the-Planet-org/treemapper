export const migrationRequest = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Migration Request Notification</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
      line-height: 1.5;
      color: #37352F;
      background-color: #FAFAFA;
      padding: 40px 20px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 8px;
      border: 1px solid #E9E9E7;
      overflow: hidden;
    }
    
    .header {
      background: #FFFFFF;
      padding: 40px 40px 24px;
      border-bottom: 1px solid #F1F1EF;
    }
    
    .logo {
      width: 40px;
      height: 40px;
      background: #FF6B35;
      border-radius: 6px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #37352F;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 16px;
      color: #6F6E69;
      font-weight: 400;
    }
    
    .content {
      padding: 32px 40px;
    }
    
    .greeting {
      font-size: 16px;
      color: #37352F;
      margin-bottom: 32px;
    }
    
    .request-section {
      margin-bottom: 40px;
    }
    
    .request-text {
      font-size: 16px;
      line-height: 1.6;
      color: #37352F;
      margin-bottom: 24px;
    }
    
    .request-highlight {
      background: #FFF3E0;
      border: 1px solid #FFE0B2;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .alert-badge {
      display: inline-block;
      background: #FF6B35;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    
    .request-details {
      margin-bottom: 40px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: #37352F;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }
    
    .section-title svg {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      fill: #6F6E69;
    }
    
    .details-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .details-list li {
      padding: 12px 0;
      display: flex;
      border-bottom: 1px solid #F1F1EF;
      font-size: 15px;
      color: #37352F;
      line-height: 1.5;
    }
    
    .details-list li:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-weight: 500;
      min-width: 120px;
      color: #6F6E69;
    }
    
    .detail-value {
      flex: 1;
      color: #37352F;
    }
    
    .user-type-badge {
      display: inline-block;
      background: #E3F2FD;
      color: #1565C0;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .timestamp-section {
      background: #F3E5F5;
      border: 1px solid #E1BEE7;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 40px;
      display: flex;
      align-items: flex-start;
    }
    
    .timestamp-section svg {
      width: 16px;
      height: 16px;
      fill: #7B1FA2;
      margin-right: 12px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    
    .timestamp-section p {
      color: #4A148C;
      font-size: 14px;
      margin: 0;
      line-height: 1.4;
    }
    
    .action-section {
      margin-bottom: 32px;
    }
    
    .action-text {
      color: #6F6E69;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .divider {
      height: 1px;
      background: #F1F1EF;
      margin: 32px 0;
    }
    
    .footer {
      background: #FAFAFA;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #F1F1EF;
    }
    
    .footer p {
      color: #6F6E69;
      font-size: 13px;
      margin: 4px 0;
      line-height: 1.4;
    }
    
    @media (max-width: 640px) {
      body {
        padding: 20px 10px;
      }
      
      .header {
        padding: 32px 24px 20px;
      }
      
      .content {
        padding: 24px 24px;
      }
      
      .footer {
        padding: 20px 24px;
      }
      
      .request-highlight {
        padding: 16px;
      }
      
      .timestamp-section {
        padding: 12px 16px;
      }
      
      .details-list li {
        flex-direction: column;
        padding: 8px 0;
      }
      
      .detail-label {
        min-width: auto;
        margin-bottom: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">
        <svg viewBox="0 0 24 24">
          <path d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"/>
        </svg>
      </div>
      <h1>Migration Request</h1>
      <p>New data migration request received</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        <p>Hello Admin,</p>
      </div>
      
      <div class="request-section">
        <div class="request-text">
          <p>A new migration request has been submitted and requires your attention.</p>
        </div>
        
        <div class="request-highlight">
          <div class="alert-badge">NEW REQUEST</div>
          <p><strong>{{requestedBy}}</strong> has requested data migration.</p>
        </div>
      </div>
      
      <div class="request-details">
        <div class="section-title">
          <svg viewBox="0 0 24 24">
            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
          </svg>
          Request Details
        </div>
        
        <ul class="details-list">
          <li>
            <span class="detail-label">Requested by:</span>
            <span class="detail-value"><strong>{{requestedBy}}</strong></span>
          </li>
          <li>
            <span class="detail-label">Email:</span>
            <span class="detail-value">{{requesterEmail}}</span>
          </li>
          <li>
            <span class="detail-label">Member ID:</span>
            <span class="detail-value">{{memberId}}</span>
          </li>
          <li>
            <span class="detail-label">User Type:</span>
            <span class="detail-value">
              <span class="user-type-badge">{{userType}}</span>
            </span>
          </li>
        </ul>
      </div>
      
      <div class="timestamp-section">
        <svg viewBox="0 0 24 24">
          <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg>
        <p><strong>Request Time:</strong> {{requestTime}}</p>
      </div>
      
      <div class="action-section">
        <div class="action-text">
          <p>Please review this migration request and take appropriate action through your admin dashboard. You can approve or deny the request based on your organization's migration policies.</p>
        </div>
      </div>
    </div>
    <p>Token:{{token}}</p>
    <div class="footer">
      <p>TreeMapper Forest Management System</p>
      <p>This is an automated notification. Please don't reply to this email.</p>
    </div>
  </div>
</body>
</html>`;