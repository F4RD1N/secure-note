import CryptoJS from 'crypto-js';

const KEY_SIZE = 256 / 32;
const ITERATIONS = 1000;

export function encrypt(text: string, secret: string) {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  const key = CryptoJS.PBKDF2(secret, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
  });

  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });

  return {
    ciphertext: encrypted.toString(),
    iv: CryptoJS.enc.Hex.stringify(iv),
    salt: CryptoJS.enc.Hex.stringify(salt),
  };
}

interface EncryptedData {
    content: string;
    iv: string;
    salt: string | null;
}

export function decrypt(data: EncryptedData, secret: string): string {
  const { content, iv: hexIv, salt: hexSalt } = data;

  const iv = CryptoJS.enc.Hex.parse(hexIv);
  const salt = hexSalt ? CryptoJS.enc.Hex.parse(hexSalt) : undefined;
  
  const key = CryptoJS.PBKDF2(secret, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
  });

  const decrypted = CryptoJS.AES.decrypt(content, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  
  try {
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
        throw new Error('Decryption failed. Empty result.');
    }
    return decryptedText;
  } catch (e) {
    throw new Error('Decryption failed. Probably wrong password.');
  }
}
