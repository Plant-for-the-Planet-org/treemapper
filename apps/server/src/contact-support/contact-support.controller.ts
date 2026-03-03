import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ContactSupportService } from './contact-support.service';
import { Public } from 'src/auth/public.decorator';

export class ContactSupportDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() subject: string;
  @IsString() @IsNotEmpty() category: string;
  @IsString() @IsNotEmpty() message: string;
}

@Controller('contact-support')
export class ContactSupportController {
  constructor(private readonly contactSupportService: ContactSupportService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async submitContactForm(@Body() body: ContactSupportDto) {
    await this.contactSupportService.handleContactForm(body);
    return { success: true, message: 'Your request has been submitted successfully' };
  }
}
