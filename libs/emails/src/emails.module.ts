import { Module } from '@nestjs/common'
import { EmailService } from './services/email.service'

@Module({
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailsModule {}
