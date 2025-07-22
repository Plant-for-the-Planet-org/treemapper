// src/notifications/notification.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import axios from 'axios';

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
    this.frontendUrl = this.configService.get<string>('CLIENT_URL') || '';
    // this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@yourdomain.com');
    this.emailTemplatesDir = path.join(process.cwd(), 'src/notification/templates');
    this.apiUrl = this.configService.get<string>('PLUNK_URL') || '';
    this.apiToken = this.configService.get<string>('PLUNK_API_TOKEN') || '';
    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });
    // // Initialize email transporter
    // this.transporter = createTransport({
    //   host: this.configService.get<string>('EMAIL_HOST'),
    //   port: this.configService.get<number>('EMAIL_PORT'),
    //   secure: this.configService.get<boolean>('EMAIL_SECURE', false),
    //   auth: {
    //     user: this.configService.get<string>('EMAIL_USER'),
    //     pass: this.configService.get<string>('EMAIL_PASSWORD'),
    //   },
    // });
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
  async sendInviteAcceptedEmail({
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
    templateName,
    context,
  }: {
    to: string;
    subject: string;
    templateName: string;
    context: Record<string, any>;
  }): Promise<boolean> {
    try {
      // Load template
      const templatePath = path.join(this.emailTemplatesDir, `${templateName}.hbs`);
      const template = fs.readFileSync(templatePath, 'utf8');

      // Compile template with Handlebars
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(context);

      // // Send email
      // await this.transporter.sendMail({
      //   from: this.fromEmail,
      //   to,
      //   subject,
      //   html,
      // });
      const response = await axios.post(
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