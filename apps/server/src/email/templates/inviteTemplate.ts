export const inviteTemplate = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>You're invited to {{projectName}}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a { color: #15803d; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .h1 { font-size: 22px !important; line-height: 30px !important; }
      .btn a { display: block !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#f4f4f5;">
    {{#if inviterName}}{{inviterName}} invited you{{else}}You're invited{{/if}} to join {{projectName}} on TreeMapper as {{role}}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px; max-width:560px;">

          <!-- Brand -->
          <tr>
            <td class="px" style="padding:0 8px 20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="font-size:0; line-height:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr><td width="12" height="12" bgcolor="#15803d" style="width:12px; height:12px; background-color:#15803d; border-radius:3px; font-size:0; line-height:0;">&nbsp;</td></tr>
                    </table>
                  </td>
                  <td valign="middle" style="padding-left:10px; font-size:17px; line-height:22px; font-weight:700; color:#09090b; letter-spacing:-0.2px;">TreeMapper</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff; border:1px solid #e4e4e7; border-radius:12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <tr>
                  <td style="height:4px; background-color:#15803d; border-radius:12px 12px 0 0; font-size:0; line-height:0;">&nbsp;</td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="px" style="padding:36px 40px 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <p style="margin:0 0 12px; font-size:12px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#15803d;">Project invitation</p>
                    <h1 class="h1" style="margin:0 0 12px; font-size:26px; line-height:34px; font-weight:700; color:#09090b; letter-spacing:-0.4px;">Join {{projectName}}</h1>
                    <p style="margin:0; font-size:16px; line-height:26px; color:#3f3f46;">
                      {{#if inviterName}}<strong style="color:#09090b;">{{inviterName}}</strong> invited you{{else}}You have been invited{{/if}} to work together on this project in TreeMapper, the Plant-for-the-Planet app for recording tree planting and restoration.
                    </p>
                  </td>
                </tr>

                {{#if message}}
                <!-- Personal note -->
                <tr>
                  <td class="px" style="padding:24px 40px 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-left:3px solid #15803d; background-color:#f0fdf4; border-radius:0 8px 8px 0; padding:16px 20px;">
                          <p style="margin:0 0 6px; font-size:12px; font-weight:600; color:#15803d;">{{#if inviterName}}A note from {{inviterName}}{{else}}A note for you{{/if}}</p>
                          <p style="margin:0; font-size:15px; line-height:24px; color:#27272a; white-space:pre-line;">{{message}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                {{/if}}

                <!-- Details -->
                <tr>
                  <td class="px" style="padding:24px 40px 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e4e4e7; border-radius:8px;">
                      <tr>
                        <td style="padding:14px 20px; font-size:14px; color:#71717a; border-bottom:1px solid #e4e4e7;">Project</td>
                        <td align="right" style="padding:14px 20px; font-size:14px; font-weight:600; color:#09090b; border-bottom:1px solid #e4e4e7;">{{projectName}}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px; font-size:14px; color:#71717a; border-bottom:1px solid #e4e4e7;">Your role</td>
                        <td align="right" style="padding:14px 20px; border-bottom:1px solid #e4e4e7;">
                          <span style="display:inline-block; padding:3px 10px; font-size:13px; font-weight:600; color:#15803d; background-color:#dcfce7; border-radius:999px;">{{role}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px; font-size:14px; color:#71717a;">Invite valid until</td>
                        <td align="right" style="padding:14px 20px; font-size:14px; font-weight:600; color:#09090b;">{{expiryDate}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Button -->
                <tr>
                  <td class="px" style="padding:28px 40px 0;">
                    <table role="presentation" class="btn" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#15803d" style="border-radius:8px; background-color:#15803d;">
                          <a href="{{inviteUrl}}" target="_blank" style="display:inline-block; padding:14px 28px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:16px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">Accept invitation</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- What you can do -->
                <tr>
                  <td class="px" style="padding:32px 40px 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <p style="margin:0 0 12px; font-size:15px; font-weight:600; color:#09090b;">As {{role}}, you can</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:15px; line-height:22px; color:#3f3f46;">
                      {{#if (eq role "Admin")}}
                      <tr><td width="26" valign="top" style="padding:5px 0; color:#15803d; font-weight:700;">&#10003;</td><td style="padding:5px 0;">Manage project settings and team members</td></tr>
                      <tr><td width="26" valign="top" style="padding:5px 0; color:#15803d; font-weight:700;">&#10003;</td><td style="padding:5px 0;">Add, edit and review all project data</td></tr>
                      <tr><td width="26" valign="top" style="padding:5px 0; color:#15803d; font-weight:700;">&#10003;</td><td style="padding:5px 0;">See reports and export data</td></tr>
                      {{else if (eq role "Contributor")}}
                      <tr><td width="26" valign="top" style="padding:5px 0; color:#15803d; font-weight:700;">&#10003;</td><td style="padding:5px 0;">Add and edit sites, species and trees</td></tr>
                      <tr><td width="26" valign="top" style="padding:5px 0; color:#15803d; font-weight:700;">&#10003;</td><td style="padding:5px 0;">Record field work with the TreeMapper mobile app</td></tr>
                      <tr><td width="26" valign="top" style="padding:5px 0; color:#15803d; font-weight:700;">&#10003;</td><td style="padding:5px 0;">See project progress and reports</td></tr>
                      {{else}}
                      <tr><td width="26" valign="top" style="padding:5px 0; color:#15803d; font-weight:700;">&#10003;</td><td style="padding:5px 0;">View sites, trees and maps</td></tr>
                      <tr><td width="26" valign="top" style="padding:5px 0; color:#15803d; font-weight:700;">&#10003;</td><td style="padding:5px 0;">See reports and track progress</td></tr>
                      {{/if}}
                    </table>
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td class="px" style="padding:28px 40px 36px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="border-top:1px solid #e4e4e7; font-size:0; line-height:0; height:1px;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:24px 0 6px; font-size:13px; line-height:20px; color:#71717a;">Button not working? Copy this link into your browser:</p>
                    <p style="margin:0; font-size:13px; line-height:20px; word-break:break-all;"><a href="{{inviteUrl}}" target="_blank" style="color:#15803d; text-decoration:underline;">{{inviteUrl}}</a></p>
                    <p style="margin:16px 0 0; font-size:13px; line-height:20px; color:#71717a;">Not expecting this? You can ignore this email. Nothing changes unless you accept.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="px" align="center" style="padding:24px 24px 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:#a1a1aa;">
              TreeMapper is part of ForestCloud by Plant-for-the-Planet.<br>
              This email was sent automatically. Replies are not read.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
