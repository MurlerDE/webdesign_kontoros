// lib/jwt.ts
// @ts-ignore
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { JwtAccess, JwtRefresh } from '../types/auth';

const PRIV = readFileSync(process.env.JWT_PRIVATE_KEY_PATH!, 'utf8');
const PUB  = readFileSync(process.env.JWT_PUBLIC_KEY_PATH!, 'utf8');

export function signAccess(payload: Omit<JwtAccess,'iat'|'exp'>) {
    return jwt.sign(payload, PRIV, { algorithm: 'RS256', expiresIn: '10m' });
}
export function signRefresh(payload: Omit<JwtRefresh,'iat'|'exp'>) {
    return jwt.sign(payload, PRIV, { algorithm: 'RS256', expiresIn: '30d' });
}
export function verify<T>(token: string) {
    return jwt.verify(token, PUB, { algorithms: ['RS256'] }) as T;
}
