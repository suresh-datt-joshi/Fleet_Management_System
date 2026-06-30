import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

export const verifyAccessToken = (token) => jwt.verify(token, config.jwt.secret);

export const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: config.env === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});
