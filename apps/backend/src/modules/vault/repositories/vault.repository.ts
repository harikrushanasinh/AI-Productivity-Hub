import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VaultItem } from '../entities/vault-item.entity';

@Injectable()
export class VaultRepository {
  constructor(
    @InjectRepository(VaultItem)
    private readonly repo: Repository<VaultItem>,
  ) {}

  findAllByOwner(ownerId: string): Promise<VaultItem[]> {
    return this.repo.find({ where: { ownerId }, order: { title: 'ASC' } });
  }

  findById(id: string, ownerId: string): Promise<VaultItem | null> {
    return this.repo.findOne({ where: { id, ownerId } });
  }

  create(data: Partial<VaultItem>): VaultItem {
    return this.repo.create(data);
  }

  save(item: VaultItem): Promise<VaultItem> {
    return this.repo.save(item);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
