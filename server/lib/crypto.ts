// lib/crypto.ts
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

export const rand = (len=32) => crypto.randomBytes(len).toString('base64url');
export async function hashPassword(pw: string) {
    return argon2.hash(pw, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
}
export async function verifyPassword(hash: string, pw: string) {
    return argon2.verify(hash, pw);
}
export function hashToken(t: string) {
    return crypto.createHash('sha256').update(t).digest('base64url');
}
