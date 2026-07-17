import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96-bit IV recommended for GCM
const SALT = 'aph-vault-static-salt-v1'; // combined with a secret master key via scrypt

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

/**
 * Shared field-level encryption service (AES-256-GCM), used by the Password
 * Vault module for any value that must never be stored as plaintext.
 *
 * PRODUCTION NOTE: this derives a single symmetric key from an environment
 * variable via scrypt. For a real production deployment, replace this with a
 * managed KMS (AWS KMS / HashiCorp Vault) so the master key itself is never
 * held in application memory or process environment — documented here and in
 * docs/password-vault-module.md so it isn't mistaken for a finished design.
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  private key!: Buffer;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const masterSecret = this.config.get<string>('VAULT_ENCRYPTION_KEY');
    if (!masterSecret || masterSecret.length < 16) {
      throw new Error(
        'VAULT_ENCRYPTION_KEY must be set to a strong secret (16+ chars) before the vault module can start.',
      );
    }
    this.key = scryptSync(masterSecret, SALT, 32);
  }

  encrypt(plaintext: string): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
