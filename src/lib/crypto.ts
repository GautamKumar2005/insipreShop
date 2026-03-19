import crypto from 'crypto';

/**
 * Basic Encryption/Decryption Utility for Social Messages
 * Uses AES-256-CBC with IV for security.
 */

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.JWT_SECRET || 'antigravity-secret-key-32-character-fallback';
// Create a fixed 32-byte key from the secret
const KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();

export function encryptMessage(text: string): string {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Prepend IV to the encrypted text so it can be used for decryption
        return iv.toString('hex') + ':' + encrypted;
    } catch (err) {
        console.error("ENCRYPTION ERROR:", err);
        return text; // Fallback to plain text if encryption fails
    }
}

export function decryptMessage(hash: string): string {
    try {
        const parts = hash.split(':');
        if (parts.length !== 2) return hash; // Not encrypted or malformed
        
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // If decryption fails, it might be an old unencrypted message
        return hash;
    }
}
