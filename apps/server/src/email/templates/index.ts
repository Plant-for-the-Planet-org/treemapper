export const EMAIL_TEMPLATES = {
    PROJECT_INVITE: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forest Management Project Invitation</title>
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
      background: #2F7D32;
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
    
    .invitation-section {
      margin-bottom: 40px;
    }
    
    .invitation-text {
      font-size: 16px;
      line-height: 1.6;
      color: #37352F;
      margin-bottom: 24px;
    }
    
    .project-highlight {
      background: #F8F8F7;
      border: 1px solid #E9E9E7;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 24px 0;
    }
    
    .project-name {
      color: #2F7D32;
      font-weight: 500;
    }
    
    .role-badge {
      display: inline-block;
      background: #2F7D32;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      margin-left: 8px;
    }
    
    .permissions-section {
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
    
    .permissions-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .permissions-list li {
      padding: 8px 0;
      display: flex;
      align-items: flex-start;
      font-size: 15px;
      color: #37352F;
      line-height: 1.5;
    }
    
    .permissions-list li::before {
      content: "•";
      color: #6F6E69;
      font-weight: bold;
      margin-right: 12px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    
    .expiry-section {
      background: #FDF4E6;
      border: 1px solid #F5E6C8;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 40px;
      display: flex;
      align-items: flex-start;
    }
    
    .expiry-section svg {
      width: 16px;
      height: 16px;
      fill: #B8860B;
      margin-right: 12px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    
    .expiry-section p {
      color: #8B4513;
      font-size: 14px;
      margin: 0;
      line-height: 1.4;
    }
    
    .cta-section {
      margin-bottom: 32px;
    }
    
    .cta-button {
      display: inline-block;
      background: #2F7D32;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 15px;
      transition: background-color 0.2s ease;
      border: none;
      cursor: pointer;
    }
    
    .cta-button:hover {
      background: #1B5E20;
      color: white !important;
    }
    
    .cta-button:visited {
      color: white !important;
    }
    
    .cta-button:active {
      color: white !important;
    }
    
    .decline-text {
      margin-top: 20px;
      color: #6F6E69;
      font-size: 14px;
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
      
      .project-highlight {
        padding: 12px 16px;
      }
      
      .expiry-section {
        padding: 12px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Project Invitation</h1>
      <p>You've been invited to collaborate</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        <p>Hi there,</p>
      </div>
      
      <div class="invitation-section">
        <div class="invitation-text">
          <p><strong>{{inviterName}}</strong> has invited you to join the <span class="project-name">{{projectName}}</span> project.</p>
        </div>
        
        <div class="project-highlight">
          <p>Your role: <span class="role-badge">{{role}}</span></p>
        </div>
      </div>
      
      <div class="permissions-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24">
            <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
          </svg>
          What you can do
        </div>
        
        <ul class="permissions-list">
          {{#if (eq role "Admin")}}
          <li>Manage project settings and team members</li>
          <li>Add and edit all forest data</li>
          <li>Access analytics and generate reports</li>
          <li>Export project data</li>
          {{else if (eq role "Contributor")}}
          <li>Add and edit sites, species, and tree data</li>
          <li>View project analytics</li>
          <li>Use field data collection tools</li>
          <li>Collaborate with team members</li>
          {{else}}
          <li>View all project data and insights</li>
          <li>Access reports and analytics</li>
          <li>Track project progress</li>
          {{/if}}
        </ul>
      </div>
      
      <div class="expiry-section">
        <svg viewBox="0 0 24 24">
          <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg>
        <p><strong>Invitation expires:</strong> {{expiryDate}}</p>
      </div>
      
      <div class="cta-section">
        <a href="{{inviteUrl}}" class="cta-button">Accept invitation</a>
        <div class="decline-text">
          <p>Not interested? You can safely ignore this email.</p>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>TreeMapper Forest Management</p>
      <p>This is an automated message. Please don't reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
};