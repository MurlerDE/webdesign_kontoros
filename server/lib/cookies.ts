// lib/cookies.ts
import { Response } from 'express';
import { ACCESS_COOKIE, REFRESH_COOKIE, COOKIE_DOMAIN, COOKIE_SECURE, COOKIE_SAMESITE } from '../config/auth';

export function setAccessCookie(res: Response, token: string) {
    res.cookie(ACCESS_COOKIE, token, {
        httpOnly: true, secure: COOKIE_SECURE, sameSite: COOKIE_SAMESITE, domain: COOKIE_DOMAIN, path: '/', maxAge: 10*60*1000
    });
}
export function setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true, secure: COOKIE_SECURE, sameSite: COOKIE_SAMESITE, domain: COOKIE_DOMAIN, path: '/', maxAge: 30*24*60*60*1000
    });
}
export function clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE,  { domain: COOKIE_DOMAIN, path: '/' });
    res.clearCookie(REFRESH_COOKIE, { domain: COOKIE_DOMAIN, path: '/' });
}
