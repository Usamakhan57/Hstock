import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export default {
  hashPassword,
  comparePassword,
};
