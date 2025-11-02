// routes/auth.ts
// @ts-ignore
import express from 'express';
import rateLimit from 'express-rate-limit';
import * as crypto from 'crypto';

import { requireCsrf } from '../lib/csrf';
import { sql } from '../services/db';

// JWT + Token-Services
import { verify } from '../lib/jwt';
import { JwtRefresh } from '../types/auth';
import { issueTokenPair, rotateRefresh, revokeFamily } from '../services/tokens';

// Crypto-Helpers (PW + Tokenhash + Random)
import { hashPassword, verifyPassword, hashToken, rand } from '../lib/crypto';

// Cookies setzen/löschen
import { setAccessCookie, setRefreshCookie, clearAuthCookies } from '../lib/cookies';

// OAuth-Helpers
import { exchangeCodeForTokens, verifyIdToken, fetchFacebookUser } from '../lib/oauth';

// Subscription
import { createTrialForOrg } from '../services/subscription';

// CSRF
import { CSRF_COOKIE } from '../lib/csrf';

const router = express.Router();
const limiter = rateLimit({ windowMs: 60_000, max: 10 });

function slugBase(s: string) {
    return s.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
}

async function ensureUniqueOrgSlug(base: string, exec: typeof sql) {
    let s = base, i = 1;
    while (true) {
        const found = await exec.maybeOne/*sql*/`SELECT 1 FROM orgs WHERE slug=${s}`;
        if (!found) return s;
        i++;
        s = `${base}-${i}`.slice(0, 50);
    }
}


router.get('/auth/csrf', (req, res) => {
    // ensureCsrfCookie hat das Cookie bereits gesetzt
    const token = req.cookies?.[CSRF_COOKIE] ?? '';
    res.json({ csrf: token });
});

router.post('/auth/signup', limiter, requireCsrf, async (req, res) => {
    const { email, password, orgName } = req.body as { email: string; password: string; orgName?: string; };
    const e = email.trim().toLowerCase();
    const pwHash = await hashPassword(password);

    let newUserId!: string;
    let newOrgId!: string;

    try {
        await sql.begin(async (trx) => {
            const [u] = await trx/*sql*/`
        INSERT INTO users (email, password_hash) VALUES (${e}, ${pwHash}) RETURNING id`;
            newUserId = u.id;

            const base = slugBase(orgName ?? e.split('@')[0]);

            // TODO trx debuggen, Skript funtktioniert nur mit ts-ignore
            // @ts-ignore
            const slug  = await ensureUniqueOrgSlug(base, trx);

            const [o] = await trx/*sql*/`
                INSERT INTO orgs (name, slug, owner_user_id) VALUES (${orgName ?? 'Meine Organisation'}, ${slug}, ${u.id})
                RETURNING id`;
                newOrgId = o.id;

            await trx/*sql*/`INSERT INTO org_members (org_id, user_id, role) VALUES (${o.id}, ${u.id}, 'owner')`;
            await createTrialForOrg(o.id, trx); // gleiche TX
        });

        // ⬇️ Jetzt ist alles committet – erst jetzt Refresh-Token anlegen
        const { access, refresh } = await issueTokenPair(newUserId, newOrgId, undefined, {
            ip: req.ip,
            ua: req.get('user-agent') ?? ''
        });
        setAccessCookie(res, access);
        setRefreshCookie(res, refresh);
        res.status(201).json({ userId: newUserId, orgId: newOrgId });
    } catch (err: any) {
        console.error('[signup] error:', err); // <— kurz aktivieren
        const constraint = err?.constraint ?? '';
        if (constraint.includes('users_email_key') || constraint.includes('users_email_unique_ci')) {
            return res.status(409).json({ error: 'email_exists' });
        }
        if (constraint.includes('orgs_slug_key')) {
            return res.status(409).json({ error: 'org_slug_exists' });
        }
        if (process.env.NODE_ENV !== 'production') {
            return res.status(500).json({ error: 'signup_failed', detail: err?.message, constraint });
        }
        return res.status(500).json({ error: 'signup_failed' });
    }
});

router.post('/auth/login', limiter, requireCsrf, async (req, res) => {
    const { email, password } = req.body as { email: string; password: string; };
    const e = email.trim().toLowerCase();

    const [u] = await sql/*sql*/`SELECT id, password_hash, failed_login_count, locked_until FROM users WHERE email=${e}`;
    if (!u?.password_hash) return res.status(401).json({ error: 'invalid_credentials' });

    if (u.locked_until && new Date(u.locked_until) > new Date()) {
        return res.status(423).json({ error: 'locked' });
    }

    const ok = await verifyPassword(u.password_hash, password);
    if (!ok) {
        await sql`UPDATE users SET failed_login_count=failed_login_count+1,
                               locked_until = CASE WHEN failed_login_count+1 >= 5 THEN now()+interval '15 minutes' ELSE NULL END
             WHERE id=${u.id}`;
        return res.status(401).json({ error: 'invalid_credentials' });
    }

    await sql`UPDATE users SET failed_login_count=0, locked_until=NULL WHERE id=${u.id}`;

    // wähle zuletzt aktive Org oder Owner-Org
    const [m] = await sql/*sql*/`
    SELECT org_id FROM org_members WHERE user_id=${u.id} ORDER BY created_at LIMIT 1`;
    const orgId = m?.org_id ?? null;

    const { access, refresh } = await issueTokenPair(u.id, orgId ?? undefined, undefined, { ip: req.ip, ua: req.get('user-agent') ?? ''});
    setAccessCookie(res, access);
    setRefreshCookie(res, refresh);
    res.json({ userId: u.id, orgId });
});

router.post('/auth/refresh', limiter, async (req, res) => {
    const rt = req.cookies['ko_rt'];
    if (!rt) return res.status(401).json({ error: 'no_refresh' });

    try {
        const payload = verify<JwtRefresh>(rt);
        const hash = hashToken(rt);
        const [row] = await sql/*sql*/`SELECT id, user_id, family_id, revoked_at, expires_at, org_id
                                    FROM refresh_tokens WHERE token_hash=${hash}`;
        if (!row) {
            // reuse: jemand präsentiert alten RT -> gesamte Familie sperren
            await revokeFamily(payload.fam);
            clearAuthCookies(res);
            return res.status(403).json({ error: 'reuse_detected' });
        }
        if (row.revoked_at || new Date(row.expires_at) < new Date()) {
            clearAuthCookies(res);
            return res.status(401).json({ error: 'expired' });
        }

        const { access, refresh, jti } = await rotateRefresh(row.id, row.user_id, row.org_id, row.family_id, { ip: req.ip, ua: req.get('user-agent') ?? ''});
        setAccessCookie(res, access);
        setRefreshCookie(res, refresh);
        res.json({ ok: true, jti });
    } catch {
        clearAuthCookies(res);
        res.status(401).json({ error: 'invalid_refresh' });
    }
});

router.post('/auth/logout', requireCsrf, async (req, res) => {
    const rt = req.cookies['ko_rt'];
    if (rt) {
        try {
            const p = verify<JwtRefresh>(rt);
            await sql`UPDATE refresh_tokens SET revoked_at=now() WHERE id=${p.jti} AND revoked_at IS NULL`;
        } catch { /*ignore*/ }
    }
    clearAuthCookies(res);
    res.json({ ok: true });
});

router.get('/auth/oauth/:provider', limiter, async (req, res) => {
    const { provider } = req.params as { provider: 'google' | 'facebook' };
    const state = rand(24), nonce = rand(24), code_verifier = rand(48);
    const code_challenge = crypto.createHash('sha256').update(code_verifier).digest('base64url');

    const redirect_uri = `${process.env.PUBLIC_URL}/auth/oauth/${provider}/callback`;

    await sql/*sql*/`
    INSERT INTO oauth_states (state, code_verifier, nonce, provider, redirect_uri, expires_at)
    VALUES (${state}, ${code_verifier}, ${nonce}, ${provider}, ${redirect_uri}, now()+interval '10 minutes')`;

    const url =
        provider === 'google'
            ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
            : new URL('https://www.facebook.com/v18.0/dialog/oauth');

    if (provider === 'google') {
        url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
        url.searchParams.set('redirect_uri', redirect_uri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'openid email profile');
        url.searchParams.set('state', state);
        url.searchParams.set('nonce', nonce);
        url.searchParams.set('code_challenge', code_challenge);
        url.searchParams.set('code_challenge_method', 'S256');
    } else {
        // Facebook: OIDC optional – hier minimal
        url.searchParams.set('client_id', process.env.FB_CLIENT_ID!);
        url.searchParams.set('redirect_uri', redirect_uri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'public_profile,email');
        url.searchParams.set('state', state);
        // PKCE für FB nur mit Advanced App-Config möglich; wenn aktiv analog setzen
    }

    res.redirect(url.toString());
});

router.get('/auth/oauth/:provider/callback', limiter, async (req, res) => {
    const { provider } = req.params as { provider: 'google' | 'facebook' };
    const { code, state } = req.query as { code: string; state: string; };

    const [st] = await sql/*sql*/`SELECT * FROM oauth_states WHERE state=${state} AND expires_at > now()`;
    if (!st) return res.status(400).json({ error: 'invalid_state' });

    // Exchange code -> tokens (+ id_token)
    const redirect_uri = st.redirect_uri;
    const tokens = await exchangeCodeForTokens(provider, {
        code, redirect_uri, code_verifier: st.code_verifier
    }); // implementiere: POST token endpoint; returns { id_token, access_token, ... }

    // ... nach exchangeCodeForTokens
    let claims: { sub: string; email?: string; nonce?: string; name?: string };

    if (provider === 'google') {
        const c = await verifyIdToken('google', tokens.id_token); // nonce Prüfung machst du bereits
        claims = c;
    } else {
        // facebook
        const c = await fetchFacebookUser(tokens.access_token);
        claims = c;
    }

    if (claims.nonce !== st.nonce) return res.status(400).json({ error: 'nonce_mismatch' });

    const email = (claims.email || '').toLowerCase();
    const sub = claims.sub as string;

    let userId!: string;

    const existingOAuth = await sql/*sql*/`
    SELECT id FROM users WHERE oauth_provider=${provider} AND oauth_sub=${sub}`;
    if (existingOAuth[0]) {
        userId = existingOAuth[0].id;
    } else {
        // Gibt es E-Mail?
        const [uByEmail] = await sql/*sql*/`SELECT id FROM users WHERE email=${email}`;
        if (uByEmail) {
            // Link auf existierenden Account
            await sql/*sql*/`
        UPDATE users SET oauth_provider=${provider}, oauth_sub=${sub}, email_verified_at=COALESCE(email_verified_at, now())
        WHERE id=${uByEmail.id}`;
            userId = uByEmail.id;
        } else {
            // Neuer User + Org + Trial
            await sql.begin(async (trx) => {
                const [u] = await trx/*sql*/`
          INSERT INTO users (email, email_verified_at, oauth_provider, oauth_sub)
          VALUES (${email}, now(), ${provider}, ${sub})
          RETURNING id`;
                const slug = email.split('@')[0].replace(/[^a-z0-9-]/g,'-').slice(0,40);
                const [o] = await trx/*sql*/`
          INSERT INTO orgs (name, slug, owner_user_id) VALUES (${claims.name ?? 'Meine Organisation'}, ${slug}, ${u.id})
          RETURNING id`;
                await trx/*sql*/`INSERT INTO org_members (org_id, user_id, role) VALUES (${o.id}, ${u.id}, 'owner')`;
                await createTrialForOrg(o.id);
                userId = u.id;
            });
        }
    }

    // wähle eine Org (Owner zuerst)
    const [m] = await sql/*sql*/`
    SELECT org_id FROM org_members WHERE user_id=${userId} ORDER BY (role='owner') DESC, created_at ASC LIMIT 1`;
    const { access, refresh } = await issueTokenPair(userId, m?.org_id, undefined, { ip: req.ip, ua: req.get('user-agent') ?? ''});
    setAccessCookie(res, access);
    setRefreshCookie(res, refresh);

    // Auf Frontend-App zurück
    res.redirect(process.env.APP_AFTER_AUTH_URL ?? '/');
});

export default router;