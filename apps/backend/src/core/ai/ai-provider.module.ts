import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiProviderService } from './ai-provider.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AiProviderService],
  exports: [AiProviderService],
})
export class AiProviderModule {}
