// services/db.ts
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
// @ts-ignore
import dotenv from 'dotenv';
import * as pgTypes from 'pg-types';

dotenv.config();

// ----- Type Parsers (optional) -----
pgTypes.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)) as any);   // int8
pgTypes.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)) as any);   // numeric

// ----- Pool Setup -----
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const isSSL =
    process.env.PGSSL?.toLowerCase() === 'true' ||
    process.env.NODE_ENV === 'production' ||
    connectionString.includes('sslmode=require');

export const pool = new Pool({
    connectionString,
    ssl: isSSL ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => console.error('[pg] Pool error', err));

// ----- Types -----
type SQLTag = {
    <T extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]>;
    raw<T extends QueryResultRow = QueryResultRow>(text: string, values?: any[]): Promise<QueryResult<T>>;
    one<T extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: any[]): Promise<T>;
    maybeOne<T extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: any[]): Promise<T | null>;
    begin<T>(fn: (trx: SQLTransaction) => Promise<T>): Promise<T>;
    end(): Promise<void>;
};

type SQLTransaction = {
    <T extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]>;
    raw<T extends QueryResultRow = QueryResultRow>(text: string, values?: any[]): Promise<QueryResult<T>>;
    one<T extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: any[]): Promise<T>;
    maybeOne<T extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: any[]): Promise<T | null>;
};

// ----- Helpers -----
function toText(strings: TemplateStringsArray, values: any[]) {
    let text = '';
    const params: any[] = [];
    for (let i = 0; i < strings.length; i++) {
        text += strings[i];
        if (i < values.length) {
            params.push(values[i]);
            text += `$${params.length}`;
        }
    }
    return { text, values: params };
}

// ----- Core on Pool -----
async function run<T extends QueryResultRow = QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: any[]
): Promise<T[]> {
    const { text, values: params } = toText(strings, values);
    const res = await pool.query<T>(text, params);
    return res.rows;
}

async function raw<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: any[],
): Promise<QueryResult<T>> {
    return pool.query<T>(text, values);
}

async function one<T extends QueryResultRow = QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: any[]
): Promise<T> {
    const rows = await run<T>(strings, ...values);
    if (rows.length !== 1) throw new Error(`Expected exactly 1 row, got ${rows.length}`);
    return rows[0];
}

async function maybeOne<T extends QueryResultRow = QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: any[]
): Promise<T | null> {
    const rows = await run<T>(strings, ...values);
    if (rows.length === 0) return null;
    if (rows.length > 1) throw new Error(`Expected 0 or 1 row, got ${rows.length}`);
    return rows[0];
}

// ----- Transactions -----
async function begin<T>(fn: (trx: SQLTransaction) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const trxRun = async <R extends QueryResultRow = QueryResultRow>(
            strings: TemplateStringsArray,
            ...values: any[]
        ): Promise<R[]> => {
            const { text, values: params } = toText(strings, values);
            const res = await client.query<R>(text, params);
            return res.rows;
        };

        const trxRaw = async <R extends QueryResultRow = QueryResultRow>(
            text: string,
            values?: any[],
        ): Promise<QueryResult<R>> => client.query<R>(text, values);

        const trxOne = async <R extends QueryResultRow = QueryResultRow>(
            strings: TemplateStringsArray,
            ...values: any[]
        ): Promise<R> => {
            const rows = await trxRun<R>(strings, ...values);
            if (rows.length !== 1) throw new Error(`Expected exactly 1 row, got ${rows.length}`);
            return rows[0];
        };

        const trxMaybeOne = async <R extends QueryResultRow = QueryResultRow>(
            strings: TemplateStringsArray,
            ...values: any[]
        ): Promise<R | null> => {
            const rows = await trxRun<R>(strings, ...values);
            if (rows.length === 0) return null;
            if (rows.length > 1) throw new Error(`Expected 0 or 1 row, got ${rows.length}`);
            return rows[0];
        };

        const trx: SQLTransaction = Object.assign(trxRun, {
            raw: trxRaw,
            one: trxOne,
            maybeOne: trxMaybeOne,
        });

        const out = await fn(trx);
        await client.query('COMMIT');
        return out;
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch {}
        throw err;
    } finally {
        client.release();
    }
}

// ----- Export -----
export type { SQLTag, SQLTransaction };
export const sql: SQLTag = Object.assign(run, {
    raw,
    one,
    maybeOne,
    begin,
    end: () => pool.end(),
});
