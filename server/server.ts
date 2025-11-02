// src/server.ts
import 'dotenv/config';
// @ts-ignore
import express from 'express';
import helmet from 'helmet';
// @ts-ignore
import cors from 'cors';
// @ts-ignore
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

import { ensureCsrfCookie } from './lib/csrf';
import { verify as verifyJwt } from './lib/jwt';
import { ACCESS_COOKIE } from './config/auth';

// === Express App ===
const app = express();
app.set('trust proxy', 1);

// --- Security / Basics ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: process.env.APP_ORIGIN, // z.B. https://app.kontoros.app
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(ensureCsrfCookie);

// --- Rate Limit (global mild) ---
const globalLimiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use(globalLimiter);

// --- Debugging
import { sql } from './services/db';
app.get('/debug/db', async (_req, res) => {
    try {
        const [{ version }] = await sql/*sql*/`SELECT version()`;
        res.json({ ok: true, version });
    } catch (e:any) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// --- Health / Info ---
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/version', (_req, res) => res.json({ version: process.env.APP_VERSION ?? 'dev' }));

// === Auth Middleware (Access-Token aus Cookie prüfen) ===
function requireAuth(req: Request, res: Response, next: NextFunction) {
    const at = req.cookies?.[ACCESS_COOKIE];
    if (!at) return res.status(401).json({ error: 'unauthenticated' });
    try {
        const payload = verifyJwt<{ sub: string; orgId?: string }>(at);
        // hänge minimalen Kontext an
        (req as any).auth = { userId: payload.sub, orgId: payload.orgId };
        next();
    } catch {
        return res.status(401).json({ error: 'invalid_access_token' });
    }
}

// === /me (nutzt requireAuth) ===
app.get('/me', requireAuth, async (req, res) => {
    const { userId, orgId } = (req as any).auth as { userId: string; orgId?: string };
    // Hier könntest du noch isOrgActive(orgId) prüfen (services/subscription.ts)
    res.json({ userId, orgId });
});

// === Auth-Routen einhängen ===
// Wichtig: ersetze den Pfad, wenn deine Datei anders liegt
import authRouter from './routes/auth';
app.use('/', authRouter);

// --- Not Found ---
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

// --- Error Handler ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'internal_error' });
});

// === Server Start ===
const PORT = Number(process.env.PORT ?? 8080);
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`API listening on http://localhost:${PORT}`);
    });
}

export default app;
