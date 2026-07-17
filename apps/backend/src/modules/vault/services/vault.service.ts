import { Injectable, NotFoundException } from '@nestjs/common';
import { EncryptionService } from '../../../core/crypto/encryption.service';
import { VaultRepository } from '../repositories/vault.repository';
import { CreateVaultItemDto } from '../dto/create-vault-item.dto';
import { UpdateVaultItemDto } from '../dto/update-vault-item.dto';
import { VaultItem } from '../entities/vault-item.entity';

/** The shape returned by list/get endpoints — NEVER includes ciphertext or plaintext secrets. */
export interface VaultItemSummary {
  id: string;
  title: string;
  username: string | null;
  url: string | null;
  category: string;
  isFavorite: boolean;
  hasNotes: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VaultService {
  constructor(
    private readonly vaultRepository: VaultRepository,
    private readonly encryption: EncryptionService,
  ) {}

  async list(ownerId: string): Promise<VaultItemSummary[]> {
    const items = await this.vaultRepository.findAllByOwner(ownerId);
    return items.map((item) => this.toSummary(item));
  }

  async findOneSummary(id: string, ownerId: string): Promise<VaultItemSummary> {
    const item = await this.getOwnedItem(id, ownerId);
    return this.toSummary(item);
  }

  async create(ownerId: string, dto: CreateVaultItemDto): Promise<VaultItemSummary> {
    const passwordEncrypted = this.encryption.encrypt(dto.password);
    const notesEncrypted = dto.notes ? this.encryption.encrypt(dto.notes) : null;

    const item = this.vaultRepository.create({
      ownerId,
      title: dto.title,
      username: dto.username ?? null,
      url: dto.url ?? null,
      category: dto.category,
      passwordCiphertext: passwordEncrypted.ciphertext,
      passwordIv: passwordEncrypted.iv,
      passwordAuthTag: passwordEncrypted.authTag,
      notesCiphertext: notesEncrypted?.ciphertext ?? null,
      notesIv: notesEncrypted?.iv ?? null,
      notesAuthTag: notesEncrypted?.authTag ?? null,
      createdBy: ownerId,
    });

    const saved = await this.vaultRepository.save(item);
    return this.toSummary(saved);
  }

  async update(id: string, ownerId: string, dto: UpdateVaultItemDto): Promise<VaultItemSummary> {
    const item = await this.getOwnedItem(id, ownerId);

    if (dto.password) {
      const encrypted = this.encryption.encrypt(dto.password);
      item.passwordCiphertext = encrypted.ciphertext;
      item.passwordIv = encrypted.iv;
      item.passwordAuthTag = encrypted.authTag;
    }
    if (dto.notes !== undefined) {
      const encrypted = dto.notes ? this.encryption.encrypt(dto.notes) : null;
      item.notesCiphertext = encrypted?.ciphertext ?? null;
      item.notesIv = encrypted?.iv ?? null;
      item.notesAuthTag = encrypted?.authTag ?? null;
    }

    item.title = dto.title ?? item.title;
    item.username = dto.username ?? item.username;
    item.url = dto.url ?? item.url;
    item.category = dto.category ?? item.category;
    item.updatedBy = ownerId;

    const saved = await this.vaultRepository.save(item);
    return this.toSummary(saved);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.getOwnedItem(id, ownerId);
    await this.vaultRepository.softDelete(id);
  }

  /**
   * The ONLY path that ever returns a decrypted secret. Called explicitly by
   * the frontend's "reveal" action — never bundled into the list/get response.
   */
  async reveal(id: string, ownerId: string): Promise<{ password: string; notes: string | null }> {
    const item = await this.getOwnedItem(id, ownerId);

    const password = this.encryption.decrypt({
      ciphertext: item.passwordCiphertext,
      iv: item.passwordIv,
      authTag: item.passwordAuthTag,
    });

    const notes =
      item.notesCiphertext && item.notesIv && item.notesAuthTag
        ? this.encryption.decrypt({
            ciphertext: item.notesCiphertext,
            iv: item.notesIv,
            authTag: item.notesAuthTag,
          })
        : null;

    return { password, notes };
  }

  private async getOwnedItem(id: string, ownerId: string): Promise<VaultItem> {
    const item = await this.vaultRepository.findById(id, ownerId);
    if (!item) {
      throw new NotFoundException('Vault item not found');
    }
    return item;
  }

  private toSummary(item: VaultItem): VaultItemSummary {
    return {
      id: item.id,
      title: item.title,
      username: item.username,
      url: item.url,
      category: item.category,
      isFavorite: item.isFavorite,
      hasNotes: Boolean(item.notesCiphertext),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
