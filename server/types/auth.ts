
// types/auth.ts
export type JwtAccess = {
    sub: string;        // userId
    orgId?: string;     // aktuelle Org
    iat: number;
    exp: number;
};

export type JwtRefresh = {
    sub: string;        // userId
    fam: string;        // Token-Familie (Rotation)
    jti: string;        // Refresh-Token-ID (row id)
    iat: number;
    exp: number;
};
