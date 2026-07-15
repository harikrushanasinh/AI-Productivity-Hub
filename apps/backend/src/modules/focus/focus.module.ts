import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FocusSession } from './entities/focus-session.entity';
import { FocusController } from './controllers/focus.controller';
import { FocusService } from './services/focus.service';
import { FocusRepository } from './repositories/focus.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FocusSession])],
  controllers: [FocusController],
  providers: [FocusService, FocusRepository],
  exports: [FocusService],
})
export class FocusModule {}
