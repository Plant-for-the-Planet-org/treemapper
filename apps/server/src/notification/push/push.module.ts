import { Module } from '@nestjs/common';
import { PushService } from './push.service';

// Standalone so any module that needs push delivery can import it without
// pulling in the whole notification module. ConfigModule is global, so
// PushService gets its credentials with no extra wiring.
@Module({
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
