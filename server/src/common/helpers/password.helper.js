import bcrypt from "bcrypt";

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;

export function isPasswordHashed(value) {
  return typeof value === "string" && BCRYPT_HASH_RE.test(value);
}

export async function hashPassword(plain, rounds = 10) {
  if (!plain || isPasswordHashed(plain)) {
    return plain;
  }
  return bcrypt.hash(plain, rounds);
}

export async function comparePassword(plain, hashed) {
  if (!hashed) return false;
  return bcrypt.compare(plain, hashed);
}
