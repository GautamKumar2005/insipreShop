import crypto from 'crypto';

/**
 * Strong Encryption/Decryption Utility for Social Messages
 * Uses AES-256-GCM (Authenticated Encryption) and Scrypt for key derivation with a random salt per message.
 */

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.JWT_SECRET || 'antigravity-secret-key-32-character-fallback';

export function encryptMessage(text: string): string {
    try {
        // Generate a random salt and IV for every message to ensure uniqueness and strength
        const salt = crypto.randomBytes(16);
        const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
        
        // Derive a strong 32-byte key using scrypt and the random salt
        const key = crypto.scryptSync(SECRET_KEY, salt, 32);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Get the Authentication Tag which ensures the message hasn't been tampered with
        const authTag = cipher.getAuthTag().toString('hex');
        
        // Format: salt:iv:authTag:ciphertext
        return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err) {
        console.error("Encryption failed:", err);
        return text; // Fallback to plain text if encryption fails
    }
}

export function decryptMessage(hash: string): string {
    try {
        const parts = hash.split(':');
        
        // Backwards compatibility with the old AES-256-CBC format (iv:ciphertext)
        if (parts.length === 2) {
            const OLD_ALGORITHM = 'aes-256-cbc';
            const OLD_KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];
            const decipher = crypto.createDecipheriv(OLD_ALGORITHM, OLD_KEY, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }

        // New Strong Encryption format (salt:iv:authTag:ciphertext)
        if (parts.length !== 4) return hash; // Not encrypted or malformed
        
        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');
        const encryptedText = parts[3];
        
        // Re-derive the key using the salt stored with the message
        const key = crypto.scryptSync(SECRET_KEY, salt, 32);
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // If decryption fails, it might be an old unencrypted message
        return hash;
    }
}
