import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Ensure the key is exactly 32 bytes
const SECRET_KEY = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'fallback-secret-key-that-should-be-changed').digest();

export function encryptField(text: string | undefined): string | undefined {
  if (!text) return text;
  // If it's already encrypted (starts with ENC::), don't encrypt again
  if (text.startsWith('ENC::')) return text;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: ENC::iv::authTag::encryptedData
  return `ENC::${iv.toString('hex')}::${authTag}::${encrypted}`;
}

export function decryptField(text: string | undefined): string | undefined {
  if (!text) return text;
  // If it's not encrypted, return as is (for backwards compatibility)
  if (!text.startsWith('ENC::')) return text;

  try {
    const parts = text.split('::');
    if (parts.length !== 4) return text;

    const [, ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Return original if decryption fails to avoid app crash
  }
}
