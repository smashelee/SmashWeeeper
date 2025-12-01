const ENCRYPTION_KEY = 0x4A7F3C2E;
const ENCRYPTION_OFFSET = 0x1B8A9D3C;

export const encryptUserId = (userId: number): string => {
  const encrypted = (userId ^ ENCRYPTION_KEY) + ENCRYPTION_OFFSET;
  const base64 = btoa(encrypted.toString());
  return base64;
};

export const decryptUserId = (encrypted: string): number | null => {
  try {
    const decoded = atob(encrypted);
    const number = parseInt(decoded, 10);
    if (isNaN(number)) {
      return null;
    }
    const decrypted = (number - ENCRYPTION_OFFSET) ^ ENCRYPTION_KEY;
    if (decrypted < 0 || !Number.isInteger(decrypted)) {
      return null;
    }
    return decrypted;
  } catch (error) {
    return null;
  }
};