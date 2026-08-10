import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ContactSupportService } from './contact-support.service';
import { Public } from 'src/auth/public.decorator';
import { IpRateLimit, IpRateLimitGuard } from 'src/common/guards/ip-rate-limit.guard';

export class ContactSupportDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @IsNotEmpty() @MaxLength(200) subject: string;
  @IsString() @IsNotEmpty() @MaxLength(100) category: string;
  @IsString() @IsNotEmpty() @MaxLength(5000) message: string;
}

@Controller('contact-support')
export class ContactSupportController {
  constructor(private readonly contactSupportService: ContactSupportService) {}

  @Public()
  // Public unauthenticated form: throttle hard to stop email spam abuse.
  @UseGuards(IpRateLimitGuard)
  @IpRateLimit({ limit: 5, windowMs: 60 * 60 * 1000, name: 'contact-support' })
  @Post()
  @HttpCode(HttpStatus.OK)
  async submitContactForm(@Body() body: ContactSupportDto) {
    await this.contactSupportService.handleContactForm(body);
    return { success: true, message: 'Your request has been submitted successfully' };
  }
}
