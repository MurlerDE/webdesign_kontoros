// @ts-ignore
import dotenv from 'dotenv';
dotenv.config();

export const ACCESS_TOKEN_TTL_SEC = 60 * 10;          // 10 Min
export const REFRESH_TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 Tage
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN; // z.B. .kontoros.de
export const COOKIE_SECURE = true;                     // Prod: true
export const COOKIE_SAMESITE: 'lax' | 'strict' | 'none' = 'lax';

export const ACCESS_COOKIE = 'ko_at';
export const REFRESH_COOKIE = 'ko_rt';

export const JWT_ALG = 'RS256'; // oder EdDSA

