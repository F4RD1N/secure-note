// Import the crypto library
import CryptoJS from 'crypto-js';

// Define constants for the encryption algorithm
const KEY_SIZE = 256 / 32; // Key size in 32-bit words
const ITERATIONS = 1000;   // Number of iterations for key derivation

// Function to encrypt a piece of text
export function encrypt(text: string, secret: string) {
  // Generate a random salt and initialization vector (IV)
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  // Derive a key from the secret and salt using PBKDF2
  const key = CryptoJS.PBKDF2(secret, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
  });

  // Encrypt the text using AES
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });

  // Return the encrypted data along with the iv and salt needed for decryption
  return {
    ciphertext: encrypted.toString(),
    iv: CryptoJS.enc.Hex.stringify(iv),
    salt: CryptoJS.enc.Hex.stringify(salt),
  };
}

// Define the structure for encrypted data
interface EncryptedData {
    content: string; // The encrypted ciphertext
    iv: string;      // The initialization vector
    salt: string | null; // The salt (can be null for non-password keys)
}

// Function to decrypt data
export function decrypt(data: EncryptedData, secret: string): string {
  const { content, iv: hexIv, salt: hexSalt } = data;

  // Parse the hex-encoded IV and salt back into WordArrays
  const iv = CryptoJS.enc.Hex.parse(hexIv);
  const salt = hexSalt ? CryptoJS.enc.Hex.parse(hexSalt) : undefined;
  
  // Re-derive the same key used for encryption
  const key = CryptoJS.PBKDF2(secret, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
  });

  // Decrypt the content using the key and IV
  const decrypted = CryptoJS.AES.decrypt(content, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  
  try {
    // Convert the decrypted data to a UTF-8 string
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    // If the result is empty, it means decryption failed (e.g., wrong password)
    if (!decryptedText) {
        throw new Error('Decryption failed. Empty result.');
    }
    return decryptedText;
  } catch (e) {
    // Catch errors and throw a more specific error message
    throw new Error('Decryption failed. Probably wrong password.');
  }
}
