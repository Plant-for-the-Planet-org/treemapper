// src/notifications/notification.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import axios from 'axios';
import { selectedTempalte } from './templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly apiUrl: string;
  private readonly apiToken: string;

  private readonly frontendUrl: string;
  private readonly emailTemplatesDir: string;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    // Setup email configuration from environment
    this.frontendUrl = this.configService.get<string>('DASHBOARD_URL') || '';
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@treemapper.app');
    this.emailTemplatesDir = path.join(process.cwd(), 'src/notification/templates');
    this.apiUrl = this.configService.get<string>('PLUNK_URL') || '';
    this.apiToken = this.configService.get<string>('PLUNK_API_TOKEN') || '';
    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });
    // Initialize email transporter using a single SMTP_URL
    // Example SMTP_URL format: smtp://user:password@host:port
    // or with SSL: smtps://user:password@host:port
    const smtpUrl = this.configService.get<string>('SMTP_URL');
    if (smtpUrl) {
      this.transporter = createTransport(smtpUrl);
    }
  }

  /**
   * Send a project invitation email
   */
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
    const inviteUrl = `${this.frontendUrl}?project-invite=${token}`;
    const expiryDate = new Date(expiresAt).toLocaleDateString();
    return this.sendTemplateEmail({
      to: email,
      subject: `TreeMapper Invitation to join ${projectName}`,
      templateName: 'project-invite',
      context: {
        projectName,
        inviterName,
        inviteUrl,
        expiryDate,
        role: this.formatRoleName(role),
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
    return this.sendTemplateEmail({
      to: 'shyam.bhongle@plant-for-the-planet.org',
      subject: `Migration request for TreeMapper:${memberName}`,
      templateName: 'migrationRequest',
      context: {        
        requestedBy: memberName,
        requesterEmail: memberEmail,
        memberId,
        userType: memberType,
        requestTime: new Date(),
        token
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
    const projectUrl = `${this.frontendUrl}/projects/${projectId}`;

    return this.sendTemplateEmail({
      to: inviterEmail,
      subject: `${memberName} accepted your invitation to ${projectName}`,
      templateName: 'invite-accepted',
      context: {
        inviterName,
        memberName,
        memberEmail,
        projectName,
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
    return this.sendTemplateEmail({
      to: inviterEmail,
      subject: `Invitation to ${projectName} was declined`,
      templateName: 'invite-declined',
      context: {
        inviterName,
        memberEmail,
        projectName,
      },
    });
  }

  /**
   * Send a welcome email to new members
   */
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
    const projectUrl = `${this.frontendUrl}/projects/${projectId}`;

    return this.sendTemplateEmail({
      to: email,
      subject: `Welcome to ${projectName}`,
      templateName: 'welcome-member',
      context: {
        name,
        projectName,
        projectUrl,
      },
    });
  }

  /**
   * Generic method to send an email using a template
   */
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

      const TEMPLATEDOC = selectedTempalte(templateName)
      const compiledTemplate = handlebars.compile(TEMPLATEDOC);
      const html = compiledTemplate(context);

      // Send email using SMTP if transporter is configured, otherwise use API
      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.configService.get<string>('EMAIL_FROM', 'noreply@treemapper.app'),
          to,
          subject,
          html,
        });
      } else {
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
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      return false;
    }
  }

  /**
   * Format role name for better readability in emails
   */
  private formatRoleName(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

}
