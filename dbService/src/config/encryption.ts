import crypto from 'crypto';

class EncryptionConfig {
  private static instance: EncryptionConfig;
  private readonly key: Buffer;
  private readonly algorithm = 'aes-256-cbc';
  private readonly ivLength = 16;

  private constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    // Create a 32-byte key using SHA-256
    this.key = crypto.createHash('sha256').update(encryptionKey).digest();
  }

  public static getInstance(): EncryptionConfig {
    if (!EncryptionConfig.instance) {
      EncryptionConfig.instance = new EncryptionConfig();
    }
    return EncryptionConfig.instance;
  }

  public encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  public decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}

export default EncryptionConfig; 