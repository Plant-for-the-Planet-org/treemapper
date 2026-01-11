
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import * as path from 'path';
import * as handlebars from 'handlebars';
import axios from 'axios';
import { isEmail } from 'class-validator';
import { selectedTempalte } from './templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly apiUrl: string;
  private readonly apiToken: string;

  private readonly frontendUrl: string;
    private readonly adminEmail: string;

  private readonly emailTemplatesDir: string;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('DASHBOARD_URL') || '';
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'treemapper-support@plant-for-the-planet.org');
    this.adminEmail = this.configService.get<string>('ADIM_EMAIL', 'treemapper-support@plant-for-the-planet.org');
    this.emailTemplatesDir = path.join(process.cwd(), 'src/notification/templates');
    this.apiUrl = this.configService.get<string>('PLUNK_URL') || '';
    this.apiToken = this.configService.get<string>('PLUNK_API_TOKEN') || '';

    if (!handlebars.helpers.eq) {
      handlebars.registerHelper('eq', function (a, b) {
        return a === b;
      });
    }


    const smtpUrl = this.configService.get<string>('SMTP_URL');
    if (smtpUrl) {
      if (!smtpUrl.match(/^smtps?:\/\/.+/)) {
        this.logger.warn('Invalid SMTP_URL format, email sending may fail');
      }
      this.transporter = createTransport(smtpUrl);
    }
  }


  async sendProjectInviteEmail({
    email,
    projectName,
    inviterName,
    token,
    expiresAt,
    role,
  }: {
    email: string;
    projectName: string;
    inviterName: string;
    token: string;
    expiresAt: Date;
    role: string;
  }): Promise<boolean> {
    if (!isEmail(email)) {
      throw new BadRequestException('Invalid email address');
    }

    const inviteUrl = `${this.frontendUrl}?project-invite=${token}`;
    const expiryDate = new Date(expiresAt).toLocaleDateString();

    return this.sendTemplateEmail({
      to: email,
      subject: `TreeMapper Invitation to join ${this.sanitizeInput(projectName)}`,
      templateName: 'project-invite',
      context: {
        projectName: this.sanitizeInput(projectName),
        inviterName: this.sanitizeInput(inviterName),
        inviteUrl,
        expiryDate,
        role: this.formatRoleName(this.sanitizeInput(role)),
      },
    });
  }

  /**
   * Send notification when an invite is accepted
   */
  async sendMigrationRequestEmail({
    memberName,
    memberEmail,
    memberId,
    memberType,
    token
  }: {
    memberType: string | null;
    memberId: string;
    memberName: string;
    memberEmail: string;
    token: string
  }): Promise<boolean> {
    if (!isEmail(memberEmail)) {
      throw new BadRequestException('Invalid email address');
    }

    const adminEmail = this.configService.get<string>(
      'ADMIN_EMAIL',
      this.adminEmail
    );

    return this.sendTemplateEmail({
      to: adminEmail,
      subject: `Migration request for TreeMapper:${this.sanitizeInput(memberName)}`,
      templateName: 'migrationRequest',
      context: {
        requestedBy: this.sanitizeInput(memberName),
        requesterEmail: memberEmail,
        memberId: this.sanitizeInput(memberId),
        userType: memberType ? this.sanitizeInput(memberType) : null,
        requestTime: new Date().toISOString(),
        // Don't include token in email body for security
        token: ''
      },
    });
  }


  async sendRequestEmail({
    inviterEmail,
    inviterName,
    memberName,
    memberEmail,
    projectName,
    projectId,
  }: {
    inviterEmail: string;
    inviterName: string;
    memberName: string;
    memberEmail: string;
    projectName: string;
    projectId: string | number;
  }): Promise<boolean> {
    if (!isEmail(inviterEmail) || !isEmail(memberEmail)) {
      throw new BadRequestException('Invalid email address');
    }

    const projectUrl = `${this.frontendUrl}/projects/${projectId}`;

    return this.sendTemplateEmail({
      to: inviterEmail,
      subject: `${this.sanitizeInput(memberName)} accepted your invitation to ${this.sanitizeInput(projectName)}`,
      templateName: 'invite-accepted',
      context: {
        inviterName: this.sanitizeInput(inviterName),
        memberName: this.sanitizeInput(memberName),
        memberEmail,
        projectName: this.sanitizeInput(projectName),
        projectUrl,
      },
    });
  }


  /**
   * Send notification when an invite is declined
   */
  async sendInviteDeclinedEmail({
    inviterEmail,
    inviterName,
    memberEmail,
    projectName,
  }: {
    inviterEmail: string;
    inviterName: string;
    memberEmail: string;
    projectName: string;
  }): Promise<boolean> {
    if (!isEmail(inviterEmail) || !isEmail(memberEmail)) {
      throw new BadRequestException('Invalid email address');
    }

    return this.sendTemplateEmail({
      to: inviterEmail,
      subject: `Invitation to ${this.sanitizeInput(projectName)} was declined`,
      templateName: 'invite-declined',
      context: {
        inviterName: this.sanitizeInput(inviterName),
        memberEmail,
        projectName: this.sanitizeInput(projectName),
      },
    });
  }


  async sendNewMemberWelcomeEmail({
    email,
    name,
    projectName,
    projectId,
  }: {
    email: string;
    name: string;
    projectName: string;
    projectId: string | number;
  }): Promise<boolean> {
    if (!isEmail(email)) {
      throw new BadRequestException('Invalid email address');
    }

    const projectUrl = `${this.frontendUrl}/projects/${projectId}`;

    return this.sendTemplateEmail({
      to: email,
      subject: `Welcome to ${this.sanitizeInput(projectName)}`,
      templateName: 'welcome-member',
      context: {
        name: this.sanitizeInput(name),
        projectName: this.sanitizeInput(projectName),
        projectUrl,
      },
    });
  }


  private async sendTemplateEmail({
    to,
    subject,
    context,
    templateName = 'migrationRequest'
  }: {
    to: string;
    subject: string;
    templateName: string;
    context: Record<string, any>;
  }): Promise<boolean> {
    try {
      // Validate email address
      if (!isEmail(to)) {
        throw new BadRequestException('Invalid recipient email address');
      }

      const TEMPLATEDOC = selectedTempalte(templateName);
      // Compile template with strict mode and noEscape disabled (Handlebars escapes by default)
      const compiledTemplate = handlebars.compile(TEMPLATEDOC, {
        strict: true,
        noEscape: false, // Enable HTML escaping (default)
      });
      const html = compiledTemplate(context);

      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.configService.get<string>('EMAIL_FROM', 'treemapper-support@plant-for-the-planet.org'),
          to,
          subject,
          html,
        });
      } else {
        if (!this.apiUrl || !this.apiToken) {
          throw new Error('Email service not configured: SMTP_URL or PLUNK_URL/PLUNK_API_TOKEN required');
        }
        await axios.post(
          this.apiUrl,
          {
            to,
            subject,
            body: html,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiToken}`,
            },
          },
        );
      }
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${to}: ${errorMessage}`,
        process.env.NODE_ENV !== 'production' ? error.stack : undefined
      );
      return false;
    }
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  private sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove HTML tags and encode special characters
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      // Limit length to prevent DoS
      .substring(0, 1000);
  }


  private formatRoleName(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

}
