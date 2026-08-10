import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

@Injectable()
export class ContactSupportService {
  private readonly logger = new Logger(ContactSupportService.name);

  constructor(private readonly emailService: EmailService) {}

  async handleContactForm({ name, email, subject, category, message }: ContactFormData): Promise<void> {
    if (!name || !email || !subject || !category || !message) {
      throw new BadRequestException('Missing required fields');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    const sent = await this.emailService.sendContactSupportEmail({
      name,
      senderEmail: email,
      subject,
      category,
      message,
    });

    if (!sent) {
      this.logger.error(`Failed to send contact support email from ${email}`);
    }
  }
}
