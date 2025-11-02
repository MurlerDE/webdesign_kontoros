// lib/csrf.ts
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

export const CSRF_COOKIE = 'ko_csrf';

// secure-Flag: nur in Prod erzwingen (HTTPS). Lokal auf HTTP erlauben.
const isProd = process.env.NODE_ENV === 'production';

function newToken(len = 24) {
    return randomBytes(len).toString('base64url');
}

export function ensureCsrfCookie(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.[CSRF_COOKIE];
    if (!token) {
        token = newToken(24);
        res.cookie(CSRF_COOKIE, token, {
            httpOnly: false,            // muss im Browser/Client lesbar sein
            sameSite: 'lax',
            secure: isProd,             // ⚠️ nur in Prod true
            path: '/',
        });
    }
    next();
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
    const header = req.header('x-csrf');
    const cookie = req.cookies?.[CSRF_COOKIE];
    if (!cookie || !header || header !== cookie) {
        return res.status(403).json({ error: 'CSRF' });
    }
    next();
}
