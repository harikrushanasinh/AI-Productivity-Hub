import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../src/core/crypto/encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: { get: () => 'a-sufficiently-long-test-secret-key' },
        },
      ],
    }).compile();

    service = module.get(EncryptionService);
    service.onModuleInit();
  });

  it('round-trips plaintext through encrypt/decrypt', () => {
    const plaintext = 'S0meVeryS3cretPassword!';
    const encrypted = service.encrypt(plaintext);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('produces a different IV and ciphertext for the same plaintext each time', () => {
    const a = service.encrypt('same-input');
    const b = service.encrypt('same-input');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('throws if the ciphertext has been tampered with', () => {
    const encrypted = service.encrypt('protect-me');
    const tampered = { ...encrypted, ciphertext: Buffer.from('tampered-data').toString('base64') };
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('throws if the auth tag has been tampered with', () => {
    const encrypted = service.encrypt('protect-me');
    const tampered = { ...encrypted, authTag: Buffer.from('0000000000000000').toString('base64') };
    expect(() => service.decrypt(tampered)).toThrow();
  });
});
