// services/subscription.ts
import { sql } from './db'; // dein Query-Helper

// services/subscription.ts
import { sql as poolSql, SQLTag, SQLTransaction } from './db';

type SqlExec = SQLTag | SQLTransaction;

export async function createTrialForOrg(orgId: string, exec: SqlExec = poolSql) {
    const trialStart = new Date();
    const trialEnd   = new Date(Date.now() + 7*24*60*60*1000);
    const graceEnd   = new Date(trialEnd.getTime() + 3*24*60*60*1000);

    await exec/*sql*/`
    INSERT INTO org_subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at, grace_ends_at)
    VALUES (${orgId}, 'starter', 'trialing', ${trialStart}, ${trialEnd}, ${graceEnd})`;
}

export async function isOrgActive(orgId: string) {
    const r = await sql/*sql*/`
    SELECT status, trial_ends_at, grace_ends_at, current_period_end
    FROM org_subscriptions WHERE org_id=${orgId}`;
    if (!r[0]) return false;
    const now = new Date();
    const { status, trial_ends_at, grace_ends_at, current_period_end } = r[0];
    if (status === 'active' && current_period_end && now < current_period_end) return true;
    if (status === 'trialing' && now < trial_ends_at) return true;
    if (grace_ends_at && now < grace_ends_at) return true;
    return false;
}
