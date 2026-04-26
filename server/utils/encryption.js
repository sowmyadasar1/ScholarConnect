/**
 * Encryption Utility
 * 
 * Provides AES-256-GCM encryption for sensitive data like GitHub tokens.
 * Requires ENCRYPTION_KEY (32-byte hex) in .env.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypt a string
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text in format iv:salt:tag:ciphertext
 */
function encrypt(text) {
  if (!text) return null;
  if (!ENCRYPTION_KEY) {
    console.error('ENCRYPTION_KEY is missing in environment variables!');
    return text; // Fallback to plaintext if key missing (WARNING: NOT SECURE)
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Use PBKDF2 to derive a key from the secret
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${salt.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string
 * @param {string} encryptedText - The encrypted text in format iv:salt:tag:ciphertext
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  if (!ENCRYPTION_KEY) return encryptedText;

  try {
    const [ivHex, saltHex, tagHex, encryptedHex] = encryptedText.split(':');
    if (!ivHex || !saltHex || !tagHex || !encryptedHex) {
      // Not in expected encrypted format, return as is
      return encryptedText;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const salt = Buffer.from(saltHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
