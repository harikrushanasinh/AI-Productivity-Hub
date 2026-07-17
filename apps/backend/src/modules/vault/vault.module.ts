import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaultItem } from './entities/vault-item.entity';
import { VaultController } from './controllers/vault.controller';
import { VaultService } from './services/vault.service';
import { VaultRepository } from './repositories/vault.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VaultItem])],
  controllers: [VaultController],
  providers: [VaultService, VaultRepository],
  exports: [VaultService],
})
export class VaultModule {}
