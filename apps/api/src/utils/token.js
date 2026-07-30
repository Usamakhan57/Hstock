import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}

export function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateOpaqueToken,
  hashToken,
};
