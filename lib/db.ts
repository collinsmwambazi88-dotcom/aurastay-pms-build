import { Pool, type ClientBase, type QueryResultRow } from "pg"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { attachDatabasePool } from "@vercel/functions"

const signer = new Signer({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN!,
    clientConfig: { region: process.env.AWS_REGION },
  }),
  region: process.env.AWS_REGION,
  hostname: process.env.PGHOST!,
  username: process.env.PGUSER || "postgres",
  port: 5432,
})

const globalForPool = globalThis as unknown as { _auraPool?: Pool }

const pool =
  globalForPool._auraPool ??
  new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE || "postgres",
    port: 5432,
    user: process.env.PGUSER || "postgres",
    password: () => signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
    max: 20,
  })

if (!globalForPool._auraPool) {
  globalForPool._auraPool = pool
  attachDatabasePool(pool)
}

export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params)
}

export async function withConnection<T>(fn: (client: ClientBase) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}
