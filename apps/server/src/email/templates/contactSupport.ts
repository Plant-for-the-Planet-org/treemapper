export const contactSupportTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Support Request</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
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
      background: #2D6A4F;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .header h1 { font-size: 24px; font-weight: 600; color: #37352F; margin-bottom: 8px; }
    .header p { font-size: 16px; color: #6F6E69; }
    .content { padding: 32px 40px; }
    .category-badge {
      display: inline-block;
      background: #E8F5E9;
      color: #2E7D32;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 24px;
      text-transform: capitalize;
    }
    .details-list { list-style: none; margin: 0; padding: 0; margin-bottom: 32px; }
    .details-list li {
      padding: 12px 0;
      display: flex;
      border-bottom: 1px solid #F1F1EF;
      font-size: 15px;
      color: #37352F;
    }
    .details-list li:last-child { border-bottom: none; }
    .detail-label { font-weight: 500; min-width: 100px; color: #6F6E69; }
    .detail-value { flex: 1; color: #37352F; }
    .message-section { margin-top: 24px; }
    .message-label { font-size: 14px; font-weight: 500; color: #6F6E69; margin-bottom: 8px; }
    .message-body {
      background: #F7F6F3;
      border: 1px solid #E9E9E7;
      border-radius: 6px;
      padding: 16px 20px;
      font-size: 15px;
      line-height: 1.7;
      color: #37352F;
      white-space: pre-wrap;
    }
    .timestamp {
      margin-top: 24px;
      font-size: 13px;
      color: #9B9A97;
    }
    .footer {
      background: #FAFAFA;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #F1F1EF;
    }
    .footer p { color: #6F6E69; font-size: 13px; margin: 4px 0; }
    @media (max-width: 640px) {
      .header, .content, .footer { padding-left: 24px; padding-right: 24px; }
      .details-list li { flex-direction: column; }
      .detail-label { min-width: auto; margin-bottom: 4px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo"></div>
      <h1>New Support Request</h1>
      <p>A user has submitted a contact support form</p>
    </div>
    <div class="content">
      <div class="category-badge">{{category}}</div>
      <ul class="details-list">
        <li>
          <span class="detail-label">Name:</span>
          <span class="detail-value"><strong>{{name}}</strong></span>
        </li>
        <li>
          <span class="detail-label">Email:</span>
          <span class="detail-value"><a href="mailto:{{senderEmail}}" style="color:#2D6A4F;">{{senderEmail}}</a></span>
        </li>
        <li>
          <span class="detail-label">Subject:</span>
          <span class="detail-value">{{subject}}</span>
        </li>
      </ul>
      <div class="message-section">
        <div class="message-label">Message</div>
        <div class="message-body">{{message}}</div>
      </div>
      <div class="timestamp">Submitted at: {{submittedAt}}</div>
    </div>
    <div class="footer">
      <p>TreeMapper Support System</p>
      <p>This is an automated notification from the TreeMapper docs contact form.</p>
    </div>
  </div>
</body>
</html>`;
