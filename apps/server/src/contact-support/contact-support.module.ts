import { Module } from '@nestjs/common';
import { ContactSupportController } from './contact-support.controller';
import { ContactSupportService } from './contact-support.service';
import { EmailModule } from 'src/email/email.module';
import { IpRateLimitGuard } from 'src/common/guards/ip-rate-limit.guard';

@Module({
  imports: [EmailModule],
  controllers: [ContactSupportController],
  providers: [ContactSupportService, IpRateLimitGuard],
})
export class ContactSupportModule {}
