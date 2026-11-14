import { scrypt, timingSafeEqual } from 'node:crypto';

export interface UserRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
}

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, salt, hash, extra] = encodedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    extra !== undefined ||
    !salt ||
    !/^[a-f\d]{32}$/i.test(salt) ||
    !hash ||
    !/^[a-f\d]{128}$/i.test(hash)
  ) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}
