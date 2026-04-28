import { Module } from '@nestjs/common';
import { ContactSupportController } from './contact-support.controller';
import { ContactSupportService } from './contact-support.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [ContactSupportController],
  providers: [ContactSupportService],
})
export class ContactSupportModule {}
