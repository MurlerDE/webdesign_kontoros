// lib/oauth.ts
import { JWTVerifyResult, createRemoteJWKSet, jwtVerify } from 'jose';
import { fetch } from 'undici';

type Provider = 'google' | 'facebook';

type ExchangeArgs = {
    code: string;
    redirect_uri: string;
    code_verifier?: string;
};

type TokenResponse = {
    access_token: string;
    id_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
};

export async function exchangeCodeForTokens(
    provider: Provider,
    { code, redirect_uri, code_verifier }: ExchangeArgs
): Promise<TokenResponse> {
    if (provider === 'google') {
        const body = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            code,
            grant_type: 'authorization_code',
            redirect_uri,
            code_verifier: code_verifier ?? ''
        });
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body
        });
        if (!res.ok) throw new Error(`google token exchange failed: ${res.status}`);
        const json = (await res.json()) as TokenResponse;
        return json;
    }

    // facebook (kein OIDC standardmäßig; id_token üblicherweise nicht vorhanden)
    const params = new URLSearchParams({
        client_id: process.env.FB_CLIENT_ID!,
        client_secret: process.env.FB_CLIENT_SECRET!,
        code,
        redirect_uri
    });
    const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`, {
        method: 'GET'
    });
    if (!res.ok) throw new Error(`facebook token exchange failed: ${res.status}`);
    const json = (await res.json()) as TokenResponse;
    return json;
}

type Claims = {
    sub: string;
    email?: string;
    email_verified?: boolean;
    nonce?: string;
    name?: string;
};

export async function verifyIdToken(provider: Provider, idToken?: string): Promise<Claims> {
    if (provider === 'google') {
        if (!idToken) throw new Error('missing id_token for google');
        const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
        const { payload } = (await jwtVerify(idToken, jwks, {
            algorithms: ['RS256'],
            audience: process.env.GOOGLE_CLIENT_ID
        })) as JWTVerifyResult;
        // payload enthält: sub, email, email_verified, nonce, name ...
        return payload as unknown as Claims;
    }

    // facebook: email via Graph API (me?fields=id,name,email)
    // Achtung: email wird nur geliefert, wenn der Nutzer die Berechtigung erteilt hat.
    // Es gibt kein id_token; wir bauen Claims aus dem Graph-Response.
    throw new Error('verifyIdToken not supported for facebook without OIDC'); // bewusst explizit
}

export async function fetchFacebookUser(accessToken: string): Promise<Claims> {
    const res = await fetch('https://graph.facebook.com/v18.0/me?fields=id,name,email', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error(`facebook userinfo failed: ${res.status}`);
    const json = (await res.json()) as { id: string; name?: string; email?: string };
    return { sub: json.id, email: json.email, name: json.name };
}
