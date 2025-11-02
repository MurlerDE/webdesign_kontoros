// services/tokens.ts
import { sql } from './db';
import { hashToken, rand } from '../lib/crypto';
import { signAccess, signRefresh } from '../lib/jwt';

export async function issueTokenPair(userId: string, orgId?: string, familyId?: string, ctx?: {ip?:string; ua?:string}) {
    const fam = familyId ?? crypto.randomUUID();
    const jti = crypto.randomUUID();
    const refreshPayload = { sub: userId, fam, jti };
    const refresh = signRefresh(refreshPayload);
    const access  = signAccess({ sub: userId, orgId });

    await sql/*sql*/`
    INSERT INTO refresh_tokens (id, user_id, org_id, token_hash, family_id, expires_at, ip, user_agent)
    VALUES (${jti}, ${userId}, ${orgId ?? null}, ${hashToken(refresh)}, ${fam},
            now() + interval '30 days', ${ctx?.ip ?? null}, ${ctx?.ua ?? null})`;

    return { access, refresh, jti, fam };
}

export async function rotateRefresh(oldJti: string, userId: string, orgId?: string, familyId?: string, ctx?:{ip?:string;ua?:string}) {
    // revoke old
    await sql`UPDATE refresh_tokens SET revoked_at = now() WHERE id=${oldJti} AND revoked_at IS NULL`;
    // issue new
    return issueTokenPair(userId, orgId, familyId, ctx);
}

export async function revokeFamily(fam: string) {
    await sql`UPDATE refresh_tokens SET revoked_at = now() WHERE family_id=${fam} AND revoked_at IS NULL`;
}
